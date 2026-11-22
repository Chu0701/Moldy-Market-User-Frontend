import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { getChatBlockReasonKey } from '@/features/chat/chatIdentity'

export function ChatComposer({ conversation, realtime, canSend }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)
  const closed = conversation.status !== 'ACTIVE'
  const blocked = conversation.canSend !== true
  const disabled =
    closed || blocked || !canSend || realtime.status !== 'connected' || realtime.isPending
  async function submit(event) {
    event.preventDefault()
    if (disabled || !draft.trim()) return
    setError(null)
    try {
      await realtime.sendText(conversation.id, draft.trim())
      setDraft('')
    } catch (failure) {
      setError(failure.translationKey ?? 'chat.sendUncertain')
    }
  }
  return (
    <form className="chat-compose" onSubmit={(event) => void submit(event)}>
      <label htmlFor="chat-message-draft">{t('chat.messageLabel')}</label>
      <textarea
        id="chat-message-draft"
        rows={2}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={disabled}
        placeholder={t('chat.writeMessage')}
        aria-describedby="chat-compose-notice"
      />
      <p id="chat-compose-notice" className="text-sm text-muted-foreground">
        {t(
          closed
            ? 'chat.closedNotice'
            : blocked
              ? getChatBlockReasonKey(conversation.sendBlockedReason)
              : 'chat.textOnlyNotice',
        )}
      </p>
      {error && (
        <p role="alert" className="text-destructive">
          {t(error)}
        </p>
      )}
      <Button type="submit" disabled={disabled || !draft.trim()}>
        {t(realtime.isPending ? 'chat.sending' : 'chat.send')}
      </Button>
    </form>
  )
}
