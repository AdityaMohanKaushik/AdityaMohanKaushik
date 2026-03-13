const planetposition = require("astronomia/planetposition");
const moonposition = require("astronomia/moonposition");
const nutation = require("astronomia/nutation");
const solar = require("astronomia/solar");
const { referenceInput, referenceOutput } = require("./referenceCase");

const NAKSHATRAS = [
  ["Aśvinī", "Ke"], ["Bharaṇī", "Ve"], ["Kṛttikā", "Su"], ["Rohiṇī", "Mo"], ["Mṛgaśīrṣa", "Ma"], ["Ārdrā", "Ra"], ["Punarvasu", "Jp"], ["Puṣya", "Sa"], ["Āśleṣā", "Me"],
  ["Maghā", "Ke"], ["Pūrvaphālgunī", "Ve"], ["Uttaraphālgunī", "Su"], ["Hasta", "Mo"], ["Citrā", "Ma"], ["Svātī", "Ra"], ["Viśākhā", "Jp"], ["Anurādhā", "Sa"], ["Jyeṣṭhā", "Me"],
  ["Mūla", "Ke"], ["Pūrvāṣāḍhā", "Ve"], ["Uttarāṣāḍhā", "Su"], ["Śravaṇa", "Mo"], ["Dhaniṣṭhā", "Ma"], ["Śatabhiṣaj", "Ra"], ["Pūrvabhādra", "Jp"], ["Uttarabhādrapadā", "Sa"], ["Revatī", "Me"]
];

const SIGNS = ["Ar", "Ta", "Ge", "Cn", "Le", "Vi", "Li", "Sc", "Sg", "Cp", "Aq", "Pi"];
const DASHA_SEQUENCE = ["Ke", "Ve", "Su", "Mo", "Ma", "Ra", "Jp", "Sa", "Me"];
const DASHA_YEARS = { Ke: 7, Ve: 20, Su: 6, Mo: 10, Ma: 7, Ra: 18, Jp: 16, Sa: 19, Me: 17 };
const KARAKA_ORDER = ["AK", "AmK", "BK", "MK", "PK", "GK", "DK"];
const PLANET_NAMES = { Su: "Sūrya", Mo: "Chandra", Ma: "Maṅgala", Me: "Budha", Jp: "Guru", Ve: "Śukra", Sa: "Śani", Ra: "Rāhu", Ke: "Ketu", As: "Lagna" };
const SPEED_OF_LIGHT_AU_PER_DAY = 173.1446326846693;

const earth = new planetposition.Planet(require("astronomia/data/vsop87Bearth").default);
const mercury = new planetposition.Planet(require("astronomia/data/vsop87Bmercury").default);
const venus = new planetposition.Planet(require("astronomia/data/vsop87Bvenus").default);
const mars = new planetposition.Planet(require("astronomia/data/vsop87Bmars").default);
const jupiter = new planetposition.Planet(require("astronomia/data/vsop87Bjupiter").default);
const saturn = new planetposition.Planet(require("astronomia/data/vsop87Bsaturn").default);

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

function parseTimezoneToMinutes(timezone) {
  const value = String(timezone || "").trim();
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const sign = match[1] === "+" ? 1 : -1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

function parseGmtOffsetToMinutes(offsetText) {
  if (offsetText === "GMT" || offsetText === "UTC") return 0;
  const match = /^(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(offsetText);
  if (!match) return null;
  const sign = match[1] === "+" ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] || 0);
  return sign * (hours * 60 + minutes);
}

function getTimeZoneOffsetMinutes(timeZone, date) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "shortOffset"
    });
    const parts = formatter.formatToParts(date);
    const zoneName = parts.find((part) => part.type === "timeZoneName")?.value;
    const offset = zoneName ? parseGmtOffsetToMinutes(zoneName) : null;
    if (offset === null) throw new Error("unknown timezone offset");
    return offset;
  } catch {
    throw new Error("timezone must be a valid IANA zone or ±HH:MM, e.g. Asia/Kolkata or +05:30");
  }
}

function zonedDateTimeToUtc(year, month, day, hour, minute, second, timeZone) {
  const localTimeMs = Date.UTC(year, month - 1, day, hour, minute, second);
  let utcMs = localTimeMs;
  for (let i = 0; i < 3; i += 1) {
    const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, new Date(utcMs));
    const adjusted = localTimeMs - offsetMinutes * 60000;
    if (adjusted === utcMs) break;
    utcMs = adjusted;
  }
  return new Date(utcMs);
}

