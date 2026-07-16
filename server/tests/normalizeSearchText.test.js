import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getNormalizedSearchCandidates,
  normalizeSearchText,
} from '../utils/normalizeSearchText.js'

test('normalization makes Indonesian search punctuation and case insensitive', () => {
  assert.equal(normalizeSearchText('  D.I. Yogyakarta! '), 'd i yogyakarta')
})

test('common Jogja aliases normalize to the canonical city', () => {
  const candidates = getNormalizedSearchCandidates('Jogja')
  assert.deepEqual(candidates, ['yogyakarta'])
})
