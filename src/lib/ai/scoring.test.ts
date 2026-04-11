import { describe, it, expect } from 'vitest'
import {
  parseSize,
  sizesAreCompatible,
  locationsOverlap,
  categoriesAreSimilar,
  computeMatchScore,
  type ScoringCandidate,
} from './scoring'

// ---------------------------------------------------------------------------
// parseSize
// ---------------------------------------------------------------------------

describe('parseSize', () => {
  it('parses integer size', () => {
    expect(parseSize('10')).toBe(10)
  })

  it('parses half size', () => {
    expect(parseSize('9.5')).toBe(9.5)
  })

  it('parses size with whitespace', () => {
    expect(parseSize(' 11 ')).toBe(11)
  })

  it('returns null for non-numeric string', () => {
    expect(parseSize('one-size')).toBeNull()
  })

  it('returns null for N/A', () => {
    expect(parseSize('N/A')).toBeNull()
  })

  it('returns 0 for empty string (Number("") is 0)', () => {
    expect(parseSize('')).toBe(0)
  })

  it('parses zero', () => {
    expect(parseSize('0')).toBe(0)
  })

  it('parses negative number', () => {
    expect(parseSize('-1')).toBe(-1)
  })

  it('returns null for Infinity', () => {
    expect(parseSize('Infinity')).toBeNull()
  })

  it('returns null for NaN', () => {
    expect(parseSize('NaN')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// sizesAreCompatible
// ---------------------------------------------------------------------------

describe('sizesAreCompatible', () => {
  it('returns true for same size', () => {
    expect(sizesAreCompatible('10', '10')).toBe(true)
  })

  it('returns true for sizes within 1', () => {
    expect(sizesAreCompatible('10', '11')).toBe(true)
  })

  it('returns true for half size difference', () => {
    expect(sizesAreCompatible('9', '9.5')).toBe(true)
  })

  it('returns true for exactly 1 size apart', () => {
    expect(sizesAreCompatible('8', '9')).toBe(true)
  })

  it('returns false for sizes more than 1 apart', () => {
    expect(sizesAreCompatible('8', '10')).toBe(false)
  })

  it('returns false for sizes 1.5 apart', () => {
    expect(sizesAreCompatible('8', '9.5')).toBe(false)
  })

  it('returns false when first size is non-numeric', () => {
    expect(sizesAreCompatible('N/A', '10')).toBe(false)
  })

  it('returns false when second size is non-numeric', () => {
    expect(sizesAreCompatible('10', 'unknown')).toBe(false)
  })

  it('returns false when both are non-numeric', () => {
    expect(sizesAreCompatible('small', 'medium')).toBe(false)
  })

  it('returns true for empty strings (both parse to 0, which are compatible)', () => {
    expect(sizesAreCompatible('', '')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// locationsOverlap
// ---------------------------------------------------------------------------

describe('locationsOverlap', () => {
  it('returns true when locations are identical', () => {
    expect(locationsOverlap('Central Park', 'Central Park')).toBe(true)
  })

  it('returns true when one contains the other', () => {
    expect(locationsOverlap('Central Park, NYC', 'Central Park')).toBe(true)
  })

  it('returns true when other contains one (reversed)', () => {
    expect(locationsOverlap('Central Park', 'Central Park, NYC')).toBe(true)
  })

  it('returns true for case-insensitive containment', () => {
    expect(locationsOverlap('CENTRAL PARK', 'central park')).toBe(true)
  })

  it('returns true when they share a significant word (>= 4 chars)', () => {
    expect(locationsOverlap('Downtown Portland', 'Portland Heights')).toBe(true)
  })

  it('returns false when they share only short words', () => {
    expect(locationsOverlap('SF Bay', 'LA Bay')).toBe(false)
  })

  it('returns false for completely different locations', () => {
    expect(locationsOverlap('New York', 'Los Angeles')).toBe(false)
  })

  it('returns false when first is empty', () => {
    expect(locationsOverlap('', 'Portland')).toBe(false)
  })

  it('returns false when second is empty', () => {
    expect(locationsOverlap('Portland', '')).toBe(false)
  })

  it('returns false when first is null', () => {
    expect(locationsOverlap(null, 'Portland')).toBe(false)
  })

  it('returns false when second is null', () => {
    expect(locationsOverlap('Portland', null)).toBe(false)
  })

  it('returns false when both are null', () => {
    expect(locationsOverlap(null, null)).toBe(false)
  })

  it('returns false when both are undefined', () => {
    expect(locationsOverlap(undefined, undefined)).toBe(false)
  })

  it('returns false for whitespace-only strings', () => {
    expect(locationsOverlap('   ', '   ')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// categoriesAreSimilar
// ---------------------------------------------------------------------------

describe('categoriesAreSimilar', () => {
  it('returns true for identical categories', () => {
    expect(categoriesAreSimilar('SNEAKER', 'SNEAKER')).toBe(true)
  })

  it('returns true for SNEAKER and ATHLETIC', () => {
    expect(categoriesAreSimilar('SNEAKER', 'ATHLETIC')).toBe(true)
  })

  it('returns true for ATHLETIC and SNEAKER', () => {
    expect(categoriesAreSimilar('ATHLETIC', 'SNEAKER')).toBe(true)
  })

  it('returns true for LOAFER and DRESS_SHOE', () => {
    expect(categoriesAreSimilar('LOAFER', 'DRESS_SHOE')).toBe(true)
  })

  it('returns true for DRESS_SHOE and LOAFER', () => {
    expect(categoriesAreSimilar('DRESS_SHOE', 'LOAFER')).toBe(true)
  })

  it('returns true for SANDAL and SLIPPER', () => {
    expect(categoriesAreSimilar('SANDAL', 'SLIPPER')).toBe(true)
  })

  it('returns true for SLIPPER and SANDAL', () => {
    expect(categoriesAreSimilar('SLIPPER', 'SANDAL')).toBe(true)
  })

  it('returns false for SNEAKER and BOOT', () => {
    expect(categoriesAreSimilar('SNEAKER', 'BOOT')).toBe(false)
  })

  it('returns false for HEEL and OTHER', () => {
    expect(categoriesAreSimilar('HEEL', 'OTHER')).toBe(false)
  })

  it('returns false for BOOT and SANDAL', () => {
    expect(categoriesAreSimilar('BOOT', 'SANDAL')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// computeMatchScore
// ---------------------------------------------------------------------------

describe('computeMatchScore', () => {
  const makeCandidate = (overrides: Partial<ScoringCandidate> = {}): ScoringCandidate => ({
    id: 'candidate-1',
    type: 'FOUND',
    side: 'RIGHT',
    brand: 'Nike',
    model: 'Air Max 90',
    category: 'SNEAKER',
    size: '10',
    primaryColor: 'White',
    locationText: 'Central Park, NYC',
    ...overrides,
  })

  const source: ScoringCandidate = {
    id: 'source-1',
    type: 'LOST',
    side: 'LEFT',
    brand: 'Nike',
    model: 'Air Max 90',
    category: 'SNEAKER',
    size: '10',
    primaryColor: 'White',
    locationText: 'Central Park, NYC',
  }

  it('returns high score for a perfect match', () => {
    const candidate = makeCandidate()
    const result = computeMatchScore(source, candidate)
    // opposite type (20) + opposite side (25) + brand (15) + model (10)
    // + category (10) + color (10) + size (5) + location (5) = 100
    expect(result.score).toBe(100)
    expect(result.factors.length).toBeGreaterThan(0)
    expect(result.explanation).toContain('Match score')
  })

  it('penalises same side', () => {
    const candidate = makeCandidate({ side: 'LEFT' })
    const result = computeMatchScore(source, candidate)
    const sideFactor = result.factors.find((f) => f.label.includes('Same side'))
    expect(sideFactor).toBeDefined()
    expect(sideFactor!.points).toBe(-30)
  })

  it('awards points for opposite type', () => {
    const candidate = makeCandidate({ type: 'FOUND' })
    const result = computeMatchScore(source, candidate)
    const typeFactor = result.factors.find((f) => f.label.includes('Opposite type'))
    expect(typeFactor).toBeDefined()
    expect(typeFactor!.points).toBe(20)
  })

  it('does not award opposite type when both are LOST', () => {
    const candidate = makeCandidate({ type: 'LOST' })
    const result = computeMatchScore(source, candidate)
    const typeFactor = result.factors.find((f) => f.label.includes('Opposite type'))
    expect(typeFactor).toBeUndefined()
  })

  it('awards points for opposite side', () => {
    const candidate = makeCandidate({ side: 'RIGHT' })
    const result = computeMatchScore(source, candidate)
    const sideFactor = result.factors.find((f) => f.label.includes('Opposite side'))
    expect(sideFactor).toBeDefined()
    expect(sideFactor!.points).toBe(25)
  })

  it('awards points for matching brand (case-insensitive)', () => {
    const candidate = makeCandidate({ brand: 'nike' })
    const result = computeMatchScore(source, candidate)
    const brandFactor = result.factors.find((f) => f.label.includes('Same brand'))
    expect(brandFactor).toBeDefined()
    expect(brandFactor!.points).toBe(15)
  })

  it('does not award brand points for different brands', () => {
    const candidate = makeCandidate({ brand: 'Adidas' })
    const result = computeMatchScore(source, candidate)
    const brandFactor = result.factors.find((f) => f.label.includes('Same brand'))
    expect(brandFactor).toBeUndefined()
  })

  it('awards points for matching model', () => {
    const candidate = makeCandidate({ model: 'Air Max 90' })
    const result = computeMatchScore(source, candidate)
    const modelFactor = result.factors.find((f) => f.label.includes('Same model'))
    expect(modelFactor).toBeDefined()
    expect(modelFactor!.points).toBe(10)
  })

  it('awards points for same category', () => {
    const candidate = makeCandidate({ category: 'SNEAKER' })
    const result = computeMatchScore(source, candidate)
    const catFactor = result.factors.find((f) => f.label.includes('Same category'))
    expect(catFactor).toBeDefined()
    expect(catFactor!.points).toBe(10)
  })

  it('awards 5 points for similar category', () => {
    const candidate = makeCandidate({ category: 'ATHLETIC' })
    const result = computeMatchScore(source, candidate)
    const catFactor = result.factors.find((f) => f.label.includes('Similar category'))
    expect(catFactor).toBeDefined()
    expect(catFactor!.points).toBe(5)
  })

  it('penalises different category', () => {
    const candidate = makeCandidate({ category: 'BOOT' })
    const result = computeMatchScore(source, candidate)
    const catFactor = result.factors.find((f) => f.label.includes('Different category'))
    expect(catFactor).toBeDefined()
    expect(catFactor!.points).toBe(-10)
  })

  it('awards points for matching color', () => {
    const candidate = makeCandidate({ primaryColor: 'white' })
    const result = computeMatchScore(source, candidate)
    const colorFactor = result.factors.find((f) => f.label.includes('Same color'))
    expect(colorFactor).toBeDefined()
    expect(colorFactor!.points).toBe(10)
  })

  it('awards points for compatible size', () => {
    const candidate = makeCandidate({ size: '10.5' })
    const result = computeMatchScore(source, candidate)
    const sizeFactor = result.factors.find((f) => f.label.includes('Compatible size'))
    expect(sizeFactor).toBeDefined()
    expect(sizeFactor!.points).toBe(5)
  })

  it('awards points for similar location', () => {
    const candidate = makeCandidate({ locationText: 'Central Park area' })
    const result = computeMatchScore(source, candidate)
    const locFactor = result.factors.find((f) => f.label.includes('Similar location'))
    expect(locFactor).toBeDefined()
    expect(locFactor!.points).toBe(5)
  })

  it('clamps score to minimum 0', () => {
    // same type + same side + different brand + different model + different category
    // + different color + incompatible size + different location
    const candidate = makeCandidate({
      type: 'LOST',
      side: 'LEFT',
      brand: 'Adidas',
      model: 'Superstar',
      category: 'HEEL',
      size: '6',
      primaryColor: 'Red',
      locationText: 'Tokyo',
    })
    const result = computeMatchScore(source, candidate)
    expect(result.score).toBe(0)
    expect(result.score).toBeGreaterThanOrEqual(0)
  })

  it('clamps score to maximum 100', () => {
    // Perfect match should not exceed 100
    const candidate = makeCandidate()
    const result = computeMatchScore(source, candidate)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('includes explanation for low match', () => {
    const candidate = makeCandidate({
      type: 'LOST',
      side: 'LEFT',
      brand: 'Adidas',
      model: 'Superstar',
      category: 'HEEL',
      size: '6',
      primaryColor: 'Red',
      locationText: 'Tokyo',
    })
    const result = computeMatchScore(source, candidate)
    expect(result.explanation).toContain('Low match')
  })

  it('does not match model when one is null', () => {
    const candidate = makeCandidate({ model: null })
    const result = computeMatchScore(source, candidate)
    const modelFactor = result.factors.find((f) => f.label.includes('Same model'))
    expect(modelFactor).toBeUndefined()
  })

  it('does not match brand when one is empty string', () => {
    const candidate = makeCandidate({ brand: '' })
    const result = computeMatchScore(source, candidate)
    const brandFactor = result.factors.find((f) => f.label.includes('Same brand'))
    expect(brandFactor).toBeUndefined()
  })

  it('awards opposite type when source is FOUND and candidate is LOST', () => {
    const foundSource: ScoringCandidate = {
      ...source,
      type: 'FOUND',
      side: 'RIGHT',
    }
    const candidate = makeCandidate({ type: 'LOST', side: 'LEFT' })
    const result = computeMatchScore(foundSource, candidate)
    const typeFactor = result.factors.find((f) => f.label.includes('Opposite type'))
    expect(typeFactor).toBeDefined()
    expect(typeFactor!.points).toBe(20)
  })

  it('awards opposite side when source is RIGHT and candidate is LEFT', () => {
    const rightSource: ScoringCandidate = {
      ...source,
      side: 'RIGHT',
    }
    const candidate = makeCandidate({ side: 'LEFT' })
    const result = computeMatchScore(rightSource, candidate)
    const sideFactor = result.factors.find((f) => f.label.includes('Opposite side'))
    expect(sideFactor).toBeDefined()
  })

  it('does not award size points for incompatible sizes', () => {
    const candidate = makeCandidate({ size: '14' })
    const result = computeMatchScore(source, candidate)
    const sizeFactor = result.factors.find((f) => f.label.includes('Compatible size'))
    expect(sizeFactor).toBeUndefined()
  })

  it('does not award location points for different locations', () => {
    const candidate = makeCandidate({ locationText: 'Tokyo' })
    const result = computeMatchScore(source, candidate)
    const locFactor = result.factors.find((f) => f.label.includes('Similar location'))
    expect(locFactor).toBeUndefined()
  })

  it('does not award color points for different colors', () => {
    const candidate = makeCandidate({ primaryColor: 'Red' })
    const result = computeMatchScore(source, candidate)
    const colorFactor = result.factors.find((f) => f.label.includes('Same color'))
    expect(colorFactor).toBeUndefined()
  })
})
