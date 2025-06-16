# Legacy-App-Scraper

This project logs into [challenge.sunvoy.com](https://challenge.sunvoy.com), reuses or creates a session, and scrapes:

video Explaination:- part1:- https://www.loom.com/share/c241675a5da54811908b1544bc19ad73?t=265&sid=ca97a5e5-b461-4fbf-a473-ca25ee367643
                     part2:- https://www.loom.com/share/1a1081d82efa42b0b3eaf1033fdc4366?sid=330a17ad-3dbc-4c1d-8e0b-bc15d9b2a9d5


- ✅ A list of users from the `/list` page
- ✅ The currently authenticated user’s info from the `/settings` page

All results are saved in `./users.json`.

---

## 🚀 Features

- 🔐 Session reuse with cookie storage
- 🧠 Nonce handling for secure login
- 🧭 Puppeteer-based headless scraping
- 🗃️ JSON output with full user info
- 🧪 Visual debugging via screenshots
- 🔄 Session auto-renew on expiration

---

## 📦 Installation

```bash
git clone https://github.com/yourusername/sunvoy-scraper.git
cd file name
npm install
npm run start
