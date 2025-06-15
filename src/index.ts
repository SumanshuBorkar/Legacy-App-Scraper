import puppeteer from 'puppeteer';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface User {
    name: string;
    email: string;
    id: string;
}

const BASE_URL = 'https://challenge.sunvoy.com';
const SESSION_FILE = path.join(__dirname, '.session.json');

let client: AxiosInstance;

const checkSessionValid = async (cookieHeader: string): Promise<boolean> => {
    try {
        const res = await axios.get(`${BASE_URL}/settings`, {
            headers: { Cookie: cookieHeader },
        });
        return res.status === 200;
    } catch {
        return false;
    }
};

const saveSession = async (cookieHeader: string): Promise<void> => {
    fs.writeFileSync(SESSION_FILE, JSON.stringify({ cookieHeader }, null, 2));
};

const loadSession = async (): Promise<string | null> => {
    try {
        const data = fs.readFileSync(SESSION_FILE, 'utf-8');
        return JSON.parse(data).cookieHeader;
    } catch {
        return null;
    }
};

const getNonce = async (): Promise<string> => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    const nonce = await page.$eval('input[name="nonce"]', (el: any) => el.value);
    if (!nonce) throw new Error('Nonce not found');

    await browser.close();
    return nonce;
};

const login = async (username: string, password: string): Promise<void> => {
    const savedCookie = await loadSession();

    if (savedCookie && await checkSessionValid(savedCookie)) {
        client = axios.create({ headers: { Cookie: savedCookie } });
        return;
    }

    const nonce = await getNonce();

    const formData = new URLSearchParams({ username, password, nonce });

    try {
        const res = await axios.post(`${BASE_URL}/login`, formData.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            maxRedirects: 0,
            validateStatus: (status) => status === 302,
        });

        const cookies = res.headers['set-cookie'];
        if (!cookies || cookies.length === 0) throw new Error('Login failed: no cookies received');

        const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
        await saveSession(cookieHeader);

        client = axios.create({ headers: { Cookie: cookieHeader } });
    } catch (err: any) {
        if (err.response) {
            console.error('Login failed with status:', err.response.status);
            console.error('Response data:', err.response.data);
        } else {
            console.error('[-] Login script error:', err.message);
        }
        process.exit(1);
    }
};

const getUserList = async (): Promise<User[]> => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const cookie = await loadSession();
    if (cookie) {
        await page.setExtraHTTPHeaders({ Cookie: cookie });
    }

    try {
        await page.goto(`${BASE_URL}/list`, { waitUntil: 'networkidle2', timeout: 30000 });

        const users: User[] = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('div.bg-white.p-4.rounded-lg.shadow'));
            return cards.map(card => {
                const name = card.querySelector('h3.font-semibold')?.textContent?.trim() || '';
                const email = card.querySelector('p.text-gray-600')?.textContent?.trim() || '';
                const idText = card.querySelector('p.text-sm.text-gray-500')?.textContent?.trim() || '';
                const id = idText.replace('ID:', '').trim();
                return { name, email, id };
            });
        });

        return users;
    } catch (err) {
        console.error('[-] Puppeteer scrape error:', (err as Error).message);
        return [];
    } finally {
        await browser.close();
    }
};


const fetchCurrentUser = async (): Promise<User | null> => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        const savedCookie = await loadSession();
        if (savedCookie && await checkSessionValid(savedCookie)) {
            await page.setExtraHTTPHeaders({ Cookie: savedCookie });
        }


        await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2' });

        const userInfo: User = await page.evaluate(() => {
            const form = document.querySelector('form.space-y-4');
            if (!form) throw new Error('User info form not found');

            const inputs = form.querySelectorAll('input');
            console.log(inputs, "these are the inputs")

            const userId = (inputs[0] as HTMLInputElement)?.value || '';
            const firstName = (inputs[1] as HTMLInputElement)?.value || '';
            const lastName = (inputs[2] as HTMLInputElement)?.value || '';
            const email = (inputs[3] as HTMLInputElement)?.value || '';

            const name = `${firstName} ${lastName}`;
            const id = userId;

            return { name, email, id };
        });


        return userInfo;
    } catch (err) {
        console.log(err, "Failed to fetch user data")
        return null;
    } finally {
        await browser.close();
    }
};

(async () => {
    const username = process.env.EMAIL;
    const password = process.env.PASSWORD;

    if (!username || !password) {
        throw new Error('EMAIL and PASSWORD environment variables are required.');
    }

    await login(username, password);

    const users = await getUserList();

    const currentUser = await fetchCurrentUser();

    const outputPath = path.resolve(__dirname, '../users.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const dataToSave = { users, currentUser };
    fs.writeFileSync(outputPath, JSON.stringify(dataToSave, null, 2));

})();
