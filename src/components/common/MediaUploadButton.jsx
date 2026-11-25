import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { uploadMediaFile } from '@/services/files/fileUploadService'

function mapUploadError(error) {
  switch (error?.code) {
    case 'FE_INVALID_MEDIA_TYPE':
      return 'upload.errors.invalidType'
    case 'FE_IMAGE_TOO_LARGE':
      return 'upload.errors.imageTooLarge'
    case 'FE_VIDEO_TOO_LARGE':
      return 'upload.errors.videoTooLarge'
    case 'FILE_STORAGE_UNAVAILABLE':
      return 'upload.errors.s3UploadFailed'
    case 'FILE_PRESIGN_FAILED':
      return 'upload.errors.presignFailed'
    case 'FILE_CONFIRM_FAILED':
      return 'upload.errors.confirmFailed'
    default:
      return 'upload.errors.generic'
  }
}

export function MediaUploadButton({
  purpose,
  allowVideo = true,
  disabled = false,
  resolveDownloadUrl = true,
  showHint = true,
  onUploaded,
  onUploadResult,
  onUploadingChange,
  onUploadError,
}) {
  const { t } = useTranslation()
  const inputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errorKey, setErrorKey] = useState(null)

  const accept = allowVideo
    ? 'image/jpeg,image/png,image/webp,video/mp4,video/webm'
    : 'image/jpeg,image/png,image/webp'

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setErrorKey(null)
    setIsUploading(true)
    onUploadingChange?.(true)
    onUploadError?.(null)
    try {
      const result = await uploadMediaFile({ file, purpose, allowVideo, resolveDownloadUrl })
      if (onUploadResult) onUploadResult(result, file)
      else if (result.url) onUploaded(result.url)
    } catch (error) {
      const key = mapUploadError(error)
      setErrorKey(key)
      onUploadError?.(key)
    } finally {
      setIsUploading(false)
      onUploadingChange?.(false)
    }
  }

  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled || isUploading}
          onChange={(event) => void handleFileChange(event)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {t(
            isUploading
              ? 'upload.uploading'
              : allowVideo
                ? 'upload.chooseMedia'
                : 'upload.chooseImage',
          )}
        </Button>
        {showHint && (
          <span className="text-xs text-muted-foreground">
            {t(allowVideo ? 'upload.mediaHint' : 'upload.imageHint')}
          </span>
        )}
      </div>
      {errorKey && (
        <p role="alert" className="text-xs text-destructive">
          {t(errorKey)}
        </p>
      )}
    </div>
  )
}
