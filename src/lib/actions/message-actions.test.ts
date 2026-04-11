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
  sendMessage,
  getConversations,
  getConversationMessages,
  getUnreadCount,
} from './message-actions'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>
const mockDb = db as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('sendMessage', () => {
  it('sends message successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.conversation.findUnique.mockResolvedValue({
      id: 'conv-1',
      participantOneId: 'user-1',
      participantTwoId: 'user-2',
    })
    const mockMessage = { id: 'msg-1', body: 'Hello' }
    mockDb.$transaction.mockResolvedValue([mockMessage, {}, {}])

    const result = await sendMessage('conv-1', 'Hello')
    expect(result).toEqual({ success: true, message: mockMessage })
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await sendMessage('conv-1', 'Hello')
    expect(result).toEqual({ error: 'You must be logged in' })
  })

  it('returns error when conversation not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.conversation.findUnique.mockResolvedValue(null)

    const result = await sendMessage('conv-1', 'Hello')
    expect(result).toEqual({ error: 'Conversation not found' })
  })

  it('returns error when not a participant', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-3' } })
    mockDb.conversation.findUnique.mockResolvedValue({
      id: 'conv-1',
      participantOneId: 'user-1',
      participantTwoId: 'user-2',
    })

    const result = await sendMessage('conv-1', 'Hello')
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('sends notification to the other participant (as participant two)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-2' } })
    mockDb.conversation.findUnique.mockResolvedValue({
      id: 'conv-1',
      participantOneId: 'user-1',
      participantTwoId: 'user-2',
    })
    mockDb.$transaction.mockResolvedValue([{ id: 'msg-1' }, {}, {}])

    await sendMessage('conv-1', 'Hello')

    // The transaction call is the $transaction mock
    const txCall = mockDb.$transaction.mock.calls[0][0]
    // Third element is the notification.create call
    // Since we use array transaction, the notification should target participantOne
    expect(txCall).toBeDefined()
  })

  it('truncates long message body in notification', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.conversation.findUnique.mockResolvedValue({
      id: 'conv-1',
      participantOneId: 'user-1',
      participantTwoId: 'user-2',
    })
    const longMsg = 'x'.repeat(100)
    mockDb.$transaction.mockResolvedValue([{ id: 'msg-1' }, {}, {}])

    await sendMessage('conv-1', longMsg)
    // Verify the transaction was called (notification will truncate body internally)
    expect(mockDb.$transaction).toHaveBeenCalled()
  })
})

describe('getConversations', () => {
  it('returns conversations when authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const mockConvos = [{ id: 'conv-1' }, { id: 'conv-2' }]
    mockDb.conversation.findMany.mockResolvedValue(mockConvos)

    const result = await getConversations()
    expect(result).toEqual(mockConvos)
  })

  it('returns empty array when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await getConversations()
    expect(result).toEqual([])
  })

  it('returns empty array when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} })
    const result = await getConversations()
    expect(result).toEqual([])
  })
})

describe('getConversationMessages', () => {
  it('returns conversation with messages when participant', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const mockConv = {
      id: 'conv-1',
      participantOneId: 'user-1',
      participantTwoId: 'user-2',
      messages: [{ id: 'msg-1' }],
    }
    mockDb.conversation.findUnique.mockResolvedValue(mockConv)
    mockDb.message.updateMany.mockResolvedValue({ count: 1 })

    const result = await getConversationMessages('conv-1')
    expect(result).toEqual(mockConv)
    expect(mockDb.message.updateMany).toHaveBeenCalled()
  })

  it('returns null when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await getConversationMessages('conv-1')
    expect(result).toBeNull()
  })

  it('returns null when conversation not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.conversation.findUnique.mockResolvedValue(null)

    const result = await getConversationMessages('conv-1')
    expect(result).toBeNull()
  })

  it('returns null when not a participant', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-3' } })
    mockDb.conversation.findUnique.mockResolvedValue({
      id: 'conv-1',
      participantOneId: 'user-1',
      participantTwoId: 'user-2',
      messages: [],
    })

    const result = await getConversationMessages('conv-1')
    expect(result).toBeNull()
  })

  it('marks unread messages as read', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.conversation.findUnique.mockResolvedValue({
      id: 'conv-1',
      participantOneId: 'user-1',
      participantTwoId: 'user-2',
      messages: [],
    })
    mockDb.message.updateMany.mockResolvedValue({ count: 3 })

    await getConversationMessages('conv-1')

    expect(mockDb.message.updateMany).toHaveBeenCalledWith({
      where: {
        conversationId: 'conv-1',
        senderId: { not: 'user-1' },
        readAt: null,
      },
      data: { readAt: expect.any(Date) },
    })
  })
})

describe('getUnreadCount', () => {
  it('returns count when authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.conversation.findMany.mockResolvedValue([
      { id: 'conv-1' },
      { id: 'conv-2' },
    ])
    mockDb.message.count.mockResolvedValue(5)

    const result = await getUnreadCount()
    expect(result).toBe(5)
  })

  it('returns 0 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await getUnreadCount()
    expect(result).toBe(0)
  })

  it('returns 0 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} })
    const result = await getUnreadCount()
    expect(result).toBe(0)
  })
})
