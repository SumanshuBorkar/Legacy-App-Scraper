# Legacy-App-Scraper

This project logs into [challenge.sunvoy.com](https://challenge.sunvoy.com), reuses or creates a session, and scrapes:

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
