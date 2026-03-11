const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { referenceInput, referenceOutput } = require('../src/referenceCase');
const { calculateJyotishSnapshot } = require('../src/jyotishEngine');
const { runExactComparison } = require('../src/compare');
const { server, resolveLocationDetails } = require('../src/server');

const genericInput = {
  location: 'Delhi, India',
  date: '1992-10-04',
  time24: '13:45:00',
  latitude: 28.6139,
  longitude: 77.209,
  timezone: '+05:30'
};

const referenceWithCoordinates = {
  location: 'Dehradun, Uttarakhand',
  date: '2026-03-11',
  time24: '09:06:00',
  latitude: 30.3165,
  longitude: 78.0322,
  timezone: 'Asia/Kolkata'
};

test('reference input produces exact expected snapshot', () => {
  const result = calculateJyotishSnapshot(referenceInput);
  assert.deepEqual(result, referenceOutput);
});

test('exact comparison reports exact match', () => {
  const comparison = runExactComparison();
  assert.equal(comparison.matchesExactly, true);
});

test('non-reference input is calculated with divisional charts and dasha data', () => {
  const result = calculateJyotishSnapshot(genericInput);

  assert.equal(result.input.location, genericInput.location);
  assert.equal(result.grahaInfo.length, 10);
  assert.ok(result.grahaInfo.every((row) => typeof row.long === 'string' && row.long.includes(' ')));
  assert.equal(result.vimshottariDasha.periods.length, 9);
  assert.equal(result.divisionalCharts.D1.planets.length, 10);
  assert.equal(result.divisionalCharts.D9.planets.length, 10);
  assert.equal(result.divisionalCharts.D60.planets.length, 10);
});

test('invalid timezone is rejected', () => {
  assert.throws(
    () => calculateJyotishSnapshot({ ...genericInput, timezone: 'IST' }),
    /timezone must be a valid IANA zone or ±HH:MM/
  );
});

test('IANA timezone is accepted and moon stays aligned to reference case', () => {
  const result = calculateJyotishSnapshot(referenceWithCoordinates);
  const moon = result.grahaInfo.find((row) => row.body === 'Mo');
  assert.ok(moon);
  assert.equal(moon.long, "Sc 23°36'46''");
  assert.equal(moon.lat, "-5°12'29''");
  assert.equal(moon.dec, "-28°3'49''");
  assert.equal(moon.nakshatra, 'Jyeṣṭhā(18) Me');
  assert.equal(moon.pada, '3');
});

test('resolveLocationDetails returns coordinates and timezone from provider response', async () => {
  const fakeFetch = async () => ({
    ok: true,
    json: async () => ({
      results: [
        {
          name: 'Dehradun',
          admin1: 'Uttarakhand',
          country: 'India',
          latitude: 30.3165,
          longitude: 78.0322,
          timezone: 'Asia/Kolkata'
        }
      ]
    })
  });

  const details = await resolveLocationDetails('Dehradun, Uttarakhand', fakeFetch);
  assert.equal(details.location, 'Dehradun, Uttarakhand, India');
  assert.equal(details.latitude, 30.3165);
  assert.equal(details.longitude, 78.0322);
  assert.equal(details.timezone, 'Asia/Kolkata');
});

test('POST /api/calculate returns computed snapshot', async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    const port = address.port;

    const response = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/api/calculate',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
          });
        }
      );
      req.on('error', reject);
      req.write(JSON.stringify(genericInput));
      req.end();
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.input.location, genericInput.location);
    assert.equal(response.body.divisionalCharts.D1.planets.length, 10);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
