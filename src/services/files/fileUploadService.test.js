import { afterEach, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import { isVideoUrl, uploadMediaFile } from './fileUploadService'

afterEach(() => {
  vi.restoreAllMocks()
})

test('detects supported video URLs including signed S3 query strings', () => {
  expect(isVideoUrl('https://bucket.s3.amazonaws.com/clip.mp4?X-Amz-Signature=abc')).toBe(true)
  expect(isVideoUrl('https://cdn.example.com/demo.WEBM')).toBe(true)
  expect(isVideoUrl('https://cdn.example.com/photo.jpg')).toBe(false)
  expect(isVideoUrl('')).toBe(false)
})

test('runs the 3-step presigned upload flow for a valid MP4 video', async () => {
  const file = new File([new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112])], 'unbox.mp4', {
    type: 'video/mp4',
  })
  const post = vi
    .spyOn(apiClient, 'post')
    .mockResolvedValueOnce({
      status: 201,
      data: {
        fileId: 'file-1',
        uploadUrl: 'https://s3.example.test/put-here',
        objectKey: 'dispute_evidence/u1/abc.mp4',
        expiresIn: 300,
      },
    })
    .mockResolvedValueOnce({
      status: 200,
      data: { fileId: 'file-1', status: 'AVAILABLE' },
    })
  const get = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
    status: 200,
    data: {
      downloadUrl: 'https://s3.example.test/dispute_evidence/u1/abc.mp4?sig=1',
      expiresIn: 300,
    },
  })
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, status: 200 })

  const result = await uploadMediaFile({ file, purpose: 'DISPUTE_EVIDENCE' })

  expect(result).toEqual({
    fileId: 'file-1',
    url: 'https://s3.example.test/dispute_evidence/u1/abc.mp4?sig=1',
  })
  expect(post).toHaveBeenNthCalledWith(1, '/api/v1/files/presigned-url', {
    filename: 'unbox.mp4',
    contentType: 'video/mp4',
    fileSize: file.size,
    purpose: 'DISPUTE_EVIDENCE',
  })
  expect(fetchSpy).toHaveBeenCalledExactlyOnceWith('https://s3.example.test/put-here', {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4' },
    body: file,
  })
  expect(post).toHaveBeenNthCalledWith(2, '/api/v1/files/file-1/confirm')
  expect(get).toHaveBeenCalledExactlyOnceWith('/api/v1/files/file-1/download-url')
})

test('rejects unsupported file types before calling the backend', async () => {
  const file = new File(['hello'], 'notes.txt', { type: 'text/plain' })
  const post = vi.spyOn(apiClient, 'post')

  await expect(uploadMediaFile({ file, purpose: 'PRODUCT_IMAGE' })).rejects.toMatchObject({
    code: 'FE_INVALID_MEDIA_TYPE',
  })
  expect(post).not.toHaveBeenCalled()
})
