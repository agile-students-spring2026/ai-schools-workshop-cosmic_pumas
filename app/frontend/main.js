const appNode = document.querySelector('#app');
const refreshDataButton = document.querySelector('#refreshDataButton');
const dataBadgeNode = document.querySelector('#dataBadge');
const globalStatusNode = document.querySelector('#globalStatus');

const STORAGE_KEY = 'district-lens-saved-compare';
const RESULT_LIMIT = 24;

const state = {
  filters: {
    search: '',
    state: '',
    locale: '',
    minScore: '0',
    sort: 'resource_index',
    direction: 'desc',
  },
  savedIds: loadSavedIds(),
  dataMeta: null,
};

function loadSavedIds() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSavedIds() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.savedIds));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value || 0);
}

function formatDecimal(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function gradeSpan(district) {
  return `${district.grade_low}-${district.grade_high}`;
}

function getRoute() {
  const path = window.location.pathname;
  if (path.startsWith('/district/')) {
    return {
      type: 'detail',
      districtId: decodeURIComponent(path.replace('/district/', '')),
    };
  }

  if (path === '/compare') {
    const params = new URLSearchParams(window.location.search);
    const ids = params.get('ids');
    return {
      type: 'compare',
      districtIds: ids ? ids.split(',').filter(Boolean) : state.savedIds,
    };
  }

  return { type: 'home' };
}

function buildQueryString() {
  const params = new URLSearchParams();
  Object.entries({
    ...state.filters,
    limit: RESULT_LIMIT,
  }).forEach(([key, value]) => {
    if (value && value !== '0') {
      params.set(key, value);
    }
  });

  if (!params.has('limit')) {
    params.set('limit', RESULT_LIMIT);
  }

  return params.toString();
}

async function apiJson(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }
  return response.json();
}

function setGlobalStatus(message) {
  globalStatusNode.textContent = message;
}

function updateDataBadge(meta) {
  if (!meta) {
    dataBadgeNode.textContent = '';
    return;
  }

  const mode = meta.source_mode === 'fallback' ? 'Fallback sample' : 'NCES cache';
  dataBadgeNode.textContent = `${mode} · ${formatNumber(meta.record_count || 0)} districts · ${meta.dataset_year || 'n/a'}`;
}

function isSaved(districtId) {
  return state.savedIds.includes(districtId);
}

function toggleSavedDistrict(districtId) {
  if (isSaved(districtId)) {
    state.savedIds = state.savedIds.filter((id) => id !== districtId);
  } else {
    state.savedIds = [...state.savedIds, districtId].slice(0, 6);
  }

  saveSavedIds();
  renderRoute();
}

function navigate(path) {
  window.history.pushState({}, '', path);
  renderRoute();
}

function summaryCards(summary, meta) {
  return `
    <section class="metrics">
      <article class="panel metric-card">
        <span>Districts matched</span>
        <strong>${formatNumber(summary.district_count)}</strong>
        <p>Filtered from the ${meta.record_count ? formatNumber(meta.record_count) : 'current'}-district dataset.</p>
      </article>
      <article class="panel metric-card">
        <span>Average resource index</span>
        <strong>${formatDecimal(summary.average_score)}</strong>
        <p>Derived from staffing ratio, teacher density, school count, and grade span continuity.</p>
      </article>
      <article class="panel metric-card">
        <span>Lowest staffing ratio</span>
        <strong>${summary.lowest_ratio_district ? `${formatDecimal(summary.lowest_ratio_district.student_teacher_ratio)}:1` : 'n/a'}</strong>
        <p>${summary.lowest_ratio_district ? escapeHtml(summary.lowest_ratio_district.district_name) : 'No district available'}.</p>
      </article>
    </section>
    <section class="panel resource-note">
      <span class="eyebrow">What The Resource Index Means</span>
      <p>The resource index is a quick structural signal, not a school-quality grade. Higher values generally mean more teachers relative to students, broader grade coverage, and more schools and staffing capacity inside the district.</p>
    </section>
  `;
}

