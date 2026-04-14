import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: vi.fn(), create: vi.fn(), count: vi.fn(), update: vi.fn() },
    shoeImage: { deleteMany: vi.fn(), createMany: vi.fn() },
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
  createShoePost,
  updateShoePost,
  deleteShoePost,
  updatePostStatus,
  getRecentPosts,
  getPostById,
} from './post-actions'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>
const mockDb = db as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.$transaction.mockImplementation(
    async (fn: (tx: typeof mockDb) => Promise<unknown>) => fn(mockDb as never)
  )
})

const validShoePostInput = {
  type: 'LOST' as const,
  title: 'Lost my Nike',
  description: 'I lost my shoe yesterday at the park near the lake.',
  brand: 'Nike',
  category: 'SNEAKER' as const,
  size: '10',
  primaryColor: 'White',
  side: 'LEFT' as const,
  condition: 'GOOD' as const,
  locationText: 'Central Park',
  dateOccurred: '2024-01-15',
}

describe('createShoePost', () => {
  it('creates post when authenticated with valid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.create.mockResolvedValue({ id: 'post-1' })

    const result = await createShoePost(validShoePostInput, ['http://img.jpg'])
    expect(result).toEqual({ success: true, postId: 'post-1' })
    expect(mockDb.shoePost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          brand: 'Nike',
        }),
      })
    )
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await createShoePost(validShoePostInput, [])
    expect(result).toEqual({ error: 'You must be logged in' })
  })

  it('returns error when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} })
    const result = await createShoePost(validShoePostInput, [])
    expect(result).toEqual({ error: 'You must be logged in' })
  })

  it('returns error for invalid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const result = await createShoePost(
      { ...validShoePostInput, title: 'Hi' },
      []
    )
    expect(result.error).toBeDefined()
    expect(mockDb.shoePost.create).not.toHaveBeenCalled()
  })

  it('creates images with correct sort order', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.create.mockResolvedValue({ id: 'post-1' })

    await createShoePost(validShoePostInput, ['img1.jpg', 'img2.jpg'])

    const createCall = mockDb.shoePost.create.mock.calls[0][0]
    expect(createCall.data.images.create).toHaveLength(2)
    expect(createCall.data.images.create[0].isPrimary).toBe(true)
    expect(createCall.data.images.create[1].isPrimary).toBe(false)
    expect(createCall.data.images.create[0].sortOrder).toBe(0)
    expect(createCall.data.images.create[1].sortOrder).toBe(1)
  })
})

describe('updateShoePost', () => {
  it('updates post when owner', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue({ id: 'post-1', userId: 'user-1' })
    mockDb.shoePost.update.mockResolvedValue({})

    const result = await updateShoePost('post-1', { ...validShoePostInput, brand: 'Adidas' })
    expect(result).toEqual({ success: true })
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await updateShoePost('post-1', validShoePostInput)
    expect(result).toEqual({ error: 'You must be logged in' })
  })

  it('returns error when not owner', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-2' } })
    mockDb.shoePost.findUnique.mockResolvedValue({ id: 'post-1', userId: 'user-1' })

    const result = await updateShoePost('post-1', validShoePostInput)
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error when post not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue(null)

    const result = await updateShoePost('post-1', validShoePostInput)
    expect(result).toEqual({ error: 'Post not found' })
  })

  it('converts dateOccurred string to Date', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue({ id: 'post-1', userId: 'user-1' })
    mockDb.shoePost.update.mockResolvedValue({})

    await updateShoePost('post-1', { ...validShoePostInput, dateOccurred: '2024-06-01' })

    const updateData = mockDb.shoePost.update.mock.calls[0][0].data
    expect(updateData.dateOccurred).toBeInstanceOf(Date)
  })
})

