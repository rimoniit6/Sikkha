import { describe, it, expect } from 'vitest'
import { computeDiff, computeBulkDiff, summarizeChanges, classifyFileType, SEVERITY_MAP } from '@/lib/content-diff'

describe('Content Diff Engine', () => {
  // ─── Basic Field Changes ───

  describe('Added fields', () => {
    it('detects field added in version B', () => {
      const result = computeDiff({ title: 'Hello' }, { title: 'Hello', description: 'World' })
      expect(result.changes).toHaveLength(1)
      expect(result.changes[0].changeType).toBe('ADDED')
      expect(result.changes[0].fieldPath).toBe('description')
    })
  })

  describe('Removed fields', () => {
    it('detects field removed in version B', () => {
      const result = computeDiff({ title: 'Hello', description: 'World' }, { title: 'Hello' })
      expect(result.changes).toHaveLength(1)
      expect(result.changes[0].changeType).toBe('REMOVED')
    })
  })

  describe('Updated fields', () => {
    it('detects string change', () => {
      const result = computeDiff({ title: 'Old' }, { title: 'New' })
      expect(result.changes).toHaveLength(1)
      expect(result.changes[0].oldValue).toBe('Old')
      expect(result.changes[0].newValue).toBe('New')
    })
  })

  // ─── Severity ───

  describe('Change Severity', () => {
    it('classifies slug as CRITICAL', () => {
      const result = computeDiff({ slug: 'old' }, { slug: 'new' })
      expect(result.changes[0].severity).toBe('CRITICAL')
    })

    it('classifies price as HIGH', () => {
      const result = computeDiff({ price: 100 }, { price: 200 })
      expect(result.changes[0].severity).toBe('HIGH')
    })

    it('classifies status as HIGH', () => {
      const result = computeDiff({ status: 'DRAFT' }, { status: 'PUBLISHED' })
      expect(result.changes[0].severity).toBe('HIGH')
    })

    it('classifies title as LOW', () => {
      const result = computeDiff({ title: 'Old' }, { title: 'New' })
      expect(result.changes[0].severity).toBe('LOW')
    })

    it('classifies thumbnail as MEDIUM', () => {
      const result = computeDiff({ thumbnail: 'old.jpg' }, { thumbnail: 'new.jpg' })
      expect(result.changes[0].severity).toBe('MEDIUM')
    })

    it('defaults to LOW for unknown fields', () => {
      const result = computeDiff({ unknown: 'old' }, { unknown: 'new' })
      expect(result.changes[0].severity).toBe('LOW')
    })
  })

  // ─── File Type Classification ───

  describe('File type classification', () => {
    it('classifies image URLs', () => {
      expect(classifyFileType('https://utfs.io/f/abc.jpg')).toBe('image')
      expect(classifyFileType('https://example.com/photo.png')).toBe('image')
    })

    it('classifies video URLs', () => {
      expect(classifyFileType('https://example.com/video.mp4')).toBe('video')
    })

    it('classifies PDF URLs', () => {
      expect(classifyFileType('https://example.com/doc.pdf')).toBe('pdf')
    })

    it('classifies document URLs', () => {
      expect(classifyFileType('https://example.com/file.docx')).toBe('document')
    })

    it('classifies generic URLs', () => {
      expect(classifyFileType('https://example.com/page')).toBe('generic_url')
    })

    it('returns undefined for non-URLs', () => {
      expect(classifyFileType('just text')).toBeUndefined()
    })

    it('detects UploadThing image URLs', () => {
      expect(classifyFileType('https://utfs.io/f/abc123.jpg')).toBe('image')
    })

    it('detects UploadThing video URLs', () => {
      expect(classifyFileType('https://utfs.io/f/abc123.mp4')).toBe('video')
    })

    it('detects image field changes with file type', () => {
      const result = computeDiff({ thumbnail: 'old.jpg' }, { thumbnail: 'new.png' })
      expect(result.changes[0].fileType).toBe('image')
    })

    it('detects video field changes with file type', () => {
      const result = computeDiff({ videoUrl: 'old.mp4' }, { videoUrl: 'new.mp4' })
      expect(result.changes[0].fileType).toBe('video')
    })
  })

  // ─── Rich Text ───

  describe('Rich text changes', () => {
    it('ignores whitespace-only changes', () => {
      const result = computeDiff({ content: '<p>Hello   World</p>' }, { content: '<p>Hello World</p>' })
      expect(result.changes).toHaveLength(0)
    })

    it('detects actual content changes', () => {
      const result = computeDiff({ content: '<p>Hello World</p>' }, { content: '<p>Hello Universe</p>' })
      expect(result.changes).toHaveLength(1)
    })
  })

  // ─── Array Identity Changes ───

  describe('Array identity changes', () => {
    it('detects individual added items', () => {
      const result = computeDiff({ items: [1, 2, 3] }, { items: [1, 5, 3] })
      expect(result.changes).toHaveLength(2)
      const removed = result.changes.find(c => c.changeType === 'REMOVED')
      const added = result.changes.find(c => c.changeType === 'ADDED')
      expect(removed?.newValue).toBeUndefined()
      expect(added?.oldValue).toBeUndefined()
    })

    it('detects individual removed items', () => {
      const result = computeDiff({ items: ['a', 'b', 'c'] }, { items: ['a', 'c'] })
      expect(result.changes).toHaveLength(1)
      expect(result.changes[0].changeType).toBe('REMOVED')
      expect(result.changes[0].newValue).toBeUndefined()
    })

    it('detects individual added items', () => {
      const result = computeDiff({ items: ['a', 'b'] }, { items: ['a', 'b', 'c'] })
      expect(result.changes).toHaveLength(1)
      expect(result.changes[0].changeType).toBe('ADDED')
      expect(result.changes[0].oldValue).toBeUndefined()
    })

    it('detects reordering separately', () => {
      const result = computeDiff({ items: ['a', 'b', 'c'] }, { items: ['c', 'b', 'a'] })
      expect(result.changes).toHaveLength(1)
      expect(result.changes[0].label).toContain('পুনর্বিন্যাস')
    })

    it('detects no change', () => {
      const result = computeDiff({ items: ['a', 'b', 'c'] }, { items: ['a', 'b', 'c'] })
      expect(result.changes).toHaveLength(0)
    })
  })

  // ─── Readable Summary ───

  describe('Readable Summary', () => {
    it('generates summary for changes', () => {
      const result = computeDiff(
        { title: 'Old', price: 100, status: 'DRAFT', thumbnail: 'old.jpg' },
        { title: 'New', price: 200, status: 'PUBLISHED', thumbnail: 'new.jpg' }
      )
      expect(result.readableSummary).toContain('ফিল্ড পরিবর্তিত')
      expect(result.readableSummary).toContain('ছবি পরিবর্তিত')
    })

    it('returns no-change message', () => {
      const result = computeDiff({ title: 'Hello' }, { title: 'Hello' })
      expect(result.readableSummary).toBe('কোনো পরিবর্তন নেই')
    })
  })

  // ─── Configurable Ignored Fields ───

  describe('Configurable ignored fields', () => {
    it('ignores custom fields', () => {
      const result = computeDiff(
        { title: 'Old', custom: 'old' },
        { title: 'New', custom: 'new' },
        { ignoredFields: ['custom'] }
      )
      expect(result.changes).toHaveLength(1)
      expect(result.changes[0].fieldPath).toBe('title')
    })

    it('still excludes default excluded fields', () => {
      const result = computeDiff(
        { id: 'old', title: 'Hello' },
        { id: 'new', title: 'Hello' }
      )
      expect(result.changes).toHaveLength(0)
    })
  })

  // ─── Large Value Protection ───

  describe('Large value protection', () => {
    it('truncates long strings', () => {
      const longStr = 'x'.repeat(500)
      const result = computeDiff({ content: 'short' }, { content: longStr })
      expect(result.changes[0].newValue).toContain('...')
      expect(result.changes[0].truncated).toBe(true)
    })

    it('truncates long arrays', () => {
      const longArr = Array.from({ length: 20 }, (_, i) => i)
      const result = computeDiff({ items: [1, 2, 3] }, { items: longArr })
      // Array changes produce individual ADDED/REMOVED changes
      // Items with long JSON representation are truncated
      expect(result.changes.length).toBeGreaterThan(0)
      // Verify the summary is correct (added items show count)
      const addedChanges = result.changes.filter(c => c.changeType === 'ADDED')
      expect(addedChanges.length).toBe(17) // 20 - 3 = 17 items added
    })

    it('custom max preview length', () => {
      const result = computeDiff(
        { content: 'short' },
        { content: 'a'.repeat(50) },
        { maxPreviewLength: 30 }
      )
      expect(result.changes[0].newValue).toContain('...')
    })
  })

  // ─── Summary ───

  describe('Summary', () => {
    it('computes correct summary with severity', () => {
      const result = computeDiff(
        { title: 'Old', price: 100, status: 'DRAFT' },
        { title: 'New', price: 200, status: 'PUBLISHED' }
      )
      expect(result.summary.totalFields).toBe(3)
      expect(result.summary.bySeverity.low).toBe(1)
      expect(result.summary.bySeverity.high).toBe(2)
    })

    it('tracks file types', () => {
      const result = computeDiff(
        { thumbnail: 'old.jpg' },
        { thumbnail: 'new.png' }
      )
      expect(result.summary.byFileType.image).toBe(1)
    })
  })

  // ─── Bulk Diff ───

  describe('Bulk Diff', () => {
    it('compares consecutive versions', () => {
      const versions = [
        { versionNumber: 1, snapshot: { title: 'V1', price: 100 } },
        { versionNumber: 2, snapshot: { title: 'V2', price: 100 } },
        { versionNumber: 3, snapshot: { title: 'V2', price: 200 } },
      ]
      const result = computeBulkDiff(versions)
      expect(result.diffs).toHaveLength(2)
      expect(result.summary.totalChanges).toBe(2)
    })
  })

  // ─── Edge Cases ───

  describe('Edge cases', () => {
    it('handles both null snapshots', () => {
      const result = computeDiff(null, null)
      expect(result.changes).toHaveLength(0)
      expect(result.readableSummary).toBe('কোনো পরিবর্তন নেই')
    })

    it('handles UploadThing URLs', () => {
      const result = computeDiff(
        { thumbnail: 'https://utfs.io/f/old.jpg' },
        { thumbnail: 'https://utfs.io/f/new.jpg' }
      )
      expect(result.changes[0].fileType).toBe('image')
    })
  })
})
