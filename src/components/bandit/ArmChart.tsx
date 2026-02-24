import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from 'recharts'
import { ARM_COLORS } from '../../utils/colors'
import { useThemeColors } from '../../hooks/useThemeColors'

interface ArmChartProps {
  estimates: number[]
  counts: number[]
  trueMeans: number[]
  lastAction?: number
}

export function ArmChart({ estimates, counts, trueMeans, lastAction }: ArmChartProps) {
  const tc = useThemeColors()

  const data = useMemo(() =>
    estimates.map((est, i) => ({
      arm: `Arm ${i}`,
      estimate: Math.round(est * 1000) / 1000,
      trueMean: Math.round(trueMeans[i] * 1000) / 1000,
      pulls: counts[i],
    })),
    [estimates, counts, trueMeans]
  )

  return (
    <div className="bg-surface-light rounded-xl border border-surface-lighter p-4">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
        Arm Estimates vs True Means
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke={tc.chartGrid} />
          <XAxis dataKey="arm" stroke={tc.chartAxis} fontSize={11} />
          <YAxis stroke={tc.chartAxis} fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: tc.tooltipBg,
              border: `1px solid ${tc.tooltipBorder}`,
              borderRadius: '8px',
              fontSize: '12px',
              color: tc.text,
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => [
              typeof value === 'number' ? value.toFixed(3) : String(value),
              name === 'estimate' ? 'Estimated Q' : 'True Mean',
            ]}
          />
          <ReferenceLine y={0} stroke={tc.chartAxis} strokeDasharray="3 3" />
          <Bar dataKey="estimate" name="estimate" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={ARM_COLORS[i % ARM_COLORS.length]}
                opacity={lastAction === i ? 1 : 0.6}
                stroke={lastAction === i ? '#fff' : 'none'}
                strokeWidth={lastAction === i ? 2 : 0}
              />
            ))}
          </Bar>
          <Bar dataKey="trueMean" name="trueMean" radius={[4, 4, 0, 0]} fill={`rgba(${tc.rawText}, 0.13)`} />
        </BarChart>
      </ResponsiveContainer>

      {/* Pull counts */}
      <div className="flex gap-1 mt-3 flex-wrap">
        {counts.map((count, i) => (
          <span
            key={i}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: ARM_COLORS[i % ARM_COLORS.length] + '20',
              color: ARM_COLORS[i % ARM_COLORS.length],
              border: lastAction === i ? `1px solid ${ARM_COLORS[i % ARM_COLORS.length]}` : '1px solid transparent',
            }}
          >
            Arm {i}: {count}
          </span>
        ))}
      </div>
    </div>
  )
}
