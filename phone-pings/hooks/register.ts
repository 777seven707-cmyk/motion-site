import type { Register } from 'claude-code'

export const register: Register = on => {
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)

    if (verdict.decision === 'ask' && e.tool_use_id !== undefined) {
      const isQuestion = e.tool === 'AskUserQuestion'
      await $.ui
        .notify(isQuestion ? 'Claude задаёт вопрос' : `Нужно одобрение: ${e.tool}`, {
          title: isQuestion ? '❓ Вопрос' : '✋ Одобрение',
        })
        .catch(() => undefined)
    }

    return verdict
  })

  on('turn.complete', async ($, e, next) => {
    if (e.reason === 'answer') {
      await $.ui.notify('Работа закончена', { title: '✅ Готово' }).catch(() => undefined)
    }

    return next(e)
  })
}
