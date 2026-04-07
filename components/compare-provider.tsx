'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react'
import type { DistrictSummary } from '@/lib/contracts/schemas'
import {
  MAX_COMPARE_DISTRICTS,
  normalizeCompareIds
} from '@/lib/compare-selection'

const STORAGE_KEY = 'district-compare-selection'

type CompareContextValue = {
  canAddMore: boolean
  selectedDistricts: DistrictSummary[]
  selectedIds: string[]
  clearSelections: () => void
  isSelected: (districtId: string) => boolean
  removeDistrict: (districtId: string) => void
  toggleDistrict: (districtId: string) => void
}

const CompareContext = createContext<CompareContextValue | null>(null)

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function CompareProvider({
  allDistricts,
  children
}: {
  allDistricts: DistrictSummary[]
  children: ReactNode
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isReady, setIsReady] = useState(false)
  const [validDistrictIds] = useState(
    () => new Set(allDistricts.map(district => district.id))
  )

  function sanitizeIds(ids: string[]) {
    return normalizeCompareIds(ids.filter(id => validDistrictIds.has(id)))
  }

  useEffect(() => {
    setIsReady(true)

    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY)

      if (!storedValue) {
        return
      }

      const parsed = JSON.parse(storedValue)
      const nextIds = sanitizeIds(
        Array.isArray(parsed) ? parsed.filter(isString) : []
      )
      setSelectedIds(nextIds)
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (!isReady) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds))
  }, [isReady, selectedIds])

  const selectedDistricts = selectedIds
    .map(id => allDistricts.find(district => district.id === id) ?? null)
    .filter((district): district is DistrictSummary => district !== null)

  function toggleDistrict(districtId: string) {
    if (!validDistrictIds.has(districtId)) {
      return
    }

    setSelectedIds(currentIds => {
      if (currentIds.includes(districtId)) {
        return currentIds.filter(id => id !== districtId)
      }

      return sanitizeIds([...currentIds, districtId])
    })
  }

  function removeDistrict(districtId: string) {
    setSelectedIds(currentIds => currentIds.filter(id => id !== districtId))
  }

  function clearSelections() {
    setSelectedIds([])
  }

  return (
    <CompareContext.Provider
      value={{
        canAddMore: selectedIds.length < MAX_COMPARE_DISTRICTS,
        selectedDistricts,
        selectedIds,
        clearSelections,
        isSelected: districtId => selectedIds.includes(districtId),
        removeDistrict,
        toggleDistrict
      }}
    >
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const context = useContext(CompareContext)

  if (!context) {
    throw new Error('useCompare must be used within CompareProvider.')
  }

  return context
}
