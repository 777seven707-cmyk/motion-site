import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Limit } from '../types'

const limits = atom({ plugin: 'limit-bar', key: 'limits' } as const, [] as Limit[])

const LABELS: Record<string, string> = {
  five_hour: '5h',
  seven_day: 'week',
  spend_limit: 'spend',
}

const WIDTH = 12

const ORANGE = '#ff8c00'

const filledCells = (percent: number) =>
  Math.max(0, Math.min(WIDTH, Math.round((percent / 100) * WIDTH)))

const resetIn = (iso: string | undefined, now: number) => {
  if (!iso) return ''
  const minutes = Math.max(0, Math.round((Date.parse(iso) - now) / 60000))
  const h = Math.floor(minutes / 60)
  const d = Math.floor(h / 24)
  return d > 0 ? ` ↻${d}d${h % 24}h` : h > 0 ? ` ↻${h}h${minutes % 60}m` : ` ↻${minutes}m`
}

export const register: Register = on => {
  on('session.measure', async ($, e, next) => {
    await update($, limits, () => e.rateLimits.map(l => ({ ...l })))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const current = await read($, limits)
    if (e.props.hasSurvey || current.length === 0) {
      return next(e)
    }

    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box>
        {current.map(l => (
          <Text key={l.kind}>
            <Text dimColor>{LABELS[l.kind] ?? l.kind} </Text>
            <Text color={ORANGE}>{'█'.repeat(filledCells(l.percentUsed))}</Text>
            <Text dimColor>{'░'.repeat(WIDTH - filledCells(l.percentUsed))}</Text>
            <Text> {Math.round(l.percentUsed)}%</Text>
            <Text dimColor>{resetIn(l.resetsAt, now)}   </Text>
          </Text>
        ))}
      </Box>
    )
  })
}
