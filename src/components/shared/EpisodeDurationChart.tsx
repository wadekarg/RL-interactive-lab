import { useMemo } from 'react'
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Scatter, ComposedChart, ReferenceLine,
} from 'recharts'
import { useThemeColors } from '../../hooks/useThemeColors'

interface EpisodeDurationChartProps {
  durations: number[]
  successEpisodes?: boolean[]
  successLabel?: string
  referenceLine?: number
}

export function EpisodeDurationChart({
  durations,
  successEpisodes,
  successLabel = 'Success',
  referenceLine,
}: EpisodeDurationChartProps) {
  const tc = useThemeColors()

  const data = useMemo(() => {
    return durations.map((d, i) => ({
      episode: i + 1,
      duration: d,
      success: successEpisodes?.[i] ? d : undefined,
    }))
  }, [durations, successEpisodes])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-surface-light rounded-xl border border-surface-lighter">
        <p className="text-sm text-text-muted">No episodes completed yet — press Play or Step</p>
      </div>
    )
  }

  return (
    <div className="bg-surface-light rounded-xl border border-surface-lighter p-4">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
        Episode Duration
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={tc.chartGrid} />
          <XAxis dataKey="episode" stroke={tc.chartAxis} fontSize={11} label={{ value: 'Episode', position: 'insideBottom', offset: -2, fontSize: 10, fill: tc.textMuted }} />
          <YAxis stroke={tc.chartAxis} fontSize={11} domain={[0, 'auto']} />
          <Tooltip
            contentStyle={{
              backgroundColor: tc.tooltipBg,
              border: `1px solid ${tc.tooltipBorder}`,
              borderRadius: '8px',
              fontSize: '12px',
              color: tc.text,
            }}
          />
          {referenceLine !== undefined && (
            <ReferenceLine
              y={referenceLine}
              stroke="#22c55e"
              strokeDasharray="6 3"
              label={{ value: `${referenceLine}`, position: 'right', fontSize: 10, fill: '#22c55e' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="duration"
            stroke={tc.primary}
            strokeWidth={1.5}
            dot={false}
            name="Steps"
          />
          <Scatter
            dataKey="success"
            fill="#22c55e"
            name={successLabel}
            shape="circle"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
