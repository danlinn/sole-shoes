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

import { runMatchPipeline } from './match-pipeline'
import { db } from '@/lib/db'

const mockDb = db as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

beforeEach(() => {
  vi.clearAllMocks()
})

const makePost = (overrides: Record<string, unknown> = {}) => ({
  id: 'source-1',
  type: 'LOST',
  side: 'LEFT',
  brand: 'Nike',
  model: 'Air Max',
  category: 'SNEAKER',
  size: '10',
  primaryColor: 'White',
  locationText: 'NYC',
  userId: 'user-1',
  status: 'OPEN',
  ...overrides,
})

describe('runMatchPipeline', () => {
  it('throws when source post not found', async () => {
    mockDb.shoePost.findUnique.mockResolvedValue(null)

    await expect(runMatchPipeline('bad-id')).rejects.toThrow('ShoePost not found: bad-id')
  })

  it('returns early with no candidates', async () => {
    const source = makePost()
    mockDb.shoePost.findUnique.mockResolvedValue(source)
    mockDb.shoePost.findMany.mockResolvedValue([])
    mockDb.shoePost.update.mockResolvedValue({})

    const result = await runMatchPipeline('source-1')

    expect(result).toEqual({
      sourcePostId: 'source-1',
      candidatesEvaluated: 0,
      suggestionsCreated: 0,
      topScore: null,
    })
    // markProcessed should still be called
    expect(mockDb.shoePost.update).toHaveBeenCalledWith({
      where: { id: 'source-1' },
      data: { aiProcessedAt: expect.any(Date) },
    })
  })

  it('scores candidates and saves suggestions', async () => {
    const source = makePost()
    const candidate = makePost({
      id: 'candidate-1',
      type: 'FOUND',
      side: 'RIGHT',
      brand: 'Nike',
      model: 'Air Max',
      category: 'SNEAKER',
      primaryColor: 'White',
      size: '10',
      locationText: 'NYC',
      userId: 'user-2',
    })

    mockDb.shoePost.findUnique.mockResolvedValue(source)
    mockDb.shoePost.findMany.mockResolvedValue([candidate])
    mockDb.matchSuggestion.upsert.mockResolvedValue({})
    mockDb.notification.create.mockResolvedValue({})
    mockDb.shoePost.update.mockResolvedValue({})

    const result = await runMatchPipeline('source-1')

    expect(result.candidatesEvaluated).toBe(1)
    expect(result.suggestionsCreated).toBe(1)
    expect(result.topScore).toBeGreaterThan(0)
    expect(mockDb.matchSuggestion.upsert).toHaveBeenCalled()
  })

  it('does not save suggestions with score 0', async () => {
    const source = makePost()
    // Candidate with same type and same side will get severely penalized
    const candidate = makePost({
      id: 'candidate-1',
      type: 'LOST',
      side: 'LEFT',
      brand: 'Adidas',
      model: 'Superstar',
      category: 'HEEL',
      primaryColor: 'Red',
      size: '6',
      locationText: 'Tokyo',
      userId: 'user-2',
    })

    mockDb.shoePost.findUnique.mockResolvedValue(source)
    mockDb.shoePost.findMany.mockResolvedValue([candidate])
    mockDb.shoePost.update.mockResolvedValue({})

    const result = await runMatchPipeline('source-1')

    expect(result.suggestionsCreated).toBe(0)
    expect(mockDb.matchSuggestion.upsert).not.toHaveBeenCalled()
  })

  it('creates notifications for high-score matches', async () => {
    const source = makePost()
    // Perfect match candidate
    const candidate = makePost({
      id: 'candidate-1',
      type: 'FOUND',
      side: 'RIGHT',
      brand: 'Nike',
      model: 'Air Max',
      category: 'SNEAKER',
      primaryColor: 'White',
      size: '10',
      locationText: 'NYC',
      userId: 'user-2',
    })

    mockDb.shoePost.findUnique.mockResolvedValue(source)
    mockDb.shoePost.findMany.mockResolvedValue([candidate])
    mockDb.matchSuggestion.upsert.mockResolvedValue({})
    mockDb.notification.create.mockResolvedValue({})
    mockDb.shoePost.update.mockResolvedValue({})

    await runMatchPipeline('source-1')

    // Should create 2 notifications: one for source owner, one for candidate owner
    expect(mockDb.notification.create).toHaveBeenCalledTimes(2)
  })

  it('handles notification creation failure gracefully', async () => {
    const source = makePost()
    const candidate = makePost({
      id: 'candidate-1',
      type: 'FOUND',
      side: 'RIGHT',
      brand: 'Nike',
      model: 'Air Max',
      category: 'SNEAKER',
      primaryColor: 'White',
      size: '10',
      locationText: 'NYC',
      userId: 'user-2',
    })

    mockDb.shoePost.findUnique.mockResolvedValue(source)
    mockDb.shoePost.findMany.mockResolvedValue([candidate])
    mockDb.matchSuggestion.upsert.mockResolvedValue({})
    mockDb.notification.create.mockRejectedValue(new Error('DB error'))
    mockDb.shoePost.update.mockResolvedValue({})

    // Should not throw
    const result = await runMatchPipeline('source-1')
    expect(result.suggestionsCreated).toBe(1)
  })

  it('processes multiple candidates and returns top score', async () => {
    const source = makePost()
    const goodCandidate = makePost({
      id: 'good-1',
      type: 'FOUND',
      side: 'RIGHT',
      brand: 'Nike',
      model: 'Air Max',
      category: 'SNEAKER',
      primaryColor: 'White',
      size: '10',
      locationText: 'NYC',
      userId: 'user-2',
    })
    const okCandidate = makePost({
      id: 'ok-1',
      type: 'FOUND',
      side: 'RIGHT',
      brand: 'Adidas',
      model: 'Superstar',
      category: 'SNEAKER',
      primaryColor: 'Black',
      size: '10',
      locationText: 'LA',
      userId: 'user-3',
    })

    mockDb.shoePost.findUnique.mockResolvedValue(source)
    mockDb.shoePost.findMany.mockResolvedValue([goodCandidate, okCandidate])
    mockDb.matchSuggestion.upsert.mockResolvedValue({})
    mockDb.notification.create.mockResolvedValue({})
    mockDb.shoePost.update.mockResolvedValue({})

    const result = await runMatchPipeline('source-1')

    expect(result.candidatesEvaluated).toBe(2)
    expect(result.suggestionsCreated).toBe(2)
    expect(result.topScore).toBeGreaterThan(0)
  })

  it('works with FOUND source post (finds LOST candidates)', async () => {
    const source = makePost({ type: 'FOUND', side: 'RIGHT' })
    const candidate = makePost({
      id: 'candidate-1',
      type: 'LOST',
      side: 'LEFT',
      userId: 'user-2',
    })

    mockDb.shoePost.findUnique.mockResolvedValue(source)
    mockDb.shoePost.findMany.mockResolvedValue([candidate])
    mockDb.matchSuggestion.upsert.mockResolvedValue({})
    mockDb.notification.create.mockResolvedValue({})
    mockDb.shoePost.update.mockResolvedValue({})

    const result = await runMatchPipeline('source-1')
    expect(result.candidatesEvaluated).toBe(1)
    expect(result.suggestionsCreated).toBeGreaterThanOrEqual(1)
  })

  it('does not create notifications for low-score matches', async () => {
    const source = makePost()
    // Candidate with different brand/model/color/location but right type/side
    const candidate = makePost({
      id: 'candidate-1',
      type: 'FOUND',
      side: 'RIGHT',
      brand: 'Adidas',
      model: 'Superstar',
      category: 'BOOT',
      primaryColor: 'Black',
      size: '6',
      locationText: 'LA',
      userId: 'user-2',
    })

    mockDb.shoePost.findUnique.mockResolvedValue(source)
    mockDb.shoePost.findMany.mockResolvedValue([candidate])
    mockDb.matchSuggestion.upsert.mockResolvedValue({})
    mockDb.shoePost.update.mockResolvedValue({})

    await runMatchPipeline('source-1')

    // Notifications should NOT be created since score will be < 70
    expect(mockDb.notification.create).not.toHaveBeenCalled()
  })

  it('marks post as processed', async () => {
    const source = makePost()
    const candidate = makePost({
      id: 'candidate-1',
      type: 'FOUND',
      side: 'RIGHT',
      userId: 'user-2',
    })

    mockDb.shoePost.findUnique.mockResolvedValue(source)
    mockDb.shoePost.findMany.mockResolvedValue([candidate])
    mockDb.matchSuggestion.upsert.mockResolvedValue({})
    mockDb.notification.create.mockResolvedValue({})
    mockDb.shoePost.update.mockResolvedValue({})

    await runMatchPipeline('source-1')

    expect(mockDb.shoePost.update).toHaveBeenCalledWith({
      where: { id: 'source-1' },
      data: { aiProcessedAt: expect.any(Date) },
    })
  })
})
