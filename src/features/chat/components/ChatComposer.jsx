import { ArrowUp, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { getChatBlockReasonKey } from '@/features/chat/chatIdentity'
import { cn } from '@/lib/utils'

const MAX_TEXTAREA_HEIGHT = 120

export function ChatComposer({ conversation, realtime, canSend }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)
  const textareaRef = useRef(null)
  const closed = conversation.status !== 'ACTIVE'
  const blocked = conversation.canSend !== true
  const disabled =
    closed || blocked || !canSend || realtime.status !== 'connected' || realtime.isPending
  const hasDraft = Boolean(draft.trim())
  const noticeKey = closed
    ? 'chat.closedNotice'
    : blocked
      ? getChatBlockReasonKey(conversation.sendBlockedReason)
      : null

  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }, [draft])

  async function submit(event) {
    event?.preventDefault()
    if (disabled || !draft.trim()) return
    setError(null)
    try {
      await realtime.sendText(conversation.id, draft.trim())
      setDraft('')
    } catch (failure) {
      setError(failure.translationKey ?? 'chat.sendUncertain')
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent?.isComposing) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <form className="chat-compose" onSubmit={(event) => void submit(event)}>
      {noticeKey && (
        <p id="chat-compose-notice" className="text-xs text-muted-foreground">
          {t(noticeKey)}
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {t(error)}
        </p>
      )}

      <div className="chat-compose-bar">
        <label htmlFor="chat-message-draft" className="sr-only">
          {t('chat.messageLabel')}
        </label>
        <textarea
          ref={textareaRef}
          id="chat-message-draft"
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={t('chat.writeMessage')}
          aria-describedby={noticeKey ? 'chat-compose-notice' : undefined}
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !hasDraft}
          aria-label={t(realtime.isPending ? 'chat.sending' : 'chat.send')}
          title={t(realtime.isPending ? 'chat.sending' : 'chat.send')}
          className={cn(
            'size-9 shrink-0 rounded-full transition-opacity',
            hasDraft && !disabled ? 'opacity-100' : 'opacity-30',
          )}
        >
          {realtime.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowUp className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </form>
  )
}
