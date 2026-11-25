import { apiClient } from '@/services/api/client'
import { ApiError } from '@/services/api/ApiError'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024

export function isVideoUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false
  try {
    const pathname = new URL(url, 'https://placeholder.local').pathname.toLowerCase()
    return pathname.endsWith('.mp4') || pathname.endsWith('.webm')
  } catch {
    return false
  }
}

export async function createUploadUrl({ filename, contentType, fileSize, purpose }) {
  const response = await apiClient.post('/api/v1/files/presigned-url', {
    filename,
    contentType,
    fileSize,
    purpose,
  })
  return response.data
}
export async function confirmFileUpload({ fileId }) {
  const response = await apiClient.post(`/api/v1/files/${encodeURIComponent(fileId)}/confirm`)
  return response.data
}

export async function getFileDownloadUrl({ fileId }) {
  const response = await apiClient.get(`/api/v1/files/${encodeURIComponent(fileId)}/download-url`)
  return response.data
}

export async function uploadMediaFile({
  file,
  purpose,
  allowVideo = true,
  resolveDownloadUrl = true,
}) {
  const isImage = Boolean(file && ALLOWED_IMAGE_TYPES.has(file.type))
  // Avatar purpose is image-only even if a caller forgets to narrow the picker.
  const permitsVideo = allowVideo && purpose !== 'USER_AVATAR'
  const isVideo = Boolean(file && permitsVideo && ALLOWED_VIDEO_TYPES.has(file.type))

  if (!isImage && !isVideo) {
    throw new ApiError({
      status: 400,
      code: 'FE_INVALID_MEDIA_TYPE',
      message: permitsVideo
        ? 'Only JPEG, PNG, WebP images or MP4/WebM videos are supported'
        : 'Only JPEG, PNG, and WebP images are supported',
    })
  }

  const extension = file.name.split('.').pop()?.toLowerCase()
  const extensionMatches = isImage
    ? { jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[extension] ===
      file.type
    : { mp4: 'video/mp4', webm: 'video/webm' }[extension] === file.type
  if (!extensionMatches) {
    throw new ApiError({
      status: 400,
      code: 'FE_INVALID_MEDIA_TYPE',
      message: 'File extension does not match its media type',
    })
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size <= 0 || file.size > maxBytes) {
    throw new ApiError({
      status: 400,
      code: isVideo ? 'FE_VIDEO_TOO_LARGE' : 'FE_IMAGE_TOO_LARGE',
      message: isVideo
        ? 'Video size must be 50 MB or smaller'
        : 'Image size must be 5 MB or smaller',
    })
  }

  let presigned
  try {
    presigned = await createUploadUrl({
      filename: file.name,
      contentType: file.type,
      fileSize: file.size,
      purpose,
    })
  } catch (error) {
    throw new ApiError({
      status: error?.status ?? 0,
      code: 'FILE_PRESIGN_FAILED',
      message: 'Could not request upload URL',
    })
  }

  if (
    typeof presigned?.fileId !== 'string' ||
    !presigned.fileId ||
    typeof presigned.uploadUrl !== 'string' ||
    !isHttpsUrl(presigned.uploadUrl)
  ) {
    throw new ApiError({
      status: 0,
      code: 'FILE_PRESIGN_FAILED',
      message: 'Upload URL response is invalid',
    })
  }

  let putResponse
  try {
    // Use fetch directly so the API client's Authorization interceptor never sees this S3 request.
    putResponse = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
  } catch {
    throw new ApiError({
      status: 0,
      code: 'FILE_STORAGE_UNAVAILABLE',
      message: 'Failed to upload file to storage',
    })
  }

  if (!putResponse.ok) {
    throw new ApiError({
      status: putResponse.status,
      code: 'FILE_STORAGE_UNAVAILABLE',
      message: 'Failed to upload file to storage',
    })
  }

  try {
    const confirmation = await confirmFileUpload({ fileId: presigned.fileId })
    if (confirmation?.status !== 'AVAILABLE') {
      throw new Error('Uploaded file is not AVAILABLE')
    }
  } catch (error) {
    throw new ApiError({
      status: error?.status ?? 0,
      code: 'FILE_CONFIRM_FAILED',
      message: 'Could not confirm uploaded file',
    })
  }
  if (!resolveDownloadUrl) return { fileId: presigned.fileId }
  const download = await getFileDownloadUrl({ fileId: presigned.fileId })
  if (typeof download?.downloadUrl !== 'string' || !isHttpsUrl(download.downloadUrl)) {
    throw new ApiError({
      status: 0,
      code: 'FILE_DOWNLOAD_URL_FAILED',
      message: 'Download URL response is invalid',
    })
  }

  return {
    fileId: presigned.fileId,
    url: download.downloadUrl,
  }
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}
