const { referenceInput, referenceOutput } = require("./referenceCase");
const { calculateJyotishSnapshot } = require("./jyotishEngine");

function runExactComparison() {
  const actual = calculateJyotishSnapshot(referenceInput);
  const expected = referenceOutput;

  const expectedText = JSON.stringify(expected);
  const actualText = JSON.stringify(actual);

  return {
    matchesExactly: expectedText === actualText,
    expected,
    actual
  };
}

module.exports = { runExactComparison };
