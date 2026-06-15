import { chromium } from 'playwright';

const TOKEN_A = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMCIsImVtYWlsIjoiaW52aXRldGVzdF8xNzgxNTM3NTgyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzgxNTM3NTgyLCJleHAiOjE3ODE1NDExODJ9.aKuls5_50JofPhNHbS46s7aisuLLT7fJNdeNf0MdSI4";
const GID = "2c2226cb-8385-4851-afc3-cd0197692a3a";
const BASE = "http://localhost:3000";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const apiCalls = [];
page.on('request', r => { if (r.url().includes('/users/search') || r.url().includes('/invite')) apiCalls.push(`${r.method()} ${r.url()}`); });
page.on('response', async r => {
  if (r.url().includes('/users/search') || r.url().includes('/goal-notifications/invite')) {
    apiCalls.push(`  -> ${r.status()} ${r.url().split('/api/')[1]}`);
  }
});
page.on('console', m => { if (m.type()==='error') console.log('PAGE ERR:', m.text().slice(0,160)); });

// Seed auth into localStorage, then load the goal page.
await page.goto(BASE + '/login');
await page.evaluate((t) => {
  localStorage.setItem('token', t);
  localStorage.setItem('userId', '20');
  localStorage.setItem('userEmail', 'invitetest_1781537582@example.com');
}, TOKEN_A);

await page.goto(BASE + '/goals/' + GID, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
console.log('URL after load:', page.url());

// Click Members tab
const membersTab = page.getByRole('tab', { name: /members/i });
await membersTab.click();
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/inv_members.png' });
console.log('Members tab clicked. Invite panel present:', await page.getByPlaceholder(/search people/i).count());

// Search
const search = page.getByPlaceholder(/search people/i);
await search.fill('Bob');
await page.waitForTimeout(1200); // debounce + fetch
await page.screenshot({ path: '/tmp/inv_search.png' });
const inviteBtn = page.getByRole('button', { name: /^invite$/i }).first();
const found = await inviteBtn.count();
console.log('Invite buttons found:', found);

if (found) {
  await inviteBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/inv_after.png' });
  const invited = await page.getByRole('button', { name: /invited/i }).count();
  const toast = await page.locator('[data-sonner-toast]').first().innerText().catch(()=> '(no toast text)');
  console.log('Button now shows "Invited":', invited > 0);
  console.log('Toast:', toast.replace(/\n/g,' | '));
}
console.log('--- network ---'); apiCalls.forEach(c => console.log(c));
await browser.close();
