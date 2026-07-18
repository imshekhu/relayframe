import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("renders and navigates the complete SaaS workspace", async (
  { page },
  testInfo,
) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good afternoon/ })).toBeVisible();
  if (!testInfo.project.name.includes("mobile")) {
    await expect(page.getByText("Northstar Creative")).toBeVisible();
  }
  const navigation = page.getByRole("navigation", { name: "Primary" });

  await navigation.getByRole("button", { name: "Projects" }).click();
  await expect(
    page.getByRole("heading", { name: "Luma launch sprint" }),
  ).toBeVisible();

  await navigation.getByRole("button", { name: "Library" }).click();
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();

  await navigation.getByRole("button", { name: "Job center" }).click();
  await expect(page.getByRole("heading", { name: "Job center" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("updates Test Card approval through the tenant-scoped API", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Projects" })
    .click();
  const card = page.locator(".test-card").nth(2);
  await card.getByRole("button", { name: "Approve" }).click();
  await expect(card.locator(".card-state")).toHaveText("approved");
  await expect(page.getByRole("status")).toContainText("Test Card approved");
});

test("runs a reserved generation through completion and asset publication", async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Run one paid job");
  const initialResponse = await request.get("/api/demo", {
    headers: { "x-relayframe-organization": "org_demo" },
  });
  const initial = (await initialResponse.json()) as {
    generations: unknown[];
    assets: unknown[];
  };
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Primary" });
  await navigation.getByRole("button", { name: "Generate" }).click();
  const generate = page.getByRole("button", {
    name: /Generate 2 concepts/,
  });
  await expect(generate).toBeEnabled();
  await generate.click();
  await expect(page.getByRole("status")).toContainText(
    "Generation reserved and queued",
  );

  await navigation.getByRole("button", { name: "Job center" }).click();
  await expect(page.locator(".job-row")).toHaveCount(
    initial.generations.length + 1,
  );
  await expect(page.locator(".status-chip").first()).toHaveText("completed", {
    timeout: 15_000,
  });
  await expect(page.locator(".job-row").first()).toContainText("100%");

  await navigation.getByRole("button", { name: "Library" }).click();
  await expect(page.locator(".asset-grid > article")).toHaveCount(
    initial.assets.length + 2,
  );
});

test("rejects malformed and cross-tenant API requests", async ({ request }) => {
  const tenantResponse = await request.get("/api/demo", {
    headers: { "x-relayframe-organization": "org_other" },
  });
  expect(tenantResponse.status()).toBe(404);

  const invalidGeneration = await request.post("/api/generations", {
    headers: { "x-relayframe-organization": "org_demo" },
    data: {
      operation: "text_to_video",
      prompt: "tiny",
      modelId: "unknown",
      aspectRatio: "2:3",
      outputCount: 99,
      idempotencyKey: "bad",
    },
  });
  expect(invalidGeneration.status()).toBe(422);
});

test("has no serious automated accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const severe = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );
  expect(severe).toEqual([]);
});

test("fits and navigates at a compact touch viewport", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only test");
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "Primary" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Generate" })
    .click();
  await expect(page.getByRole("heading", { name: "Generate" })).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
