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

import { createReport, blockUser } from './report-actions'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>
const mockDb = db as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createReport', () => {
  it('creates report with valid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.report.create.mockResolvedValue({ id: 'r-1' })

    const result = await createReport({
      reason: 'Spam content detected',
      shoePostId: 'post-1',
      reportedUserId: 'user-2',
      details: 'Multiple duplicate posts',
    })

    expect(result).toEqual({ success: true })
    expect(mockDb.report.create).toHaveBeenCalledWith({
      data: {
        reporterId: 'user-1',
        shoePostId: 'post-1',
        reportedUserId: 'user-2',
        reason: 'Spam content detected',
        details: 'Multiple duplicate posts',
      },
    })
  })

  it('creates report with only reason', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.report.create.mockResolvedValue({ id: 'r-1' })

    const result = await createReport({
      reason: 'Suspicious activity',
    })

    expect(result).toEqual({ success: true })
    expect(mockDb.report.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shoePostId: null,
        reportedUserId: null,
        details: null,
      }),
    })
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await createReport({ reason: 'Spam content detected' })
    expect(result).toEqual({ error: 'You must be logged in' })
  })

  it('returns error for invalid input (reason too short)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const result = await createReport({ reason: 'Bad' })
    expect(result.error).toBeDefined()
    expect(mockDb.report.create).not.toHaveBeenCalled()
  })

  it('returns error for reason too long', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const result = await createReport({ reason: 'x'.repeat(501) })
    expect(result.error).toBeDefined()
  })
})

describe('blockUser', () => {
  it('blocks user successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.block.upsert.mockResolvedValue({})

    const result = await blockUser('user-2')
    expect(result).toEqual({ success: true })
    expect(mockDb.block.upsert).toHaveBeenCalledWith({
      where: {
        blockerId_blockedUserId: {
          blockerId: 'user-1',
          blockedUserId: 'user-2',
        },
      },
      create: {
        blockerId: 'user-1',
        blockedUserId: 'user-2',
      },
      update: {},
    })
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await blockUser('user-2')
    expect(result).toEqual({ error: 'You must be logged in' })
  })

  it('returns error when trying to block self', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const result = await blockUser('user-1')
    expect(result).toEqual({ error: 'Cannot block yourself' })
  })
})
