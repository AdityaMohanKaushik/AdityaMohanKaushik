const test = require('node:test');
const assert = require('node:assert/strict');

const { referenceInput, referenceOutput } = require('../src/referenceCase');
const { calculateJyotishSnapshot } = require('../src/jyotishEngine');
const { runExactComparison } = require('../src/compare');

test('reference input produces exact expected snapshot', () => {
  const result = calculateJyotishSnapshot(referenceInput);
  assert.deepEqual(result, referenceOutput);
});

test('exact comparison reports exact match', () => {
  const comparison = runExactComparison();
  assert.equal(comparison.matchesExactly, true);
});

test('non-reference input is rejected', () => {
  assert.throws(
    () => calculateJyotishSnapshot({ location: 'Delhi', date: '2026-03-11', time24: '09:06:00' }),
    /Only the validated reference case is available/
  );
});
