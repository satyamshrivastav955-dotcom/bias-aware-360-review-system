import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3001";
mkdirSync("shots", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
page.on("pageerror", (e) => errs.push(String(e)));

await page.goto(`${BASE}/review/emp_002?reset=1`, { waitUntil: "networkidle" });
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.screenshot({ path: "shots/1-home.png", fullPage: true });

await page.click("text=Rohan Verma");
await page.waitForURL("**/review/emp_002");
await page.screenshot({ path: "shots/2-empty.png", fullPage: true });

await page.click("text=Draft the review");
await page.waitForTimeout(900);
await page.screenshot({ path: "shots/3-loading.png" });
await page.waitForSelector("text=Bias audit", { timeout: 15000 });
await page.waitForTimeout(500);
await page.screenshot({ path: "shots/4-report.png", fullPage: true });

const flagged = page.locator(".claim-grid").filter({ hasText: "Unsupported claim" }).first();
await flagged.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.screenshot({ path: "shots/5-signature.png", clip: await flagged.boundingBox() });

await page.click("text=manager_A_1 >> nth=0");
await page.waitForTimeout(400);
await page.screenshot({ path: "shots/6-drawer.png" });
await page.keyboard.press("Escape");

await page.click("text=manager_A_3");
await page.waitForTimeout(400);
await page.screenshot({ path: "shots/7-unresolved.png" });
await page.keyboard.press("Escape");

// Amend a flagged claim -> the margin note must say it wasn't re-checked.
await flagged.scrollIntoViewIfNeeded();
await flagged.getByRole("button", { name: "Amend" }).click();
await page.keyboard.type(" Reviewed against project evidence.");
await page.keyboard.press("Tab");
await page.waitForTimeout(300);
await page.screenshot({ path: "shots/9-amended.png", clip: await flagged.boundingBox() });

await page.click("text=Approve with edits");
await page.waitForSelector("text=no further action", { timeout: 10000 });
await page.waitForTimeout(300);
await page.screenshot({ path: "shots/10-approved.png" });

await page.goto(`${BASE}/audit/emp_002`, { waitUntil: "networkidle" });
await page.screenshot({ path: "shots/11-audit.png", fullPage: true });

// Refresh-survival.
await page.goto(`${BASE}/review/emp_002`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const survived = await page.locator("text=Bias audit").count();
console.log("report survived refresh:", survived === 1);

await page.setViewportSize({ width: 390, height: 900 });
await page.waitForTimeout(300);
await page.screenshot({ path: "shots/8-mobile.png", fullPage: true });

console.log(errs.length ? "CONSOLE ERRORS:\n" + errs.join("\n") : "no console errors");
await browser.close();
