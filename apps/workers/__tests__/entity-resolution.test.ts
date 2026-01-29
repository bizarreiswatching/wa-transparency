import { describe, it, expect } from 'vitest';
import { needsClaudeDisambiguation } from '../src/entity-resolution/claude-disambiguate';

describe('Entity Resolution', () => {
  describe('needsClaudeDisambiguation', () => {
    it('returns false for very high confidence scores', () => {
      expect(needsClaudeDisambiguation(0.98, false)).toBe(false);
      expect(needsClaudeDisambiguation(0.95, true)).toBe(false);
    });

    it('returns false for very low confidence scores', () => {
      expect(needsClaudeDisambiguation(0.3, false)).toBe(false);
      expect(needsClaudeDisambiguation(0.49, true)).toBe(false);
    });

    it('returns true for medium-high confidence scores', () => {
      expect(needsClaudeDisambiguation(0.8, false)).toBe(true);
      expect(needsClaudeDisambiguation(0.75, false)).toBe(true);
    });

    it('returns true for medium confidence with address match', () => {
      expect(needsClaudeDisambiguation(0.6, true)).toBe(true);
      expect(needsClaudeDisambiguation(0.55, true)).toBe(true);
    });

    it('returns false for medium confidence without address match', () => {
      expect(needsClaudeDisambiguation(0.6, false)).toBe(false);
    });
  });
});
