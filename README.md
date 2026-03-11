# Hi there 👋 I'm Aditya

🔭 Astrophysicist | 🚀 Entrepreneur | 💻 Developer

---

## About Me

I'm Aditya, a passionate individual with a diverse background in astrophysics, entrepreneurship, and software development. I'm driven by a desire to explore the universe, build innovative solutions, and create meaningful impact.

* **Astrophysics:** My fascination with the cosmos fuels my exploration of celestial phenomena and fundamental physics.
* **Entrepreneurship:** I'm always seeking opportunities to turn ideas into reality, whether it's through building startups or developing impactful projects.
* **Development:** I enjoy crafting clean, efficient code and building applications that solve real-world problems.

## What I'm Currently Working On

* **Vedic Jyotish Platform (in progress):** Building a Vedic-only astrology product with chart-generation and feature parity goals benchmarked against Deva.guru outputs.
  * **Rule 1:** Vedic astrology only (no Western model blending).
  * **Rule 2:** No scraping or copying source code/content from other websites.
  * **Rule 3:** Build from first principles and validate computational outputs against trusted references.
  * **Scope target:** Cover beginner-to-premium feature tiers over iterative releases (core charts first, then advanced modules).


## Technologies and Tools

Here are some of the technologies and tools I'm proficient in:

* **Programming Languages:** Python, JavaScript, C#, CPP.
* **Frameworks/Libraries:** React, Flask, NumPy, Pandas.
* **Databases:** PostgreSQL, MySQL
* **Tools:** Git, Docker, Linux.
* **Astrophysics specific tools:** None so far :D

## Jyotish Calculator Web App

This repository includes a functional Node.js website that computes Vedic chart outputs from user-provided birth details.

### Features

- Input-driven calculation for any birth data (location label, date, time, latitude, longitude, timezone)
- Graha information table with sidereal longitudes, nakshatra, and chara karaka labels
- Viṁśottarī Daśā sequence generation from Moon nakshatra
- Divisional chart summaries for D1, D9, and D60
- API-first architecture with browser UI powered by `/api/calculate`

### Run

```bash
npm install
npm test
npm start
```

Open `http://127.0.0.1:3000` to use the calculator UI.

### API

- `POST /api/calculate`
  - JSON body:
    ```json
    {
      "location": "Dehradun, Uttarakhand",
      "date": "2026-03-11",
      "time24": "09:06:00",
      "latitude": 30.3165,
      "longitude": 78.0322,
      "timezone": "+05:30"
    }
    ```
- Compatibility endpoints from initial build:
  - `GET /api/reference-input`
  - `GET /api/reference-output`
  - `GET /api/compare`

## GitHub Stats
