export interface HyperparamConfig {
  key: string
  label: string
  min: number
  max: number
  step: number
  value: number
  description?: string
}

interface HyperparamPanelProps {
  params: HyperparamConfig[]
  onChange: (key: string, value: number) => void
  disabled?: boolean
}

export function HyperparamPanel({ params, onChange, disabled }: HyperparamPanelProps) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-surface-light rounded-xl border border-surface-lighter">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Hyperparameters</h3>
      {disabled && (
        <p className="text-xs text-accent-yellow">Reset to change hyperparameters</p>
      )}
      {params.map(({ key, label, min, max, step, value, description }) => (
        <div key={key} className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm text-text">{label}</label>
            <span className="text-sm font-mono text-primary-light">{value}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(key, Number(e.target.value))}
            disabled={disabled}
            className="w-full accent-primary disabled:opacity-40"
          />
          {description && (
            <p className="text-xs text-text-muted">{description}</p>
          )}
        </div>
      ))}
    </div>
  )
}
