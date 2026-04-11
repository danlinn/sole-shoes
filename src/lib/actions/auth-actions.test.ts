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

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { registerUser, loginUser, logoutUser } from './auth-actions'
import { db } from '@/lib/db'
import { signIn, signOut } from '@/lib/auth'
import bcrypt from 'bcryptjs'

const mockDb = db as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
}
const mockSignIn = signIn as ReturnType<typeof vi.fn>
const mockSignOut = signOut as ReturnType<typeof vi.fn>
const mockBcrypt = bcrypt as unknown as { hash: ReturnType<typeof vi.fn>; compare: ReturnType<typeof vi.fn> }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('registerUser', () => {
  it('registers user with valid input', async () => {
    mockDb.user.findUnique.mockResolvedValue(null)
    mockBcrypt.hash.mockResolvedValue('hashed-pw')
    mockDb.user.create.mockResolvedValue({ id: '1' })

    const result = await registerUser({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    })

    expect(result).toEqual({ success: true })
    expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12)
    expect(mockDb.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Alice',
        email: 'alice@example.com',
        passwordHash: 'hashed-pw',
        city: null,
      },
    })
  })

  it('registers user with city', async () => {
    mockDb.user.findUnique.mockResolvedValue(null)
    mockBcrypt.hash.mockResolvedValue('hashed')
    mockDb.user.create.mockResolvedValue({ id: '1' })

    const result = await registerUser({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password123',
      city: 'Portland',
    })

    expect(result).toEqual({ success: true })
    expect(mockDb.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ city: 'Portland' }),
      })
    )
  })

  it('returns error for invalid input (short name)', async () => {
    const result = await registerUser({
      name: 'A',
      email: 'alice@example.com',
      password: 'password123',
    })
    expect(result.error).toBeDefined()
    expect(mockDb.user.findUnique).not.toHaveBeenCalled()
  })

  it('returns error for invalid input (invalid email)', async () => {
    const result = await registerUser({
      name: 'Alice',
      email: 'not-email',
      password: 'password123',
    })
    expect(result.error).toBeDefined()
  })

  it('returns error for invalid input (short password)', async () => {
    const result = await registerUser({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'short',
    })
    expect(result.error).toBeDefined()
  })

  it('returns error when email already exists', async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: 'existing' })

    const result = await registerUser({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    })

    expect(result).toEqual({ error: 'An account with this email already exists' })
    expect(mockDb.user.create).not.toHaveBeenCalled()
  })
})

describe('loginUser', () => {
  it('returns success on valid login', async () => {
    mockSignIn.mockResolvedValue(undefined)

    const result = await loginUser({
      email: 'alice@example.com',
      password: 'password123',
    })

    expect(result).toEqual({ success: true })
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'alice@example.com',
      password: 'password123',
      redirect: false,
    })
  })

  it('returns error on failed login', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid'))

    const result = await loginUser({
      email: 'alice@example.com',
      password: 'wrong',
    })

    expect(result).toEqual({ error: 'Invalid email or password' })
  })
})

describe('logoutUser', () => {
  it('calls signOut', async () => {
    mockSignOut.mockResolvedValue(undefined)
    await logoutUser()
    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false })
  })
})
