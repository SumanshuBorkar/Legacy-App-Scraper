import puppeteer from "puppeteer";
import axios, {AxiosInstance} from "axios";
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

let client: AxiosInstance;
let cookieHeader:string = ""

//1. First we will make a an API call to get the none

const getNonce = async(): Promise<string> => {
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

getNonce();