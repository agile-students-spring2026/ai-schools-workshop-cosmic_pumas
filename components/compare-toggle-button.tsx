'use client'

import { useCompare } from '@/components/compare-provider'

type CompareToggleButtonProps = {
  districtId: string
  className?: string
}

export function CompareToggleButton({
  districtId,
  className
}: CompareToggleButtonProps) {
  const { canAddMore, isSelected, toggleDistrict } = useCompare()
  const selected = isSelected(districtId)
  const disabled = !selected && !canAddMore
  const label = selected
    ? 'Remove from compare'
    : disabled
      ? 'Compare tray full'
      : 'Add to compare'

  return (
    <button
      aria-pressed={selected}
      className={className}
      disabled={disabled}
      type='button'
      onClick={() => toggleDistrict(districtId)}
    >
      {label}
    </button>
  )
}
