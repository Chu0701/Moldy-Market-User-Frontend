import { apiClient } from '@/services/api/client'
import { ApiError } from '@/services/api/ApiError'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
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

export async function uploadMediaFile({ file, purpose, allowVideo = true }) {
  const isImage = Boolean(file && ALLOWED_IMAGE_TYPES.has(file.type))
  const isVideo = Boolean(file && allowVideo && ALLOWED_VIDEO_TYPES.has(file.type))

  if (!isImage && !isVideo) {
    throw new ApiError({
      status: 400,
      code: 'FE_INVALID_MEDIA_TYPE',
      message: allowVideo
        ? 'Only JPEG, PNG, WebP images or MP4/WebM videos are supported'
        : 'Only JPEG, PNG, and WebP images are supported',
    })
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size <= 0 || file.size > maxBytes) {
    throw new ApiError({
      status: 400,
      code: isVideo ? 'FE_VIDEO_TOO_LARGE' : 'FE_IMAGE_TOO_LARGE',
      message: isVideo
        ? 'Video size must be 50 MB or smaller'
        : 'Image size must be 10 MB or smaller',
    })
  }

  const presigned = await createUploadUrl({
    filename: file.name,
    contentType: file.type,
    fileSize: file.size,
    purpose,
  })

  const putResponse = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  if (!putResponse.ok) {
    throw new ApiError({
      status: putResponse.status,
      code: 'FILE_STORAGE_UNAVAILABLE',
      message: 'Failed to upload file to storage',
    })
  }

  await confirmFileUpload({ fileId: presigned.fileId })
  const download = await getFileDownloadUrl({ fileId: presigned.fileId })
  const baseUrl = (apiClient.defaults.baseURL || '').replace(/\/$/, '')
  const resolvedUrl = download.publicUrl ? `${baseUrl}${download.publicUrl}` : download.downloadUrl

  return {
    fileId: presigned.fileId,
    url: resolvedUrl,
  }
}
