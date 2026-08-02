import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

// Drives the whole reviewer journey against whatever backend is configured.
// With N8N_WEBHOOK_URL set this hits live n8n, so generate can take ~40s.
const BASE = process.env.BASE ?? "http://localhost:3001";
const GEN_TIMEOUT = 90_000;

mkdirSync("shots", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
page.on("pageerror", (e) => errs.push(String(e)));

const shot = (n) => page.screenshot({ path: `shots/${n}.png`, fullPage: true });

await page.goto(`${BASE}/review/emp_002?reset=1`, { waitUntil: "networkidle" });
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await shot("1-home");

await page.getByRole("link", { name: /Arjun Mehta/ }).first().click();
await page.waitForURL("**/review/emp_002");
await shot("2-empty");

// The pre-check is arithmetic on the input file, so it must already be on
// screen before anything is generated. That is the whole point of it.
console.log(
  "pre-check renders before generation:",
  (await page.getByText("Evidence balance check").count()) === 1,
);

await page.getByRole("button", { name: "Generate AI Review Draft" }).click();
await page.waitForTimeout(900);
await page.screenshot({ path: "shots/3-loading.png" });
await page.waitForSelector("text=Bias Audit Summary", { timeout: GEN_TIMEOUT });
await page.waitForTimeout(400);
await shot("4-report");

// The signature element: a flagged claim with its reasoning beneath it.
const flagged = page.locator("div").filter({ hasText: /^Flag: / }).last();
const card = flagged.locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
await card.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.screenshot({ path: "shots/5-signature.png", clip: await card.boundingBox() });

// Citation drawer: the raw source behind a claim.
await card.getByRole("button").filter({ hasText: /_\d+$/ }).first().click();
await page.waitForTimeout(500);
await page.screenshot({ path: "shots/6-drawer.png" });
await page.keyboard.press("Escape");

// Flagged-only filter: makes a 13-claim draft actionable.
await page.getByRole("button", { name: "Show flagged only" }).click();
await page.waitForTimeout(300);
await shot("7-flagged-only");
await page.getByRole("button", { name: "Showing flagged only" }).click();
await page.waitForTimeout(300);

// Amend one flagged claim — resolves that flag and creates a diff.
await card.scrollIntoViewIfNeeded();
await card.getByRole("button", { name: "Edit Claim" }).click();
await page.keyboard.type(" Peer evidence records the opposite; discuss in a 1:1.");
await page.keyboard.press("Tab");
await page.waitForTimeout(300);
await page.screenshot({ path: "shots/8-amended.png", clip: await card.boundingBox() });

// Approval preview: exactly what will be sent, before it is sent.
await page.getByRole("button", { name: /Approve/ }).click();
await page.waitForSelector("text=What will be recorded", { timeout: 10_000 });
await page.waitForTimeout(300);
await page.screenshot({ path: "shots/9-preview.png" });

// The guard: approval is refused while high-severity flags are unaddressed.
await page.getByRole("button", { name: "Send approval" }).click();
await page.waitForSelector("text=Approval refused", { timeout: 30_000 });
await page.waitForTimeout(300);
await shot("10-blocked");

const ackButtons = page.getByRole("button", { name: "Acknowledge as written" });
const n = await ackButtons.count();
console.log("unresolved flags presented:", n);
for (let i = 0; i < n; i++) await ackButtons.nth(0).click();
await page.waitForTimeout(300);
await shot("11-acknowledged");

await page.getByRole("button", { name: /Approve/ }).click();
await page.waitForSelector("text=What will be recorded", { timeout: 10_000 });
await page.getByRole("button", { name: "Send approval" }).click();
await page.waitForSelector("text=Decision Recorded", { timeout: 30_000 });
await page.waitForTimeout(300);
await shot("12-approved");

await page.goto(`${BASE}/audit/emp_002`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await shot("13-audit");

// Refresh-survival.
await page.goto(`${BASE}/review/emp_002`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
console.log(
  "report survived refresh:",
  (await page.getByText("Bias Audit Summary").count()) === 1,
);

await page.setViewportSize({ width: 390, height: 900 });
await page.waitForTimeout(300);
await shot("14-mobile");

console.log(
  errs.length ? "CONSOLE ERRORS:\n" + errs.join("\n") : "no console errors",
);
await browser.close();
