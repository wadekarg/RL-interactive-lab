import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from 'recharts'
import { betaPdf } from '../../utils/math'
import { ARM_COLORS } from '../../utils/colors'
import { useThemeColors } from '../../hooks/useThemeColors'

interface ThompsonVizProps {
  alphas: number[]
  betas: number[]
  numArms: number
}

export function ThompsonViz({ alphas, betas, numArms }: ThompsonVizProps) {
  const tc = useThemeColors()

  const data = useMemo(() => {
    const points: Record<string, number>[] = []
    const numPoints = 100

    for (let i = 0; i <= numPoints; i++) {
      const x = i / numPoints
      const point: Record<string, number> = { x: Math.round(x * 100) / 100 }

      for (let arm = 0; arm < numArms; arm++) {
        const pdf = betaPdf(x, alphas[arm], betas[arm])
        point[`arm${arm}`] = Math.round(pdf * 1000) / 1000
      }

      points.push(point)
    }
    return points
  }, [alphas, betas, numArms])

  return (
    <div className="bg-surface-light rounded-xl border border-surface-lighter p-4">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">
        Beta Posteriors (Thompson Sampling)
      </h3>
      <p className="text-xs text-text-muted mb-3">
        Each curve shows the agent's belief about arm success probability
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="x" stroke={tc.chartAxis} fontSize={10} />
          <YAxis stroke={tc.chartAxis} fontSize={10} />
          <Tooltip
            contentStyle={{
              backgroundColor: tc.tooltipBg,
              border: `1px solid ${tc.tooltipBorder}`,
              borderRadius: '8px',
              fontSize: '11px',
              color: tc.text,
            }}
          />
          {Array.from({ length: numArms }, (_, arm) => (
            <Line
              key={arm}
              type="monotone"
              dataKey={`arm${arm}`}
              stroke={ARM_COLORS[arm % ARM_COLORS.length]}
              strokeWidth={1.5}
              dot={false}
              name={`Arm ${arm}`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