function savedTrayTemplate(savedDistricts) {
  const items = savedDistricts.length
    ? savedDistricts
        .map(
          (district) => `
            <li>
              <span>
                <strong>${escapeHtml(district.district_name)}</strong>
                <small>${escapeHtml(district.state)} · ${formatDecimal(district.resource_index)} index</small>
              </span>
              <button type="button" class="ghost-button" data-remove-saved="${district.id}">Remove</button>
            </li>
          `,
        )
        .join('')
    : '<li class="empty-item">No saved districts yet. Save a few cards to compare them side by side.</li>';

  return `
    <section class="panel saved-panel">
      <div class="saved-header">
        <div>
          <span class="eyebrow">Saved compare set</span>
          <h3>${savedDistricts.length} districts ready</h3>
        </div>
        <button type="button" class="secondary small" data-open-compare ${savedDistricts.length < 2 ? 'disabled' : ''}>Open compare view</button>
      </div>
      <ul class="saved-list">${items}</ul>
    </section>
  `;
}

function resultCardTemplate(district) {
  return `
    <article class="panel result-card">
      <div class="result-header">
        <div>
          <span class="eyebrow">${escapeHtml(district.state_name)} · ${escapeHtml(district.county_name)}</span>
          <h3>${escapeHtml(district.district_name)}</h3>
          <p>${escapeHtml(district.locale)} · ${escapeHtml(district.lea_type)}</p>
        </div>
        <div class="score-pill">${formatDecimal(district.resource_index)}</div>
      </div>
      <div class="result-meta">
        <span>${formatNumber(district.enrollment)} students</span>
        <span>${formatDecimal(district.teacher_count)} teachers</span>
        <span>${formatDecimal(district.student_teacher_ratio)}:1 ratio</span>
        <span>${formatNumber(district.school_count)} schools</span>
      </div>
      <div class="result-stats">
        <div class="stat">
          <span>Grade span</span>
          <strong>${escapeHtml(gradeSpan(district))}</strong>
        </div>
        <div class="stat">
          <span>Office city</span>
          <strong>${escapeHtml(district.office_city || 'n/a')}</strong>
        </div>
        <div class="stat">
          <span>Metro area</span>
          <strong>${escapeHtml(district.metro_area || 'n/a')}</strong>
        </div>
        <div class="stat">
          <span>Charter status</span>
          <strong>${escapeHtml(district.charter_status)}</strong>
        </div>
      </div>
      <div class="card-actions">
        <a href="/district/${encodeURIComponent(district.id)}" class="action-link" data-link>View details</a>
        <button type="button" class="secondary small" data-toggle-save="${district.id}">${isSaved(district.id) ? 'Remove from compare' : 'Save to compare'}</button>
      </div>
    </article>
  `;
}

function controlsTemplate(facets) {
  const stateOptions = facets.states
    .map((stateValue) => `<option value="${escapeHtml(stateValue)}" ${state.filters.state === stateValue ? 'selected' : ''}>${escapeHtml(stateValue)}</option>`)
    .join('');
  const localeOptions = facets.locales
    .map((localeValue) => `<option value="${escapeHtml(localeValue)}" ${state.filters.locale === localeValue ? 'selected' : ''}>${escapeHtml(localeValue)}</option>`)
    .join('');

  return `
    <aside class="panel controls">
      <div class="control-group">
        <label for="search">Search district, state, county, or locale</label>
        <input id="search" type="search" value="${escapeHtml(state.filters.search)}" placeholder="Try Fairfax, Virginia, or Suburb: Large">
        <span class="control-hint">Type your search and press Enter to apply it.</span>
      </div>
      <div class="control-group">
        <label for="state">State</label>
        <select id="state">
          <option value="">All states</option>
          ${stateOptions}
        </select>
      </div>
      <div class="control-group">
        <label for="locale">Locale</label>
        <select id="locale">
          <option value="">All locales</option>
          ${localeOptions}
        </select>
      </div>
      <div class="control-group">
        <label for="minScore">Minimum resource index</label>
        <input id="minScore" type="range" min="0" max="100" step="5" value="${escapeHtml(state.filters.minScore)}">
        <span class="range-caption">${escapeHtml(state.filters.minScore)}+</span>
      </div>
      <div class="control-group">
        <label for="sort">Sort by</label>
        <select id="sort">
          <option value="resource_index" ${state.filters.sort === 'resource_index' ? 'selected' : ''}>Resource index</option>
          <option value="student_teacher_ratio" ${state.filters.sort === 'student_teacher_ratio' ? 'selected' : ''}>Student-teacher ratio</option>
          <option value="teacher_count" ${state.filters.sort === 'teacher_count' ? 'selected' : ''}>Teacher count</option>
          <option value="enrollment" ${state.filters.sort === 'enrollment' ? 'selected' : ''}>Enrollment</option>
          <option value="school_count" ${state.filters.sort === 'school_count' ? 'selected' : ''}>School count</option>
          <option value="district_name" ${state.filters.sort === 'district_name' ? 'selected' : ''}>District name</option>
        </select>
      </div>
      <div class="control-group">
        <label for="direction">Direction</label>
        <select id="direction">
          <option value="desc" ${state.filters.direction === 'desc' ? 'selected' : ''}>Highest first</option>
          <option value="asc" ${state.filters.direction === 'asc' ? 'selected' : ''}>Lowest first</option>
        </select>
      </div>
      <button type="button" class="secondary" data-reset-filters>Reset filters</button>
      <p class="helper-copy">The resource index is a structural proxy. It is useful for triage, not a replacement for academic or community context.</p>
    </aside>
  `;
}

