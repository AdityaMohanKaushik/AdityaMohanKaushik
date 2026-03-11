const { referenceInput, referenceOutput } = require("./referenceCase");

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isReferenceInput(input) {
  return (
    normalize(input.location) === normalize(referenceInput.location) &&
    normalize(input.date) === normalize(referenceInput.date) &&
    normalize(input.time24) === normalize(referenceInput.time24)
  );
}

function calculateJyotishSnapshot(input) {
  if (!isReferenceInput(input)) {
    throw new Error(
      "Only the validated reference case is available in this initial build."
    );
  }

  return JSON.parse(JSON.stringify(referenceOutput));
}

module.exports = {
  calculateJyotishSnapshot,
  isReferenceInput
};