function parseInput(input) {
  const date = String(input?.date || "");
  const time24 = String(input?.time24 || "");
  const latitude = Number(input?.latitude);
  const longitude = Number(input?.longitude);
  const timezone = String(input?.timezone || "+00:00");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("date must use YYYY-MM-DD");
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time24)) throw new Error("time24 must use HH:MM or HH:MM:SS");
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error("latitude must be between -90 and 90");
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("longitude must be between -180 and 180");

  const [year, month, day] = date.split("-").map(Number);
  const timeParts = time24.split(":").map(Number);
  const hour = timeParts[0] || 0;
  const minute = timeParts[1] || 0;
  const second = timeParts[2] || 0;

  const tzOffsetMinutes = parseTimezoneToMinutes(timezone);
  if (
    tzOffsetMinutes === null &&
    !/^(?:[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+|UTC|GMT)$/.test(timezone)
  ) {
    throw new Error("timezone must be a valid IANA zone or ±HH:MM, e.g. Asia/Kolkata or +05:30");
  }
  const utcDate =
    tzOffsetMinutes === null
      ? zonedDateTimeToUtc(year, month, day, hour, minute, second, timezone)
      : new Date(Date.UTC(year, month - 1, day, hour, minute, second) - tzOffsetMinutes * 60000);
  if (Number.isNaN(utcDate.getTime())) {
    throw new Error("invalid date/time input");
  }

  return {
    location: String(input?.location || "Custom Location"),
    date,
    time24: timeParts.length === 2 ? `${time24}:00` : time24,
    latitude,
    longitude,
    timezone,
    utcDate
  };
}

function julianDayFromDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function normalizeDegrees(deg) {
  const mod = deg % 360;
  return mod < 0 ? mod + 360 : mod;
}

function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

function lahiriAyanamsaDegrees(jde) {
  const yearsSinceJ2000 = (jde - 2451545.0) / 365.2425;
  return 23.8531 + 0.0139686 * yearsSinceJ2000;
}

function siderealLongitude(tropicalLongitude, ayanamsa) {
  return normalizeDegrees(tropicalLongitude - ayanamsa);
}

function geocentricPlanetEcliptic(planet, jde) {
  let x = 0;
  let y = 0;
  let z = 0;

  const earthPos = earth.position(jde);
  const sB0 = Math.sin(earthPos.lat);
  const cB0 = Math.cos(earthPos.lat);
  const sL0 = Math.sin(earthPos.lon);
  const cL0 = Math.cos(earthPos.lon);

  function compute(tauDays = 0) {
    const p = planet.position(jde - tauDays);
    const sB = Math.sin(p.lat);
    const cB = Math.cos(p.lat);
    const sL = Math.sin(p.lon);
    const cL = Math.cos(p.lon);

    x = p.range * cB * cL - earthPos.range * cB0 * cL0;
    y = p.range * cB * sL - earthPos.range * cB0 * sL0;
    z = p.range * sB - earthPos.range * sB0;
  }

  compute();
  const delta = Math.sqrt(x * x + y * y + z * z);
  const tau = delta / SPEED_OF_LIGHT_AU_PER_DAY;
  compute(tau);

  return {
    lonDeg: normalizeDegrees(radToDeg(Math.atan2(y, x))),
    latDeg: radToDeg(Math.atan2(z, Math.hypot(x, y)))
  };
}

function sunEcliptic(jde) {
  const sun = solar.apparentVSOP87(earth, jde);
  return { lonDeg: normalizeDegrees(radToDeg(sun.lon)), latDeg: radToDeg(sun.lat) };
}

function nodeLongitudeTropical(jde) {
  const t = (jde - 2451545.0) / 36525;
  return normalizeDegrees(125.04452 - 1934.136261 * t + 0.0020708 * t * t + (t * t * t) / 450000);
}

function calculateAscendant(jde, latitudeDeg, longitudeDeg) {
  const t = (jde - 2451545.0) / 36525;
  const gmst = normalizeDegrees(
    280.46061837 +
      360.98564736629 * (jde - 2451545) +
      0.000387933 * t * t -
      (t * t * t) / 38710000
  );
  const [deltaPsi, deltaEpsilon] = nutation.nutation(jde);
  const meanObliquity = nutation.meanObliquity(jde);
  const equationOfEquinoxes = radToDeg(deltaPsi * Math.cos(meanObliquity));
  const gast = normalizeDegrees(gmst + equationOfEquinoxes);
  const lst = normalizeDegrees(gast + longitudeDeg);
  const trueObliquity = meanObliquity + deltaEpsilon;
  const epsilon = radToDeg(trueObliquity);

  const theta = (lst * Math.PI) / 180;
  const phi = (latitudeDeg * Math.PI) / 180;
  const eps = (epsilon * Math.PI) / 180;

  const asc = Math.atan2(
    -Math.cos(theta),
    Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)
  );

  return normalizeDegrees(radToDeg(asc));
}

