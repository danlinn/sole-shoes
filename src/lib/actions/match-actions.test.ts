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

import { sendMatchRequest, respondToMatchRequest, confirmMatch } from './match-actions'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>
const mockDb = db as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('sendMatchRequest', () => {
  it('sends match request successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue({
      userId: 'user-2',
      status: 'OPEN',
    })
    mockDb.matchRequest.findUnique.mockResolvedValue(null)
    mockDb.block.findFirst.mockResolvedValue(null)
    // Execute the transaction callback to cover lines 53-91
    mockDb.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        matchRequest: { create: vi.fn().mockResolvedValue({ id: 'mr-1' }) },
        conversation: { create: vi.fn().mockResolvedValue({ id: 'conv-1' }) },
        shoePost: { update: vi.fn().mockResolvedValue({}) },
        notification: { create: vi.fn().mockResolvedValue({}) },
      }
      return cb(tx)
    })

    const result = await sendMatchRequest('post-1', 'I found your shoe!')
    expect(result).toEqual({
      success: true,
      matchRequestId: 'mr-1',
      conversationId: 'conv-1',
    })
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await sendMatchRequest('post-1', 'Hello')
    expect(result).toEqual({ error: 'You must be logged in' })
  })

  it('returns error when post not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue(null)

    const result = await sendMatchRequest('post-1', 'Hello')
    expect(result).toEqual({ error: 'Post not found' })
  })

  it('returns error when matching own listing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue({
      userId: 'user-1',
      status: 'OPEN',
    })

    const result = await sendMatchRequest('post-1', 'Hello')
    expect(result).toEqual({ error: 'You cannot match your own listing' })
  })

  it('returns error when listing is closed', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue({
      userId: 'user-2',
      status: 'MATCHED',
    })

    const result = await sendMatchRequest('post-1', 'Hello')
    expect(result).toEqual({ error: 'This listing is no longer accepting matches' })
  })

  it('allows match when status is POTENTIAL_MATCH', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue({
      userId: 'user-2',
      status: 'POTENTIAL_MATCH',
    })
    mockDb.matchRequest.findUnique.mockResolvedValue(null)
    mockDb.block.findFirst.mockResolvedValue(null)
    mockDb.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        matchRequest: { create: vi.fn().mockResolvedValue({ id: 'mr-1' }) },
        conversation: { create: vi.fn().mockResolvedValue({ id: 'conv-1' }) },
        shoePost: { update: vi.fn().mockResolvedValue({}) },
        notification: { create: vi.fn().mockResolvedValue({}) },
      }
      return cb(tx)
    })

    const result = await sendMatchRequest('post-1', 'I found it')
    expect(result.success).toBe(true)
  })

  it('returns error when already sent request', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue({
      userId: 'user-2',
      status: 'OPEN',
    })
    mockDb.matchRequest.findUnique.mockResolvedValue({ id: 'existing' })

    const result = await sendMatchRequest('post-1', 'Hello')
    expect(result).toEqual({
      error: 'You already sent a match request for this listing',
    })
  })

  it('returns error when blocked', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue({
      userId: 'user-2',
      status: 'OPEN',
    })
    mockDb.matchRequest.findUnique.mockResolvedValue(null)
    mockDb.block.findFirst.mockResolvedValue({ id: 'block-1' })

    const result = await sendMatchRequest('post-1', 'Hello')
    expect(result).toEqual({ error: 'Unable to send match request' })
  })
})

describe('respondToMatchRequest', () => {
  it('accepts match request', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.matchRequest.findUnique.mockResolvedValue({
      id: 'mr-1',
      receiverId: 'user-1',
      senderId: 'user-2',
      shoePostId: 'post-1',
      shoePost: { id: 'post-1' },
    })
    mockDb.matchRequest.update.mockResolvedValue({})
    mockDb.notification.create.mockResolvedValue({})

    const result = await respondToMatchRequest('mr-1', 'ACCEPTED')
    expect(result).toEqual({ success: true })
    expect(mockDb.matchRequest.update).toHaveBeenCalledWith({
      where: { id: 'mr-1' },
      data: { status: 'ACCEPTED' },
    })
  })

  it('rejects match request', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.matchRequest.findUnique.mockResolvedValue({
      id: 'mr-1',
      receiverId: 'user-1',
      senderId: 'user-2',
      shoePostId: 'post-1',
      shoePost: { id: 'post-1' },
    })
    mockDb.matchRequest.update.mockResolvedValue({})
    mockDb.notification.create.mockResolvedValue({})

    const result = await respondToMatchRequest('mr-1', 'REJECTED')
    expect(result).toEqual({ success: true })
    expect(mockDb.matchRequest.update).toHaveBeenCalledWith({
      where: { id: 'mr-1' },
      data: { status: 'REJECTED' },
    })
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await respondToMatchRequest('mr-1', 'ACCEPTED')
    expect(result).toEqual({ error: 'You must be logged in' })
  })

  it('returns error when not receiver', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-3' } })
    mockDb.matchRequest.findUnique.mockResolvedValue({
      id: 'mr-1',
      receiverId: 'user-1',
      senderId: 'user-2',
    })

    const result = await respondToMatchRequest('mr-1', 'ACCEPTED')
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error when request not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.matchRequest.findUnique.mockResolvedValue(null)

    const result = await respondToMatchRequest('mr-1', 'ACCEPTED')
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('creates notification for sender', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.matchRequest.findUnique.mockResolvedValue({
      id: 'mr-1',
      receiverId: 'user-1',
      senderId: 'user-2',
      shoePostId: 'post-1',
      shoePost: { id: 'post-1' },
    })
    mockDb.matchRequest.update.mockResolvedValue({})
    mockDb.notification.create.mockResolvedValue({})

    await respondToMatchRequest('mr-1', 'ACCEPTED')

    expect(mockDb.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-2',
        type: 'LISTING_STATUS_CHANGE',
      }),
    })
  })
})

describe('confirmMatch', () => {
  it('confirms match successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.matchRequest.findUnique.mockResolvedValue({
      id: 'mr-1',
      receiverId: 'user-1',
      shoePostId: 'post-1',
      shoePost: { id: 'post-1' },
    })
    mockDb.$transaction.mockResolvedValue([])

    const result = await confirmMatch('mr-1')
    expect(result).toEqual({ success: true })
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await confirmMatch('mr-1')
    expect(result).toEqual({ error: 'You must be logged in' })
  })

  it('returns error when not receiver', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-3' } })
    mockDb.matchRequest.findUnique.mockResolvedValue({
      id: 'mr-1',
      receiverId: 'user-1',
    })

    const result = await confirmMatch('mr-1')
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error when request not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.matchRequest.findUnique.mockResolvedValue(null)

    const result = await confirmMatch('mr-1')
    expect(result).toEqual({ error: 'Not authorized' })
  })
})
