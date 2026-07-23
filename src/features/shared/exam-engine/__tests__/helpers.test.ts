import { describe, it, expect } from 'vitest'
import { parseSubjectIds } from '../helpers'

describe('parseSubjectIds', () => {
  it('returns empty array for null', () => {
    expect(parseSubjectIds(null)).toEqual([])
  })

  it('returns empty array for undefined', () => {
    expect(parseSubjectIds(undefined)).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseSubjectIds('')).toEqual([])
  })

  it('returns empty array for whitespace-only string', () => {
    expect(parseSubjectIds('   ')).toEqual([])
  })

  it('returns empty array for non-JSON string', () => {
    expect(parseSubjectIds('not-json')).toEqual([])
  })

  it('returns empty array for JSON non-array', () => {
    expect(parseSubjectIds('"just a string"')).toEqual([])
    expect(parseSubjectIds('123')).toEqual([])
    expect(parseSubjectIds('{"key":"value"}')).toEqual([])
  })

  it('parses a valid JSON array of strings', () => {
    expect(parseSubjectIds('["a","b","c"]')).toEqual(['a', 'b', 'c'])
  })

  it('filters non-string elements from JSON array', () => {
    expect(parseSubjectIds('["a",1,true,null]')).toEqual(['a'])
  })

  it('returns empty array for empty JSON array', () => {
    expect(parseSubjectIds('[]')).toEqual([])
  })

  it('handles a raw array input', () => {
    expect(parseSubjectIds(['x', 'y', 'z'])).toEqual(['x', 'y', 'z'])
  })

  it('filters non-strings from raw array input', () => {
    expect(parseSubjectIds(['a', 1, null, 'b'])).toEqual(['a', 'b'])
  })

  it('returns empty array for empty raw array', () => {
    expect(parseSubjectIds([])).toEqual([])
  })

  it('returns empty array for numeric input', () => {
    expect(parseSubjectIds(42)).toEqual([])
  })

  it('returns empty array for boolean input', () => {
    expect(parseSubjectIds(true)).toEqual([])
  })
})