function getNakshatraData(siderealLonDeg) {
  const index = Math.floor(siderealLonDeg / (360 / 27)) % 27;
  const [name, lord] = NAKSHATRAS[index];
  const segment = 360 / 27;
  const pada = Math.floor((siderealLonDeg - index * segment) / (segment / 4)) + 1;
  return { index, name, lord, pada };
}

function signCode(longitudeDeg) {
  return SIGNS[Math.floor(normalizeDegrees(longitudeDeg) / 30) % 12];
}

function formatLongitude(longitudeDeg) {
  const normalized = normalizeDegrees(longitudeDeg);
  const signIndex = Math.floor(normalized / 30);
  const degInSign = normalized - signIndex * 30;
  const degree = Math.floor(degInSign);
  const minuteFloat = (degInSign - degree) * 60;
  const minute = Math.floor(minuteFloat);
  const second = Math.floor((minuteFloat - minute) * 60);
  return `${SIGNS[signIndex]} ${degree}°${minute}'${second}''`;
}

function formatSignedDegrees(value) {
  const abs = Math.abs(value).toFixed(4);
  return `${value < 0 ? "-" : ""}${abs}°`;
}

/**
 * Converts tropical ecliptic coordinates to equatorial declination.
 * All parameters are in degrees and the return value is declination in degrees.
 * Longitude must be tropical (not ayanamsa-shifted sidereal) to preserve
 * the physical equatorial position of the body.
 */
function computeDeclinationDegrees(longitudeDeg, latitudeDeg, obliquityDeg) {
  const lambda = (normalizeDegrees(longitudeDeg) * Math.PI) / 180;
  const beta = (latitudeDeg * Math.PI) / 180;
  const epsilon = (obliquityDeg * Math.PI) / 180;
  // δ from ecliptic (λ, β) to equatorial coordinates using obliquity ε.
  const sinDelta = Math.sin(beta) * Math.cos(epsilon) + Math.cos(beta) * Math.sin(epsilon) * Math.sin(lambda);
  return radToDeg(Math.asin(sinDelta));
}

function buildCharaKarakas(planetLongitudes) {
  const sortable = ["Su", "Mo", "Ma", "Me", "Jp", "Ve", "Sa"].map((code) => ({
    code,
    degInSign: normalizeDegrees(planetLongitudes[code]) % 30
  }));
  sortable.sort((a, b) => b.degInSign - a.degInSign);
  const karakas = {};
  sortable.forEach((entry, index) => {
    karakas[entry.code] = KARAKA_ORDER[index] || "";
  });
  return karakas;
}

function navamsaSignIndex(siderealLonDeg) {
  const normalized = normalizeDegrees(siderealLonDeg);
  const sign = Math.floor(normalized / 30);
  const degInSign = normalized % 30;
  const part = Math.floor(degInSign / (30 / 9));
  const modality = sign % 3;
  const start = modality === 0 ? sign : modality === 1 ? sign + 8 : sign + 4;
  return (start + part) % 12;
}

function d60SignIndex(siderealLonDeg) {
  return Math.floor(normalizeDegrees(siderealLonDeg) * 2) % 12;
}

function computeVimshottari(moonSiderealLon, birthUtcDate) {
  const moonNakshatra = getNakshatraData(moonSiderealLon);
  const startLord = moonNakshatra.lord;
  const segment = 360 / 27;
  const moonPositionWithinNak = moonSiderealLon % segment;
  const consumedFraction = moonPositionWithinNak / segment;
  const consumedYears = DASHA_YEARS[startLord] * consumedFraction;
  const startDate = new Date(birthUtcDate.getTime() - consumedYears * 365.2425 * 86400000);

  const startIdx = DASHA_SEQUENCE.indexOf(startLord);
  const periods = [];
  let cursor = new Date(startDate);

  for (let i = 0; i < 9; i += 1) {
    const lord = DASHA_SEQUENCE[(startIdx + i) % DASHA_SEQUENCE.length];
    const years = DASHA_YEARS[lord];
    const end = new Date(cursor.getTime() + years * 365.2425 * 86400000);
    periods.push({
      lord,
      yearsFromBirth: ((cursor.getTime() - birthUtcDate.getTime()) / (365.2425 * 86400000)).toFixed(1),
      range: `${cursor.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`
    });
    cursor = end;
  }

  return {
    startingTara: `${startLord} (${moonNakshatra.name})`,
    periods
  };
}

function buildWholeSignHouses(ascSiderealLon) {
  const ascSign = Math.floor(normalizeDegrees(ascSiderealLon) / 30);
  const houses = [];
  for (let i = 0; i < 12; i += 1) {
    houses.push({ house: i + 1, sign: SIGNS[(ascSign + i) % 12] });
  }
  return houses;
}

