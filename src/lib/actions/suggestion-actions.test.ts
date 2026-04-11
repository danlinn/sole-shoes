import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: vi.fn(), create: vi.fn(), count: vi.fn(), update: vi.fn() },
    shoePost: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    matchRequest: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    conversation: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    message: { create: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
    notification: { create: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
    matchSuggestion: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), upsert: vi.fn() },
    report: { create: vi.fn(), update: vi.fn(), count: vi.fn() },
    block: { findFirst: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import {
  dismissSuggestion,
  confirmSuggestion,
  getUserSuggestions,
} from './suggestion-actions'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>
const mockDb = db as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('dismissSuggestion', () => {
  it('dismisses suggestion when owner', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.matchSuggestion.findUnique.mockResolvedValue({
      id: 'sug-1',
      sourcePost: { userId: 'user-1' },
    })
    mockDb.matchSuggestion.update.mockResolvedValue({})

    const result = await dismissSuggestion('sug-1')
    expect(result).toEqual({ success: true })
    expect(mockDb.matchSuggestion.update).toHaveBeenCalledWith({
      where: { id: 'sug-1' },
      data: { status: 'DISMISSED' },
    })
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await dismissSuggestion('sug-1')
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error when not owner of source post', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-2' } })
    mockDb.matchSuggestion.findUnique.mockResolvedValue({
      id: 'sug-1',
      sourcePost: { userId: 'user-1' },
    })

    const result = await dismissSuggestion('sug-1')
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error when suggestion not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.matchSuggestion.findUnique.mockResolvedValue(null)

    const result = await dismissSuggestion('sug-1')
    expect(result).toEqual({ error: 'Not authorized' })
  })
})

describe('confirmSuggestion', () => {
  it('confirms suggestion when owner', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.matchSuggestion.findUnique.mockResolvedValue({
      id: 'sug-1',
      sourcePost: { userId: 'user-1' },
    })
    mockDb.matchSuggestion.update.mockResolvedValue({})

    const result = await confirmSuggestion('sug-1')
    expect(result).toEqual({ success: true })
    expect(mockDb.matchSuggestion.update).toHaveBeenCalledWith({
      where: { id: 'sug-1' },
      data: { status: 'CONFIRMED' },
    })
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await confirmSuggestion('sug-1')
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error when not owner of source post', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-2' } })
    mockDb.matchSuggestion.findUnique.mockResolvedValue({
      id: 'sug-1',
      sourcePost: { userId: 'user-1' },
    })

    const result = await confirmSuggestion('sug-1')
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error when suggestion not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.matchSuggestion.findUnique.mockResolvedValue(null)

    const result = await confirmSuggestion('sug-1')
    expect(result).toEqual({ error: 'Not authorized' })
  })
})

describe('getUserSuggestions', () => {
  it('returns suggestions when authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const mockSuggestions = [{ id: 'sug-1' }, { id: 'sug-2' }]
    mockDb.matchSuggestion.findMany.mockResolvedValue(mockSuggestions)

    const result = await getUserSuggestions()
    expect(result).toEqual(mockSuggestions)
  })

  it('returns empty array when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await getUserSuggestions()
    expect(result).toEqual([])
  })

  it('returns empty array when no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} })
    const result = await getUserSuggestions()
    expect(result).toEqual([])
  })
})
