import { describe, it, expect } from 'vitest'
import {
  signUpSchema,
  signInSchema,
  profileSchema,
  shoePostSchema,
  matchRequestSchema,
  messageSchema,
  reportSchema,
} from './validations'

// ---------------------------------------------------------------------------
// signUpSchema
// ---------------------------------------------------------------------------

describe('signUpSchema', () => {
  it('accepts valid input with all fields', () => {
    const result = signUpSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
      city: 'Portland',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid input without optional city', () => {
    const result = signUpSchema.safeParse({
      name: 'Bob',
      email: 'bob@example.com',
      password: '12345678',
    })
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 characters', () => {
    const result = signUpSchema.safeParse({
      name: 'A',
      email: 'a@b.com',
      password: '12345678',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = signUpSchema.safeParse({
      name: '',
      email: 'a@b.com',
      password: '12345678',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing name', () => {
    const result = signUpSchema.safeParse({
      email: 'a@b.com',
      password: '12345678',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = signUpSchema.safeParse({
      name: 'Alice',
      email: 'not-an-email',
      password: '12345678',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty email', () => {
    const result = signUpSchema.safeParse({
      name: 'Alice',
      email: '',
      password: '12345678',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = signUpSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      password: '1234567',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = signUpSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })

  it('accepts password with exactly 8 characters', () => {
    const result = signUpSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      password: '12345678',
    })
    expect(result.success).toBe(true)
  })

  it('accepts name with exactly 2 characters', () => {
    const result = signUpSchema.safeParse({
      name: 'Al',
      email: 'alice@example.com',
      password: '12345678',
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// signInSchema
// ---------------------------------------------------------------------------

describe('signInSchema', () => {
  it('accepts valid credentials', () => {
    const result = signInSchema.safeParse({
      email: 'user@example.com',
      password: 'a',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = signInSchema.safeParse({
      email: 'invalid',
      password: 'pass',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = signInSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing email', () => {
    const result = signInSchema.safeParse({
      password: 'pass',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing password', () => {
    const result = signInSchema.safeParse({
      email: 'user@example.com',
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// profileSchema
// ---------------------------------------------------------------------------

describe('profileSchema', () => {
  it('accepts valid profile with all fields', () => {
    const result = profileSchema.safeParse({
      name: 'Alice',
      city: 'Portland',
      preferredContact: 'email',
    })
    expect(result.success).toBe(true)
  })

  it('accepts profile with only required name', () => {
    const result = profileSchema.safeParse({
      name: 'Alice',
    })
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 characters', () => {
    const result = profileSchema.safeParse({
      name: 'A',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing name', () => {
    const result = profileSchema.safeParse({
      city: 'Portland',
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// shoePostSchema
// ---------------------------------------------------------------------------

describe('shoePostSchema', () => {
  const validPost = {
    type: 'LOST' as const,
    title: 'Lost my Nike Air Max',
    description: 'I lost my shoe at the park yesterday afternoon.',
    brand: 'Nike',
    model: 'Air Max 90',
    category: 'SNEAKER' as const,
    size: '10',
    primaryColor: 'White',
    secondaryColor: 'Black',
    side: 'LEFT' as const,
    genderCategory: 'Men',
    condition: 'GOOD' as const,
    locationText: 'Central Park, NYC',
    latitude: 40.785091,
    longitude: -73.968285,
    dateOccurred: '2024-01-15',
    reward: '$50',
  }

  it('accepts valid post with all fields', () => {
    const result = shoePostSchema.safeParse(validPost)
    expect(result.success).toBe(true)
  })

  it('accepts valid post without optional fields', () => {
    const result = shoePostSchema.safeParse({
      type: 'FOUND',
      title: 'Found a shoe',
      description: 'Found a shoe near the bus stop on Main Street.',
      brand: 'Adidas',
      category: 'BOOT',
      size: '9',
      primaryColor: 'Brown',
      side: 'RIGHT',
      condition: 'FAIR',
      locationText: 'Main St Bus Stop',
      dateOccurred: '2024-01-20',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid type', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      type: 'STOLEN',
    })
    expect(result.success).toBe(false)
  })

  it('rejects title shorter than 3 characters', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      title: 'Hi',
    })
    expect(result.success).toBe(false)
  })

  it('rejects title longer than 100 characters', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      title: 'x'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('rejects description shorter than 10 characters', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      description: 'Short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects description longer than 2000 characters', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      description: 'x'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty brand', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      brand: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid category', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      category: 'FLIP_FLOP',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid categories', () => {
    const categories = [
      'SNEAKER', 'BOOT', 'SANDAL', 'HEEL', 'LOAFER',
      'DRESS_SHOE', 'ATHLETIC', 'SLIPPER', 'OTHER',
    ]
    for (const category of categories) {
      const result = shoePostSchema.safeParse({
        ...validPost,
        category,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects empty size', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      size: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty primaryColor', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      primaryColor: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid side', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      side: 'BOTH',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid condition', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      condition: 'TERRIBLE',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid conditions', () => {
    for (const condition of ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'WORN']) {
      const result = shoePostSchema.safeParse({
        ...validPost,
        condition,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects empty locationText', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      locationText: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty dateOccurred', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      dateOccurred: '',
    })
    expect(result.success).toBe(false)
  })

  it('accepts title with exactly 3 characters', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      title: 'abc',
    })
    expect(result.success).toBe(true)
  })

  it('accepts title with exactly 100 characters', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      title: 'x'.repeat(100),
    })
    expect(result.success).toBe(true)
  })

  it('accepts description with exactly 10 characters', () => {
    const result = shoePostSchema.safeParse({
      ...validPost,
      description: 'x'.repeat(10),
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// matchRequestSchema
// ---------------------------------------------------------------------------

describe('matchRequestSchema', () => {
  it('accepts valid match request', () => {
    const result = matchRequestSchema.safeParse({
      shoePostId: 'abc-123',
      message: 'I think I found your shoe!',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty shoePostId', () => {
    const result = matchRequestSchema.safeParse({
      shoePostId: '',
      message: 'I think I found your shoe!',
    })
    expect(result.success).toBe(false)
  })

  it('rejects message shorter than 5 characters', () => {
    const result = matchRequestSchema.safeParse({
      shoePostId: 'abc',
      message: 'Hi!',
    })
    expect(result.success).toBe(false)
  })

  it('rejects message longer than 1000 characters', () => {
    const result = matchRequestSchema.safeParse({
      shoePostId: 'abc',
      message: 'x'.repeat(1001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts message with exactly 5 characters', () => {
    const result = matchRequestSchema.safeParse({
      shoePostId: 'abc',
      message: 'Hello',
    })
    expect(result.success).toBe(true)
  })

  it('accepts message with exactly 1000 characters', () => {
    const result = matchRequestSchema.safeParse({
      shoePostId: 'abc',
      message: 'x'.repeat(1000),
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// messageSchema
// ---------------------------------------------------------------------------

describe('messageSchema', () => {
  it('accepts valid message', () => {
    const result = messageSchema.safeParse({
      conversationId: 'conv-1',
      body: 'Hello, how are you?',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty conversationId', () => {
    const result = messageSchema.safeParse({
      conversationId: '',
      body: 'Hello',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty body', () => {
    const result = messageSchema.safeParse({
      conversationId: 'conv-1',
      body: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects body longer than 2000 characters', () => {
    const result = messageSchema.safeParse({
      conversationId: 'conv-1',
      body: 'x'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts body with exactly 2000 characters', () => {
    const result = messageSchema.safeParse({
      conversationId: 'conv-1',
      body: 'x'.repeat(2000),
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// reportSchema
// ---------------------------------------------------------------------------

describe('reportSchema', () => {
  it('accepts valid report with all fields', () => {
    const result = reportSchema.safeParse({
      shoePostId: 'post-1',
      reportedUserId: 'user-1',
      reason: 'Spam posting',
      details: 'They posted the same listing multiple times.',
    })
    expect(result.success).toBe(true)
  })

  it('accepts report with only reason', () => {
    const result = reportSchema.safeParse({
      reason: 'This is suspicious behavior',
    })
    expect(result.success).toBe(true)
  })

  it('rejects reason shorter than 5 characters', () => {
    const result = reportSchema.safeParse({
      reason: 'Bad',
    })
    expect(result.success).toBe(false)
  })

  it('rejects reason longer than 500 characters', () => {
    const result = reportSchema.safeParse({
      reason: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('rejects details longer than 2000 characters', () => {
    const result = reportSchema.safeParse({
      reason: 'Valid reason here',
      details: 'x'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts reason with exactly 5 characters', () => {
    const result = reportSchema.safeParse({
      reason: 'Hello',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty optional fields', () => {
    const result = reportSchema.safeParse({
      reason: 'Valid reason here',
      shoePostId: undefined,
      reportedUserId: undefined,
      details: undefined,
    })
    expect(result.success).toBe(true)
  })
})
