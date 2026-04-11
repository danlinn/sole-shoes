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

import { updateProfile, getProfile } from './profile-actions'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>
const mockDb = db as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('updateProfile', () => {
  it('updates profile when authenticated with valid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.user.update.mockResolvedValue({})

    const result = await updateProfile({
      name: 'Alice',
      city: 'Portland',
      preferredContact: 'email',
    })

    expect(result).toEqual({ success: true })
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        name: 'Alice',
        city: 'Portland',
        preferredContact: 'email',
      },
    })
  })

  it('sets city to null when not provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.user.update.mockResolvedValue({})

    await updateProfile({ name: 'Alice' })

    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({ city: null }),
    })
  })

  it('sets preferredContact to null when not provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.user.update.mockResolvedValue({})

    await updateProfile({ name: 'Alice' })

    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({ preferredContact: null }),
    })
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await updateProfile({ name: 'Alice' })
    expect(result).toEqual({ error: 'You must be logged in' })
  })

  it('returns error for invalid input (short name)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const result = await updateProfile({ name: 'A' })
    expect(result.error).toBeDefined()
    expect(mockDb.user.update).not.toHaveBeenCalled()
  })
})

describe('getProfile', () => {
  it('returns profile when authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const mockProfile = {
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
    }
    mockDb.user.findUnique.mockResolvedValue(mockProfile)

    const result = await getProfile()
    expect(result).toEqual(mockProfile)
  })

  it('returns null when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await getProfile()
    expect(result).toBeNull()
  })

  it('returns null when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} })
    const result = await getProfile()
    expect(result).toBeNull()
  })
})
