import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'

import { AppProviders } from '@/app/providers/AppProviders'
import { createQueryClient, queryClient } from '@/app/providers/queryClient'

const clients = []

function isolatedClient() {
  const client = createQueryClient()
  clients.push(client)
  return client
}

afterEach(() => {
  queryClient.clear()
  for (const client of clients.splice(0)) client.clear()
})

describe('query provider and cache policy', () => {
  test('provides a shared cache that survives a page unmount and remount', async () => {
    const loadData = vi.fn().mockResolvedValue('Cached result')

    function CacheConsumer() {
      const { data } = useQuery({ queryKey: ['provider-demo'], queryFn: loadData })
      return <p>{data ?? 'Loading'}</p>
    }

    const firstPage = render(
      <AppProviders>
        <CacheConsumer />
      </AppProviders>,
    )
    expect(await screen.findByText('Cached result')).toBeInTheDocument()
    firstPage.unmount()

    render(
      <AppProviders>
        <CacheConsumer />
      </AppProviders>,
    )
    expect(await screen.findByText('Cached result')).toBeInTheDocument()
    expect(loadData).toHaveBeenCalledTimes(1)
  })

  test('does not retry a forbidden response', async () => {
    const client = isolatedClient()
    const error = Object.assign(new Error('Forbidden'), { status: 403 })
    const loadData = vi.fn().mockRejectedValue(error)

    await expect(
      client.fetchQuery({ queryKey: ['forbidden'], queryFn: loadData, retryDelay: 0 }),
    ).rejects.toBe(error)

    expect(loadData).toHaveBeenCalledTimes(1)
  })

  test('stops after two retries when the server keeps failing', async () => {
    const client = isolatedClient()
    const error = Object.assign(new Error('Service unavailable'), { status: 503 })
    const loadData = vi.fn().mockRejectedValue(error)

    await expect(
      client.fetchQuery({ queryKey: ['unavailable'], queryFn: loadData, retryDelay: 0 }),
    ).rejects.toBe(error)

    // One original attempt and two retries.
    expect(loadData).toHaveBeenCalledTimes(3)
  })

  test('does not automatically repeat a failed write', async () => {
    const client = isolatedClient()
    const error = new Error('Connection lost after submitting')
    const saveData = vi.fn().mockRejectedValue(error)
    const mutation = client.getMutationCache().build(client, {
      mutationFn: saveData,
      retryDelay: 0,
    })

    await expect(mutation.execute(undefined)).rejects.toBe(error)
    expect(saveData).toHaveBeenCalledTimes(1)
  })
})
