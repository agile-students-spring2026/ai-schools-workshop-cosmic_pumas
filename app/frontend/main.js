const controls = {
	search: document.querySelector('#search'),
	state: document.querySelector('#state'),
	locale: document.querySelector('#locale'),
	minScore: document.querySelector('#minScore'),
	sort: document.querySelector('#sort'),
	direction: document.querySelector('#direction'),
	resetButton: document.querySelector('#resetButton'),
};

const summaryNode = document.querySelector('#summary');
const resultsNode = document.querySelector('#results');
const compareNode = document.querySelector('#compare');
const statusNode = document.querySelector('#status');
const minScoreValueNode = document.querySelector('#minScoreValue');

let districts = [];

function formatCurrency(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(value);
}

function formatNumber(value) {
	return new Intl.NumberFormat('en-US').format(value);
}

function formatMetricValue(key, value) {
	if (key === 'per_student_spending') {
		return formatCurrency(value);
	}

	if (key === 'student_teacher_ratio') {
		return `${value}:1`;
	}

	if (key === 'parent_fit_score') {
		return value;
	}

	return `${value}%`;
}

function buildQueryString() {
	const params = new URLSearchParams();

	Object.entries({
		search: controls.search.value.trim(),
		state: controls.state.value,
		locale: controls.locale.value,
		minScore: controls.minScore.value,
		sort: controls.sort.value,
		direction: controls.direction.value,
	}).forEach(([key, value]) => {
		if (value && value !== '0') {
			params.set(key, value);
		}
	});

	return params.toString();
}

function renderSummary(summary) {
	const cards = [
		{
			label: 'Districts matched',
			value: summary.district_count,
			note: 'Current results after filters',
		},
		{
			label: 'Average fit score',
			value: summary.average_score,
			note: 'Weighted from academics, equity, and attendance',
		},
		{
			label: 'Top scoring state',
			value: summary.top_state || 'N/A',
			note: summary.best_value_district ? `Best value: ${summary.best_value_district.district_name}` : 'No value signal yet',
		},
	];

	summaryNode.innerHTML = cards
		.map(
			(card) => `
				<article class="panel metric-card">
					<span>${card.label}</span>
					<strong>${card.value}</strong>
					<p>${card.note}</p>
				</article>
			`,
		)
		.join('');
}

function renderResults(items) {
	if (!items.length) {
		resultsNode.innerHTML = `
			<section class="panel empty-state">
				<h2>No districts match those filters.</h2>
				<p>Try widening the score threshold or clearing the state and locale filters.</p>
			</section>
		`;
		compareNode.innerHTML = '';
		return;
	}

	resultsNode.innerHTML = items
		.map(
			(district) => `
				<article class="panel result-card">
					<div class="result-header">
						<div>
							<h2>${district.district_name}</h2>
							<p>${district.state} · ${district.locale}</p>
							<span class="badge">${district.source}</span>
						</div>
						<div class="score-pill">${district.parent_fit_score}</div>
					</div>
					<div class="result-meta">
						<span>${formatNumber(district.enrollment)} students</span>
						<span>${district.graduation_rate}% graduation</span>
						<span>${district.student_teacher_ratio}:1 ratio</span>
						<span>${district.chronic_absenteeism}% chronic absenteeism</span>
					</div>
					<div class="result-stats">
						<div class="stat">
							<span>Math proficiency</span>
							<strong>${district.math_proficiency}%</strong>
						</div>
						<div class="stat">
							<span>Reading proficiency</span>
							<strong>${district.reading_proficiency}%</strong>
						</div>
						<div class="stat">
							<span>Spending per student</span>
							<strong>${formatCurrency(district.per_student_spending)}</strong>
						</div>
						<div class="stat">
							<span>Average teacher salary</span>
							<strong>${formatCurrency(district.teacher_salary)}</strong>
						</div>
					</div>
				</article>
			`,
		)
		.join('');

	renderComparison(items.slice(0, 2));
}

function renderComparison(items) {
	if (items.length < 2) {
		compareNode.innerHTML = '';
		return;
	}

	const metrics = [
		['Parent fit score', 'parent_fit_score'],
		['Graduation rate', 'graduation_rate'],
		['Math proficiency', 'math_proficiency'],
		['Reading proficiency', 'reading_proficiency'],
		['Student-teacher ratio', 'student_teacher_ratio'],
		['Per-student spending', 'per_student_spending'],
	];

	compareNode.innerHTML = items
		.map(
			(district) => `
				<article class="panel compare-card">
					<h3>${district.district_name}</h3>
					<p>${district.state} · ${district.locale}</p>
					<table class="compare-table">
						<tbody>
							${metrics
								.map(([label, key]) => {
									const value = formatMetricValue(key, district[key]);
									return `<tr><th>${label}</th><td>${value}</td></tr>`;
								})
								.join('')}
						</tbody>
					</table>
				</article>
			`,
		)
		.join('');
}

async function loadDistricts() {
	statusNode.textContent = 'Loading district data...';

	try {
		const query = buildQueryString();
		const response = await fetch(`/api/districts${query ? `?${query}` : ''}`);

		if (!response.ok) {
			throw new Error('Request failed');
		}

		const payload = await response.json();
		districts = payload.districts;

		renderSummary(payload.summary);
		renderResults(districts);
		statusNode.textContent = `${districts.length} districts loaded.`;
	} catch (error) {
		summaryNode.innerHTML = '';
		resultsNode.innerHTML = `
			<section class="panel empty-state">
				<h2>Unable to load district data.</h2>
				<p>Make sure the Flask backend is running and try again.</p>
			</section>
		`;
		compareNode.innerHTML = '';
		statusNode.textContent = 'The API is unavailable.';
	}
}

function populateStates() {
	const states = [...new Set(districts.map((district) => district.state))].sort();
	const existingValue = controls.state.value;

	controls.state.innerHTML = '<option value="">All states</option>';
	states.forEach((state) => {
		const option = document.createElement('option');
		option.value = state;
		option.textContent = state;
		controls.state.append(option);
	});

	controls.state.value = existingValue;
}

async function initialize() {
	await loadDistricts();
	populateStates();
}

Object.values(controls)
	.filter((element) => element !== controls.resetButton)
	.forEach((element) => {
		element.addEventListener('input', () => {
			minScoreValueNode.textContent = `${controls.minScore.value}+`;
			loadDistricts();
		});
		element.addEventListener('change', loadDistricts);
	});

controls.resetButton.addEventListener('click', () => {
	controls.search.value = '';
	controls.state.value = '';
	controls.locale.value = '';
	controls.minScore.value = '0';
	controls.sort.value = 'parent_fit_score';
	controls.direction.value = 'desc';
	minScoreValueNode.textContent = '0+';
	loadDistricts();
});

initialize();
