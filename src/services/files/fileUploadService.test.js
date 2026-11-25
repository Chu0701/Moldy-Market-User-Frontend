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

test('avatar upload confirms by fileId without requesting or returning a temporary URL', async () => {
  const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
  const post = vi
    .spyOn(apiClient, 'post')
    .mockResolvedValueOnce({
      status: 201,
      data: { fileId: 'avatar-1', uploadUrl: 'https://s3.test/put?signature=secret' },
    })
    .mockResolvedValueOnce({ status: 200, data: { fileId: 'avatar-1', status: 'AVAILABLE' } })
  const get = vi.spyOn(apiClient, 'get')
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, status: 200 })

  const result = await uploadMediaFile({
    file,
    purpose: 'USER_AVATAR',
    allowVideo: false,
    resolveDownloadUrl: false,
  })

  expect(result).toEqual({ fileId: 'avatar-1' })
  expect(JSON.stringify(result)).not.toContain('uploadUrl')
  expect(post).toHaveBeenNthCalledWith(1, '/api/v1/files/presigned-url', {
    filename: 'avatar.png',
    contentType: 'image/png',
    fileSize: file.size,
    purpose: 'USER_AVATAR',
  })
  expect(fetchSpy).toHaveBeenCalledExactlyOnceWith('https://s3.test/put?signature=secret', {
    method: 'PUT',
    headers: { 'Content-Type': 'image/png' },
    body: file,
  })
  expect(post).toHaveBeenNthCalledWith(2, '/api/v1/files/avatar-1/confirm')
  expect(get).not.toHaveBeenCalled()
})

test('avatar purpose rejects video even when caller allows video', async () => {
  const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' })
  const post = vi.spyOn(apiClient, 'post')

  await expect(
    uploadMediaFile({ file, purpose: 'USER_AVATAR', allowVideo: true }),
  ).rejects.toMatchObject({ code: 'FE_INVALID_MEDIA_TYPE' })
  expect(post).not.toHaveBeenCalled()
})

test('rejects malformed presigned URL responses before attempting a storage request', async () => {
  const file = new File(['image'], 'photo.png', { type: 'image/png' })
  vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
    data: { fileId: 'file-1', uploadUrl: 'http://not-secure.example/upload' },
  })
  const fetchSpy = vi.spyOn(globalThis, 'fetch')

  await expect(
    uploadMediaFile({ file, purpose: 'PRODUCT_IMAGE', resolveDownloadUrl: false }),
  ).rejects.toMatchObject({ code: 'FILE_PRESIGN_FAILED' })
  expect(fetchSpy).not.toHaveBeenCalled()
})

test('does not report upload success when the download URL response is malformed', async () => {
  const file = new File(['image'], 'photo.png', { type: 'image/png' })
  vi.spyOn(apiClient, 'post')
    .mockResolvedValueOnce({ data: { fileId: 'file-1', uploadUrl: 'https://s3.test/put' } })
    .mockResolvedValueOnce({ data: { fileId: 'file-1', status: 'AVAILABLE' } })
  vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: { downloadUrl: '/relative/path' } })
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, status: 200 })

  await expect(uploadMediaFile({ file, purpose: 'PRODUCT_IMAGE' })).rejects.toMatchObject({
    code: 'FILE_DOWNLOAD_URL_FAILED',
  })
})

test('does not return a usable fileId when confirmation is not AVAILABLE', async () => {
  const file = new File(['image'], 'book.png', { type: 'image/png' })
  vi.spyOn(apiClient, 'post')
    .mockResolvedValueOnce({ data: { fileId: 'file-pending', uploadUrl: 'https://s3.test/put' } })
    .mockResolvedValueOnce({ data: { fileId: 'file-pending', status: 'PENDING' } })
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, status: 200 })

  await expect(
    uploadMediaFile({ file, purpose: 'PRODUCT_IMAGE', resolveDownloadUrl: false }),
  ).rejects.toMatchObject({ code: 'FILE_CONFIRM_FAILED' })
})

test('does not return a usable fileId when confirmation fails', async () => {
  const file = new File(['image'], 'book.png', { type: 'image/png' })
  vi.spyOn(apiClient, 'post')
    .mockResolvedValueOnce({ data: { fileId: 'file-failed', uploadUrl: 'https://s3.test/put' } })
    .mockRejectedValueOnce(new Error('confirm failed'))
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, status: 200 })

  await expect(
    uploadMediaFile({ file, purpose: 'PRODUCT_IMAGE', resolveDownloadUrl: false }),
  ).rejects.toMatchObject({ code: 'FILE_CONFIRM_FAILED' })
})

test('does not confirm or return a usable fileId when the S3 upload fails', async () => {
  const file = new File(['image'], 'book.png', { type: 'image/png' })
  const post = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
    data: { fileId: 'file-upload-failed', uploadUrl: 'https://s3.test/put' },
  })
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status: 403 })

  await expect(
    uploadMediaFile({ file, purpose: 'PRODUCT_IMAGE', resolveDownloadUrl: false }),
  ).rejects.toMatchObject({ code: 'FILE_STORAGE_UNAVAILABLE' })
  expect(post).toHaveBeenCalledExactlyOnceWith(
    '/api/v1/files/presigned-url',
    expect.objectContaining({ contentType: 'image/png' }),
  )
})

test('rejects mismatched extensions and images over the backend limit before presigning', async () => {
  const post = vi.spyOn(apiClient, 'post')
  const wrongExtension = new File(['image'], 'book.png', { type: 'image/jpeg' })
  const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'book.jpg', {
    type: 'image/jpeg',
  })

  await expect(
    uploadMediaFile({ file: wrongExtension, purpose: 'PRODUCT_IMAGE' }),
  ).rejects.toMatchObject({
    code: 'FE_INVALID_MEDIA_TYPE',
  })
  await expect(
    uploadMediaFile({ file: oversized, purpose: 'PRODUCT_IMAGE' }),
  ).rejects.toMatchObject({
    code: 'FE_IMAGE_TOO_LARGE',
  })
  expect(post).not.toHaveBeenCalled()
})

test('requires an AVAILABLE status in the direct confirm DTO', async () => {
  const file = new File(['image'], 'book.png', { type: 'image/png' })
  vi.spyOn(apiClient, 'post')
    .mockResolvedValueOnce({ data: { fileId: 'file-no-status', uploadUrl: 'https://s3.test/put' } })
    .mockResolvedValueOnce({ data: { fileId: 'file-no-status' } })
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, status: 200 })

  await expect(
    uploadMediaFile({ file, purpose: 'PRODUCT_IMAGE', resolveDownloadUrl: false }),
  ).rejects.toMatchObject({ code: 'FILE_CONFIRM_FAILED' })
})