describe('deleteShoePost', () => {
  it('deletes post when owner', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue({ id: 'post-1', userId: 'user-1' })
    mockDb.shoePost.delete.mockResolvedValue({})

    const result = await deleteShoePost('post-1')
    expect(result).toEqual({ success: true })
  })

  it('deletes post when admin (not owner)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', isAdmin: true } })
    mockDb.shoePost.findUnique.mockResolvedValue({ id: 'post-1', userId: 'user-1' })
    mockDb.shoePost.delete.mockResolvedValue({})

    const result = await deleteShoePost('post-1')
    expect(result).toEqual({ success: true })
  })

  it('returns error when not owner and not admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-2' } })
    mockDb.shoePost.findUnique.mockResolvedValue({ id: 'post-1', userId: 'user-1' })

    const result = await deleteShoePost('post-1')
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await deleteShoePost('post-1')
    expect(result).toEqual({ error: 'You must be logged in' })
  })

  it('returns error when post not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue(null)

    const result = await deleteShoePost('post-1')
    expect(result).toEqual({ error: 'Post not found' })
  })
})

describe('updatePostStatus', () => {
  it('updates status when owner', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue({ id: 'post-1', userId: 'user-1' })
    mockDb.shoePost.update.mockResolvedValue({})

    const result = await updatePostStatus('post-1', 'MATCHED' as never)
    expect(result).toEqual({ success: true })
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await updatePostStatus('post-1', 'MATCHED' as never)
    expect(result).toEqual({ error: 'You must be logged in' })
  })

  it('returns error when not owner', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-2' } })
    mockDb.shoePost.findUnique.mockResolvedValue({ id: 'post-1', userId: 'user-1' })

    const result = await updatePostStatus('post-1', 'MATCHED' as never)
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error when post not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue(null)

    const result = await updatePostStatus('post-1', 'MATCHED' as never)
    expect(result).toEqual({ error: 'Post not found' })
  })

  it('updates status when admin (not owner)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', isAdmin: true } })
    mockDb.shoePost.findUnique.mockResolvedValue({ id: 'post-1', userId: 'user-1' })
    mockDb.shoePost.update.mockResolvedValue({})

    const result = await updatePostStatus('post-1', 'MATCHED' as never)
    expect(result).toEqual({ success: true })
  })
})

