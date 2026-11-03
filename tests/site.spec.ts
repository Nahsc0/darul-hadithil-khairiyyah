import { test, expect } from "@playwright/test";
test("public navigation and verified contact details", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "A place for faith. A life of learning.",
    }),
  ).toBeVisible();
  await page.goto("/#/contact");
  await expect(
    page.getByRole("link", { name: "+2348062292438", exact: true }),
  ).toHaveAttribute("href", "tel:+2348062292438");
  await expect(
    page.getByRole("link", { name: "+2347038889325", exact: true }),
  ).toBeVisible();
  expect(await page.locator("iframe").count()).toBe(0);
});
test("locale persists and Hausa lectures keep exact supplied titles", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to Hausa" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ha");
  await expect(
    page.getByRole("heading", { name: "Wurin imani. Rayuwar neman ilimi." }),
  ).toBeVisible();
  await page.goto("/#/lectures");
  await expect(
    page.getByRole("heading", { name: "Ummahātun Rabbaina Ulamā" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Asabar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Al-ʿUbūdiyyah", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ha");
});
test("archive classification and detail preserve speaker photos", async ({
  page,
}) => {
  await page.goto("/#/events");
  await expect(
    page.getByRole("heading", {
      name: "Our next gathering is on the horizon.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Past events", exact: true }).click();
  await page
    .getByRole("link", { name: /Jumu’ah Prayer and Islamic Lecture/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "The programme", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "Mallam Muhammad Auwal Mai Shago",
      exact: true,
    }),
  ).toHaveAttribute("src", /muhammad-auwal-mai-shago.jpeg/);
  await expect(
    page.getByRole("img", { name: "Mallam Kamaluddeen Umar Esq", exact: true }),
  ).toHaveAttribute("src", /kamaluddeen-umar-esq.jpeg/);
  await expect(page.getByText("19 Jumada al-Ula 1448 AH")).toHaveCount(0);
});
test("unconfigured services have honest empty states", async ({ page }) => {
  await page.goto("/#/admin");
  await expect(
    page.getByText("Backend not connected", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("input[type=password]")).toHaveCount(0);
  await page.goto("/#/videos");
  await expect(
    page.getByRole("heading", { name: "Videos coming soon" }),
  ).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.goto("/#/connect");
  await expect(
    page.getByText("Umar Kamaludeen", { exact: true }),
  ).toBeVisible();
  await expect(page.locator('a[href*="facebook.com"]')).toHaveCount(0);
  await page.goto("/#/blog");
  await expect(
    page.getByRole("heading", { name: "Good reading is worth the wait." }),
  ).toBeVisible();
});
test("responsive layout, mobile menu, and internal route links", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Toggle menu" }).click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "About", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Rooted in faith. Together in learning.",
      }),
    ).toBeVisible();
  }
  for (const path of [
    "/",
    "/about",
    "/lectures",
    "/events",
    "/blog",
    "/videos",
    "/connect",
    "/contact",
    "/admin",
  ]) {
    await page.goto("/#" + path);
    await expect(page.locator("main h1").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/#/lectures?day=saturday");
  await expect(page.getByRole("tab", { name: "Saturday" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
