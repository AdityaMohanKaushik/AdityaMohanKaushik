const http = require("http");
const fs = require("fs");
const path = require("path");
const { referenceInput, referenceOutput } = require("./referenceCase");
const { runExactComparison } = require("./compare");
const { calculateJyotishSnapshot } = require("./jyotishEngine");

const publicDir = path.join(__dirname, "..", "public");

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 100) {
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

async function resolveLocationDetails(query, fetchImpl = fetch) {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) throw new Error("location query is required");

  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalizedQuery)}&count=1&language=en&format=json`;
  const geoResponse = await fetchImpl(geoUrl);
  if (!geoResponse.ok) throw new Error("unable to resolve location");
  const geoData = await geoResponse.json();
  const match = geoData?.results?.[0];
  if (!match) throw new Error("location not found");

  return {
    location: [match.name, match.admin1, match.country].filter(Boolean).join(", "),
    latitude: Number(match.latitude),
    longitude: Number(match.longitude),
    timezone: String(match.timezone || "")
  };
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url || "/", "http://127.0.0.1");

  if (req.url === "/api/reference-input" && req.method === "GET") {
    return sendJson(res, 200, referenceInput);
  }

  if (req.url === "/api/reference-output" && req.method === "GET") {
    return sendJson(res, 200, referenceOutput);
  }

  if (req.url === "/api/compare" && req.method === "GET") {
    return sendJson(res, 200, runExactComparison());
  }

  if (req.url === "/api/calculate" && req.method === "POST") {
    try {
      const payload = await readJsonBody(req);
      const snapshot = calculateJyotishSnapshot(payload);
      return sendJson(res, 200, snapshot);
    } catch (error) {
      return sendJson(res, 400, { error: error.message || "Unable to calculate chart" });
    }
  }

  if (parsedUrl.pathname === "/api/location-lookup" && req.method === "GET") {
    try {
      const query = parsedUrl.searchParams.get("query");
      const details = await resolveLocationDetails(query);
      return sendJson(res, 200, details);
    } catch (error) {
      return sendJson(res, 400, { error: error.message || "Unable to lookup location" });
    }
  }

  if (req.url !== "/" || req.method !== "GET") {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const indexFile = path.join(publicDir, "index.html");
  fs.readFile(indexFile, "utf8", (err, html) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Unable to load UI");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  server.listen(port, () => {
    console.log(`Jyotish app listening on http://127.0.0.1:${port}`);
  });
}

module.exports = { server, resolveLocationDetails };