describe('getRecentPosts', () => {
  it('returns paginated results with defaults', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([{ id: '1' }])
    mockDb.shoePost.count.mockResolvedValue(1)

    const result = await getRecentPosts({})
    expect(result).toEqual({
      posts: [{ id: '1' }],
      total: 1,
      pages: 1,
      page: 1,
    })
  })

  it('applies type filter', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.count.mockResolvedValue(0)

    await getRecentPosts({ type: 'LOST' })

    const whereArg = mockDb.shoePost.findMany.mock.calls[0][0].where
    expect(whereArg.AND).toContainEqual({ type: 'LOST' })
  })

  it('applies category filter', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.count.mockResolvedValue(0)

    await getRecentPosts({ category: 'BOOT' })

    const whereArg = mockDb.shoePost.findMany.mock.calls[0][0].where
    expect(whereArg.AND).toContainEqual({ category: 'BOOT' })
  })

  it('applies side filter', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.count.mockResolvedValue(0)

    await getRecentPosts({ side: 'LEFT' })

    const whereArg = mockDb.shoePost.findMany.mock.calls[0][0].where
    expect(whereArg.AND).toContainEqual({ side: 'LEFT' })
  })

  it('applies search filter', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.count.mockResolvedValue(0)

    await getRecentPosts({ search: 'nike' })

    const whereArg = mockDb.shoePost.findMany.mock.calls[0][0].where
    const searchClause = whereArg.AND.find(
      (f: { OR?: unknown[] }) => f.OR !== undefined
    )
    expect(searchClause?.OR).toHaveLength(3)
  })

  it('applies color filter', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.count.mockResolvedValue(0)

    await getRecentPosts({ color: 'red' })

    const whereArg = mockDb.shoePost.findMany.mock.calls[0][0].where
    expect(whereArg.AND).toContainEqual({
      primaryColor: { contains: 'red', mode: 'insensitive' },
    })
  })

  it('applies custom status filter', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.count.mockResolvedValue(0)

    await getRecentPosts({ status: 'MATCHED' })

    const whereArg = mockDb.shoePost.findMany.mock.calls[0][0].where
    expect(whereArg.AND).toContainEqual({ status: 'MATCHED' })
  })

  it('defaults to OPEN and POTENTIAL_MATCH status when no status specified', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.count.mockResolvedValue(0)

    await getRecentPosts({})

    const whereArg = mockDb.shoePost.findMany.mock.calls[0][0].where
    expect(whereArg.AND).toContainEqual({
      status: { in: ['OPEN', 'POTENTIAL_MATCH'] },
    })
  })

  it('paginates correctly', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.count.mockResolvedValue(25)

    const result = await getRecentPosts({ page: 2, limit: 10 })

    expect(result.pages).toBe(3)
    expect(result.page).toBe(2)
    const findCall = mockDb.shoePost.findMany.mock.calls[0][0]
    expect(findCall.skip).toBe(10)
    expect(findCall.take).toBe(10)
  })

  it('ignores invalid type values', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.count.mockResolvedValue(0)

    await getRecentPosts({ type: 'INVALID' })

    const whereArg = mockDb.shoePost.findMany.mock.calls[0][0].where
    expect(whereArg.AND.some((f: { type?: string }) => f.type !== undefined)).toBe(false)
  })

  it('ignores invalid side values', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.count.mockResolvedValue(0)

    await getRecentPosts({ side: 'BOTH' })

    const whereArg = mockDb.shoePost.findMany.mock.calls[0][0].where
    expect(whereArg.AND.some((f: { side?: string }) => f.side !== undefined)).toBe(false)
  })

  it('applies size filter', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.count.mockResolvedValue(0)

    await getRecentPosts({ size: '10' })

    const whereArg = mockDb.shoePost.findMany.mock.calls[0][0].where
    expect(whereArg.AND).toContainEqual({ size: '10' })
  })

  it('applies FOUND type filter', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.count.mockResolvedValue(0)

    await getRecentPosts({ type: 'FOUND' })

    const whereArg = mockDb.shoePost.findMany.mock.calls[0][0].where
    expect(whereArg.AND).toContainEqual({ type: 'FOUND' })
  })

  it('applies RIGHT side filter', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.count.mockResolvedValue(0)

    await getRecentPosts({ side: 'RIGHT' })

    const whereArg = mockDb.shoePost.findMany.mock.calls[0][0].where
    expect(whereArg.AND).toContainEqual({ side: 'RIGHT' })
  })

  it('excludes listings from disabled users', async () => {
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.count.mockResolvedValue(0)

    await getRecentPosts({})

    const whereArg = mockDb.shoePost.findMany.mock.calls[0][0].where
    expect(whereArg.AND).toContainEqual({ user: { disabled: false } })
  })
})

describe('getPostById', () => {
  it('returns post by id', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'viewer-1' } })
    const mockPost = { id: 'post-1', title: 'Test', userId: 'owner-1' }
    mockDb.shoePost.findUnique.mockResolvedValue(mockPost)
    mockDb.user.findUnique.mockResolvedValue({ disabled: false })

    const result = await getPostById('post-1')
    expect(result).toEqual(mockPost)
  })

  it('returns null when post not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'viewer-1' } })
    mockDb.shoePost.findUnique.mockResolvedValue(null)

    const result = await getPostById('nonexistent')
    expect(result).toBeNull()
  })

  it('returns null when owner is disabled and viewer is not admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'viewer-1', isAdmin: false } })
    mockDb.shoePost.findUnique.mockResolvedValue({
      id: 'post-1',
      userId: 'owner-1',
    })
    mockDb.user.findUnique.mockResolvedValue({ disabled: true })

    const result = await getPostById('post-1')
    expect(result).toBeNull()
  })

  it('returns post when owner is disabled but viewer is admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', isAdmin: true } })
    const mockPost = { id: 'post-1', title: 'Test', userId: 'owner-1' }
    mockDb.shoePost.findUnique.mockResolvedValue(mockPost)

    const result = await getPostById('post-1')
    expect(result).toEqual(mockPost)
    expect(mockDb.user.findUnique).not.toHaveBeenCalled()
  })
})