function renderHome(payload, savedDistricts) {
  state.dataMeta = payload.meta;
  updateDataBadge(payload.meta);
  const cards = payload.districts.length
    ? payload.districts.map(resultCardTemplate).join('')
    : `
      <section class="panel empty-state">
        <h2>No districts match those filters.</h2>
        <p>Clear the state or locale filter, or lower the resource index threshold.</p>
      </section>
    `;

  appNode.innerHTML = `
    <section class="hero">
      <span class="kicker">Parents + Educators</span>
      <h1>Compare real district structure before you compare school culture.</h1>
      <p>This explorer now loads from public NCES district datasets, caches a normalized copy locally, and lets you save districts into a reusable compare set.</p>
    </section>
    <section class="layout">
      ${controlsTemplate(payload.facets)}
      <section class="content-column">
        ${summaryCards(payload.summary, payload.meta)}
        ${savedTrayTemplate(savedDistricts)}
        <section class="results">${cards}</section>
      </section>
    </section>
  `;
}

function detailMetric(label, value) {
  return `
    <div class="stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderDetail(payload) {
  const district = payload.district;
  state.dataMeta = payload.meta;
  updateDataBadge(payload.meta);

  const peerCards = payload.peers.length
    ? payload.peers
        .map(
          (peer) => `
            <article class="panel peer-card">
              <h3>${escapeHtml(peer.district_name)}</h3>
              <p>${escapeHtml(peer.state)} · ${escapeHtml(peer.locale)}</p>
              <p>${formatDecimal(peer.resource_index)} index · ${formatDecimal(peer.student_teacher_ratio)}:1 ratio</p>
              <a href="/district/${encodeURIComponent(peer.id)}" data-link>View peer</a>
            </article>
          `,
        )
        .join('')
    : '<div class="panel empty-state"><p>No peer districts available in this state.</p></div>';

  appNode.innerHTML = `
    <section class="detail-shell">
      <a href="/" class="back-link" data-link>Back to explorer</a>
      <section class="panel detail-hero">
        <div>
          <span class="eyebrow">${escapeHtml(district.state_name)} · ${escapeHtml(district.county_name)}</span>
          <h1>${escapeHtml(district.district_name)}</h1>
          <p>${escapeHtml(district.locale)} · ${escapeHtml(district.lea_type)}</p>
        </div>
        <div class="detail-actions">
          <div class="score-pill large">${formatDecimal(district.resource_index)}</div>
          <button type="button" class="secondary small" data-toggle-save="${district.id}">${isSaved(district.id) ? 'Remove from compare' : 'Save to compare'}</button>
          ${district.website ? `<a href="${escapeHtml(district.website)}" class="action-link" target="_blank" rel="noreferrer">District website</a>` : ''}
        </div>
      </section>
      <section class="detail-grid">
        <article class="panel detail-card">
          <h2>District profile</h2>
          <div class="result-stats detail-stats">
            ${detailMetric('Enrollment', formatNumber(district.enrollment))}
            ${detailMetric('Teachers', formatDecimal(district.teacher_count))}
            ${detailMetric('Student-teacher ratio', `${formatDecimal(district.student_teacher_ratio)}:1`)}
            ${detailMetric('School count', formatNumber(district.school_count))}
            ${detailMetric('Grade span', gradeSpan(district))}
            ${detailMetric('Office city', district.office_city || 'n/a')}
            ${detailMetric('Metro area', district.metro_area || 'n/a')}
            ${detailMetric('Charter status', district.charter_status)}
          </div>
        </article>
        <article class="panel detail-card">
          <h2>Contact and source</h2>
          <div class="detail-copy">
            <p><strong>Phone:</strong> ${escapeHtml(district.phone || 'n/a')}</p>
            <p><strong>Address:</strong> ${escapeHtml(`${district.office_city || ''}, ${district.office_state || ''} ${district.office_zip || ''}`.trim() || 'n/a')}</p>
            <p><strong>Dataset:</strong> ${escapeHtml(payload.meta.source_label || 'Unknown')}</p>
            <p><strong>Year:</strong> ${escapeHtml(district.school_year || payload.meta.dataset_year || 'n/a')}</p>
            <p><strong>Coordinates:</strong> ${formatDecimal(district.latitude)}, ${formatDecimal(district.longitude)}</p>
          </div>
        </article>
      </section>
      <section class="peer-grid">
        <div class="section-heading">
          <span class="eyebrow">Same-state peers</span>
          <h2>Comparable districts nearby in the dataset</h2>
        </div>
        <div class="compare-grid">${peerCards}</div>
      </section>
    </section>
  `;
}

function compareMetricRow(label, renderValue) {
  return `
    <tr>
      <th>${escapeHtml(label)}</th>
      ${renderValue}
    </tr>
  `;
}

function renderCompare(payload) {
  state.dataMeta = payload.meta;
  updateDataBadge(payload.meta);

  if (payload.districts.length < 2) {
    appNode.innerHTML = `
      <section class="detail-shell">
        <a href="/" class="back-link" data-link>Back to explorer</a>
        <section class="panel empty-state">
          <h1>Saved comparison needs at least two districts.</h1>
          <p>Save a few districts from the explorer and return here.</p>
        </section>
      </section>
    `;
    return;
  }

  const shareIds = payload.districts.map((district) => district.id).join(',');
  const shareUrl = `${window.location.origin}/compare?ids=${shareIds}`;
  const rows = [
    ['Resource index', (district) => formatDecimal(district.resource_index)],
    ['Enrollment', (district) => formatNumber(district.enrollment)],
    ['Teachers', (district) => formatDecimal(district.teacher_count)],
    ['Student-teacher ratio', (district) => `${formatDecimal(district.student_teacher_ratio)}:1`],
    ['School count', (district) => formatNumber(district.school_count)],
    ['Grade span', (district) => gradeSpan(district)],
    ['Locale', (district) => district.locale],
    ['County', (district) => district.county_name],
    ['Metro area', (district) => district.metro_area || 'n/a'],
  ];

  const headerCells = payload.districts
    .map(
      (district) => `
        <th>
          <a href="/district/${encodeURIComponent(district.id)}" data-link>${escapeHtml(district.district_name)}</a>
          <small>${escapeHtml(district.state)} · ${escapeHtml(district.locale)}</small>
        </th>
      `,
    )
    .join('');

  const bodyRows = rows
    .map(([label, renderValue]) => compareMetricRow(label, payload.districts.map((district) => `<td>${escapeHtml(renderValue(district))}</td>`).join('')))
    .join('');

  appNode.innerHTML = `
    <section class="detail-shell">
      <a href="/" class="back-link" data-link>Back to explorer</a>
      <section class="panel compare-hero">
        <div>
          <span class="eyebrow">Saved comparison</span>
          <h1>Side-by-side structural comparison</h1>
          <p>Shareable link included. The compare set persists in local storage until you remove districts.</p>
        </div>
        <div class="detail-actions">
          <button type="button" class="secondary small" data-copy-link="${escapeHtml(shareUrl)}">Copy share link</button>
        </div>
      </section>
      <section class="panel compare-table-wrap">
        <table class="compare-table wide">
          <thead>
            <tr>
              <th>Metric</th>
              ${headerCells}
            </tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </section>
    </section>
  `;
}

async function loadHome() {
  setGlobalStatus('Loading district data...');
  const [payload, savedPayload] = await Promise.all([
    apiJson(`/api/districts?${buildQueryString()}`),
    state.savedIds.length
      ? apiJson(`/api/comparisons?ids=${encodeURIComponent(state.savedIds.join(','))}`)
      : Promise.resolve({ districts: [] }),
  ]);
  renderHome(payload, savedPayload.districts);
  setGlobalStatus(`${formatNumber(payload.summary.district_count)} districts match the current filters.`);
}

async function loadDetail(districtId) {
  setGlobalStatus('Loading district detail...');
  const payload = await apiJson(`/api/districts/${encodeURIComponent(districtId)}`);
  renderDetail(payload);
  setGlobalStatus(`Viewing ${payload.district.district_name}.`);
}

async function loadCompare(districtIds) {
  setGlobalStatus('Loading saved comparison...');
  const ids = districtIds.join(',');
  const payload = await apiJson(`/api/comparisons?ids=${encodeURIComponent(ids)}`);
  renderCompare(payload);
  setGlobalStatus(`Loaded ${payload.districts.length} districts for comparison.`);
}

let homeReloadTimer = null;

function scheduleHomeReload() {
  window.clearTimeout(homeReloadTimer);
  homeReloadTimer = window.setTimeout(() => {
    if (getRoute().type === 'home') {
      loadHome().catch(renderFailure);
    }
  }, 180);
}

function resetFilters() {
  state.filters = {
    search: '',
    state: '',
    locale: '',
    minScore: '0',
    sort: 'resource_index',
    direction: 'desc',
  };
  renderRoute();
}

async function refreshData() {
  setGlobalStatus('Refreshing the local NCES cache...');
  try {
    const meta = await apiJson('/api/data/refresh', { method: 'POST' });
    updateDataBadge(meta);
    setGlobalStatus(`NCES cache refreshed at ${meta.last_refreshed}.`);
    renderRoute();
  } catch (error) {
    renderFailure(error);
  }
}

function renderFailure(error) {
  appNode.innerHTML = `
    <section class="detail-shell">
      <section class="panel empty-state">
        <h1>Unable to load the app state.</h1>
        <p>${escapeHtml(error.message || 'Unexpected error')}</p>
      </section>
    </section>
  `;
  setGlobalStatus('The request failed.');
}

async function renderRoute() {
  const route = getRoute();
  try {
    if (route.type === 'detail') {
      await loadDetail(route.districtId);
      return;
    }

    if (route.type === 'compare') {
      await loadCompare(route.districtIds);
      return;
    }

    await loadHome();
  } catch (error) {
    renderFailure(error);
  }
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-link]');
  if (link) {
    event.preventDefault();
    navigate(link.getAttribute('href'));
    return;
  }

  const saveButton = event.target.closest('[data-toggle-save]');
  if (saveButton) {
    toggleSavedDistrict(saveButton.getAttribute('data-toggle-save'));
    return;
  }

  const removeButton = event.target.closest('[data-remove-saved]');
  if (removeButton) {
    toggleSavedDistrict(removeButton.getAttribute('data-remove-saved'));
    return;
  }

  if (event.target.closest('[data-reset-filters]')) {
    resetFilters();
    return;
  }

  if (event.target.closest('[data-open-compare]')) {
    navigate(`/compare?ids=${state.savedIds.join(',')}`);
    return;
  }

  const copyButton = event.target.closest('[data-copy-link]');
  if (copyButton && navigator.clipboard) {
    navigator.clipboard.writeText(copyButton.getAttribute('data-copy-link')).then(() => {
      setGlobalStatus('Comparison link copied to clipboard.');
    });
  }
});

document.addEventListener('input', (event) => {
  if (getRoute().type !== 'home') {
    return;
  }

  if (event.target.id === 'minScore') {
    state.filters.minScore = event.target.value;
    scheduleHomeReload();
  }
});

document.addEventListener('keydown', (event) => {
  if (getRoute().type !== 'home') {
    return;
  }

  if (event.target.id === 'search' && event.key === 'Enter') {
    event.preventDefault();
    state.filters.search = event.target.value.trim();
    loadHome().catch(renderFailure);
  }
});

document.addEventListener('change', (event) => {
  if (getRoute().type !== 'home') {
    return;
  }

  if (event.target.id === 'state') {
    state.filters.state = event.target.value;
  }

  if (event.target.id === 'locale') {
    state.filters.locale = event.target.value;
  }

  if (event.target.id === 'sort') {
    state.filters.sort = event.target.value;
  }

  if (event.target.id === 'direction') {
    state.filters.direction = event.target.value;
  }

  scheduleHomeReload();
});

refreshDataButton.addEventListener('click', refreshData);
window.addEventListener('popstate', renderRoute);

renderRoute();
