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
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
} from './notification-actions'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>
const mockDb = db as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getNotifications', () => {
  it('returns notifications when authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const mockNotifs = [{ id: 'n-1' }, { id: 'n-2' }]
    mockDb.notification.findMany.mockResolvedValue(mockNotifs)

    const result = await getNotifications()
    expect(result).toEqual(mockNotifs)
  })

  it('returns empty array when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await getNotifications()
    expect(result).toEqual([])
  })

  it('returns empty array when no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} })
    const result = await getNotifications()
    expect(result).toEqual([])
  })
})

describe('markNotificationRead', () => {
  it('marks notification as read', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.notification.update.mockResolvedValue({})

    const result = await markNotificationRead('n-1')
    expect(result).toEqual({ success: true })
    expect(mockDb.notification.update).toHaveBeenCalledWith({
      where: { id: 'n-1', userId: 'user-1' },
      data: { readAt: expect.any(Date) },
    })
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await markNotificationRead('n-1')
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error when no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} })
    const result = await markNotificationRead('n-1')
    expect(result).toEqual({ error: 'Not authorized' })
  })
})

describe('markAllNotificationsRead', () => {
  it('marks all as read', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.notification.updateMany.mockResolvedValue({ count: 5 })

    const result = await markAllNotificationsRead()
    expect(result).toEqual({ success: true })
    expect(mockDb.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', readAt: null },
      data: { readAt: expect.any(Date) },
    })
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await markAllNotificationsRead()
    expect(result).toEqual({ error: 'Not authorized' })
  })
})

describe('getUnreadNotificationCount', () => {
  it('returns count when authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.notification.count.mockResolvedValue(3)

    const result = await getUnreadNotificationCount()
    expect(result).toBe(3)
  })

  it('returns 0 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await getUnreadNotificationCount()
    expect(result).toBe(0)
  })

  it('returns 0 when no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} })
    const result = await getUnreadNotificationCount()
    expect(result).toBe(0)
  })
})
