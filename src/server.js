const http = require("http");
const fs = require("fs");
const path = require("path");
const { referenceInput, referenceOutput } = require("./referenceCase");
const { runExactComparison } = require("./compare");

const publicDir = path.join(__dirname, "..", "public");

function sendJson(res, body) {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
}

const server = http.createServer((req, res) => {
  if (req.url === "/api/reference-input") {
    return sendJson(res, referenceInput);
  }

  if (req.url === "/api/reference-output") {
    return sendJson(res, referenceOutput);
  }

  if (req.url === "/api/compare") {
    return sendJson(res, runExactComparison());
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

module.exports = { server };