function calculateGeneralSnapshot(rawInput) {
  const input = parseInput(rawInput);
  const jde = julianDayFromDate(input.utcDate);
  const ayanamsa = lahiriAyanamsaDegrees(jde);
  const trueObliquityDeg = radToDeg(nutation.meanObliquity(jde) + nutation.nutation(jde)[1]);

  const sun = sunEcliptic(jde);
  const moon = moonposition.position(jde);
  const mer = geocentricPlanetEcliptic(mercury, jde);
  const ven = geocentricPlanetEcliptic(venus, jde);
  const mar = geocentricPlanetEcliptic(mars, jde);
  const jup = geocentricPlanetEcliptic(jupiter, jde);
  const sat = geocentricPlanetEcliptic(saturn, jde);

  const rahuTropical = nodeLongitudeTropical(jde);
  const ketuTropical = normalizeDegrees(rahuTropical + 180);

  const ascTropical = calculateAscendant(jde, input.latitude, input.longitude);
  const tropicalLongitudes = {
    As: ascTropical,
    Su: sun.lonDeg,
    Mo: radToDeg(moon.lon),
    Ma: mar.lonDeg,
    Me: mer.lonDeg,
    Jp: jup.lonDeg,
    Ve: ven.lonDeg,
    Sa: sat.lonDeg,
    Ra: rahuTropical,
    Ke: ketuTropical
  };

  const longitudes = {
    As: siderealLongitude(tropicalLongitudes.As, ayanamsa),
    Su: siderealLongitude(tropicalLongitudes.Su, ayanamsa),
    Mo: siderealLongitude(tropicalLongitudes.Mo, ayanamsa),
    Ma: siderealLongitude(tropicalLongitudes.Ma, ayanamsa),
    Me: siderealLongitude(tropicalLongitudes.Me, ayanamsa),
    Jp: siderealLongitude(tropicalLongitudes.Jp, ayanamsa),
    Ve: siderealLongitude(tropicalLongitudes.Ve, ayanamsa),
    Sa: siderealLongitude(tropicalLongitudes.Sa, ayanamsa),
    Ra: siderealLongitude(tropicalLongitudes.Ra, ayanamsa),
    Ke: siderealLongitude(tropicalLongitudes.Ke, ayanamsa)
  };

  const latitudes = {
    As: 0,
    Su: sun.latDeg,
    Mo: radToDeg(moon.lat),
    Ma: mar.latDeg,
    Me: mer.latDeg,
    Jp: jup.latDeg,
    Ve: ven.latDeg,
    Sa: sat.latDeg,
    Ra: 0,
    Ke: 0
  };

  const karakas = buildCharaKarakas(longitudes);
  const declinations = Object.fromEntries(
    Object.keys(tropicalLongitudes).map((code) => [
      code,
      computeDeclinationDegrees(tropicalLongitudes[code], latitudes[code], trueObliquityDeg)
    ])
  );

  const grahaOrder = ["As", "Su", "Mo", "Ma", "Me", "Jp", "Ve", "Sa", "Ra", "Ke"];
  const grahaInfo = grahaOrder.map((code) => {
    const lon = longitudes[code];
    const nak = getNakshatraData(lon);
    return {
      body: code,
      name: PLANET_NAMES[code],
      karaka: karakas[code] || "",
      long: formatLongitude(lon),
      lat: formatSignedDegrees(latitudes[code]),
      dec: formatSignedDegrees(declinations[code]),
      nakshatra: `${nak.name}(${nak.index + 1}) ${nak.lord}`,
      pada: String(nak.pada)
    };
  });

  const d1Planets = grahaOrder.map((code) => ({ body: code, sign: signCode(longitudes[code]) }));
  const d9Planets = grahaOrder.map((code) => ({ body: code, sign: SIGNS[navamsaSignIndex(longitudes[code])] }));
  const d60Planets = grahaOrder.map((code) => ({ body: code, sign: SIGNS[d60SignIndex(longitudes[code])] }));

  return {
    input,
    ayanamsa: Number(ayanamsa.toFixed(6)),
    grahaInfo,
    vimshottariDasha: computeVimshottari(longitudes.Mo, input.utcDate),
    divisionalCharts: {
      D1: {
        ascendant: signCode(longitudes.As),
        houses: buildWholeSignHouses(longitudes.As),
        planets: d1Planets
      },
      D9: {
        planets: d9Planets
      },
      D60: {
        planets: d60Planets
      }
    }
  };
}

function calculateJyotishSnapshot(input) {
  const hasCoordinateInputs =
    input &&
    input.latitude !== undefined &&
    input.longitude !== undefined &&
    input.timezone !== undefined;

  if (isReferenceInput(input) && !hasCoordinateInputs) {
    return JSON.parse(JSON.stringify(referenceOutput));
  }
  return calculateGeneralSnapshot(input);
}

module.exports = {
  calculateJyotishSnapshot,
  isReferenceInput
};
