import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: vi.fn(), create: vi.fn(), count: vi.fn(), update: vi.fn() },
    shoePost: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    matchRequest: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    conversation: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    message: { create: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
    notification: { create: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
    matchSuggestion: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), upsert: vi.fn(), count: vi.fn() },
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

import { getAdminStats, updateReportStatus, deletePostAdmin } from './admin-actions'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>
const mockDb = db as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getAdminStats', () => {
  it('returns stats when admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', isAdmin: true } })
    mockDb.user.count.mockResolvedValue(100)
    mockDb.shoePost.count
      .mockResolvedValueOnce(200) // totalListings
      .mockResolvedValueOnce(150) // openListings
      .mockResolvedValueOnce(30)  // confirmedMatches
    mockDb.report.count.mockResolvedValue(5)
    mockDb.matchSuggestion.count
      .mockResolvedValueOnce(50)  // totalSuggestions
      .mockResolvedValueOnce(20)  // confirmedSuggestions

    const result = await getAdminStats()
    expect(result).toEqual({
      totalUsers: 100,
      totalListings: 200,
      openListings: 150,
      confirmedMatches: 30,
      openReports: 5,
      acceptanceRate: 40,
      totalSuggestions: 50,
      confirmedSuggestions: 20,
    })
  })

  it('returns 0 acceptance rate when no suggestions', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', isAdmin: true } })
    mockDb.user.count.mockResolvedValue(0)
    mockDb.shoePost.count.mockResolvedValue(0)
    mockDb.report.count.mockResolvedValue(0)
    mockDb.matchSuggestion.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)

    const result = await getAdminStats()
    expect(result.acceptanceRate).toBe(0)
  })

  it('throws when not admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isAdmin: false } })
    await expect(getAdminStats()).rejects.toThrow('Unauthorized')
  })

  it('throws when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    await expect(getAdminStats()).rejects.toThrow('Unauthorized')
  })

  it('throws when session has no user', async () => {
    mockAuth.mockResolvedValue({ user: {} })
    await expect(getAdminStats()).rejects.toThrow('Unauthorized')
  })
})

describe('updateReportStatus', () => {
  it('updates report status when admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', isAdmin: true } })
    mockDb.report.update.mockResolvedValue({})

    await updateReportStatus('report-1', 'RESOLVED' as never)

    expect(mockDb.report.update).toHaveBeenCalledWith({
      where: { id: 'report-1' },
      data: { status: 'RESOLVED' },
    })
  })

  it('throws when not admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isAdmin: false } })
    await expect(updateReportStatus('report-1', 'RESOLVED' as never)).rejects.toThrow('Unauthorized')
  })

  it('throws when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    await expect(updateReportStatus('report-1', 'RESOLVED' as never)).rejects.toThrow('Unauthorized')
  })
})

describe('deletePostAdmin', () => {
  it('deletes post when admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', isAdmin: true } })
    mockDb.shoePost.delete.mockResolvedValue({})

    await deletePostAdmin('post-1')

    expect(mockDb.shoePost.delete).toHaveBeenCalledWith({
      where: { id: 'post-1' },
    })
  })

  it('throws when not admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isAdmin: false } })
    await expect(deletePostAdmin('post-1')).rejects.toThrow('Unauthorized')
  })

  it('throws when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    await expect(deletePostAdmin('post-1')).rejects.toThrow('Unauthorized')
  })
})
