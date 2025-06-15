import puppeteer from "puppeteer";
import axios, { AxiosInstance } from "axios";
import * as fs from "fs";
import * as path from "path";
import dotenv from 'dotenv';

dotenv.config();

interface User {
    name: string;
    email: string;
    id: string;
}

const BASE_URL = "https://challenge.sunvoy.com";
const SESSION_FILE = path.join(__dirname, '../sessions/session.json');

let client: ReturnType<typeof axios.create>;

const checkSessionValid = async (cookieHeader: string): Promise<boolean> => {
    try {
        const res = await axios.get(`${BASE_URL}/settings`, {
            headers: { Cookie: cookieHeader },
        });

        return res.status === 200 && res.data.includes('Logout');
    } catch {
        return false;
    }
};

const saveSession = async (cookieHeader: string): Promise<void> => {
    await fs.writeFileSync(SESSION_FILE, JSON.stringify({ cookieHeader }, null, 2));
};

const loadSession = async (): Promise<string | null> => {
    try {
        const data = await fs.readFileSync(SESSION_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        return parsed.cookieHeader;
    } catch {
        return null;
    }
};


const getNonce = async (): Promise<string> => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    // Extract the nonce using the DOM
    const nonce = await page.$eval('input[name="nonce"]', (el: HTMLInputElement) => el.value);

    if (!nonce) throw new Error('Nonce not found');

    console.log(nonce, "this is nonce");

    await browser.close();
    return nonce;
}



export const login = async (username: string, password: string): Promise<void> => {

    const savedCookie = await loadSession();
    if (savedCookie && await checkSessionValid(savedCookie)) {
        console.log('[+] Reusing existing session');
        client = axios.create({ headers: { Cookie: savedCookie } });
        return;
    }

    console.log('[*] Logging in...');

    const nonce = await getNonce();

    const formData = new URLSearchParams(
        {
            username,
            password,
            nonce
        });

    try {
        const loginRes = await axios.post(`${BASE_URL}/login`, formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            maxRedirects: 0,
            validateStatus: (status) => status === 302,
        });

        const cookies = loginRes.headers['set-cookie'];
        if (!cookies || cookies.length === 0) {
            throw new Error('Login failed: No cookies received');
        }

        const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
        await saveSession(cookieHeader);

        client = axios.create({ headers: { Cookie: cookieHeader } });

        console.log('[+] Login successful and session saved');
    } catch (err: any) {
        if (err.response) {
            console.error('[-] Login failed with status:', err.response.status);
            console.error('[-] Response data:', err.response.data);
        } else {
            console.error('[-] Login script error:', err.message);
        }
        process.exit(1);
    }
};


const username = process.env.EMAIL;     // demo@example.org
const password = process.env.PASSWORD;  // test

if (!username || !password) {
    throw new Error('EMAIL and PASSWORD environment variables are required.');
}

login(username, password);