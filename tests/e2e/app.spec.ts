import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  await request.post("/api/demo/reset", {
    headers: {
      "x-relayframe-test-token": "relayframe-e2e-isolated-token",
    },
  });
});

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
  await expect(
    page.getByRole("heading", { name: "What will you create?" }),
  ).toBeVisible();
  if (!testInfo.project.name.includes("mobile")) {
    await expect(page.getByText("Northstar Creative")).toBeVisible();
  }
  const navigation = page.getByRole("navigation", { name: "Primary" });

  await navigation.getByRole("button", { name: "Projects" }).click();
  await expect(page).toHaveURL(/view=projects/);
  await expect(
    page.getByRole("heading", { name: "Luma launch sprint" }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "What will you create?" }),
  ).toBeVisible();
  await navigation.getByRole("button", { name: "Projects" }).click();

  await navigation.getByRole("button", { name: "Library" }).click();
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();

  await navigation.getByRole("button", { name: "More tools" }).click();
  await page.getByRole("button", { name: "Activity" }).click();
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
  await navigation.getByRole("button", { name: "Create" }).click();
  const generate = page.getByRole("button", {
    name: /Generate 2 concepts/,
  });
  await expect(generate).toBeEnabled();
  await generate.click();
  await expect(page.getByRole("status")).toContainText(
    "Generation reserved and queued",
  );

  await navigation.getByRole("button", { name: "More tools" }).click();
  await page.getByRole("button", { name: "Activity" }).click();
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

test("supports global search and functional studio prompt tools", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop shortcut journey");
  await page.goto("/");
  await page
    .getByRole("button", { name: "Search projects, assets, and prompts" })
    .click();
  const search = page.getByLabel("Search everything");
  await expect(search).toBeVisible();
  await search.fill("Luma launch");
  await expect(page.getByRole("button", { name: /Luma launch sprint/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(search).not.toBeVisible();

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Create" })
    .click();
  const prompt = page.getByLabel("Describe your idea");
  await page.getByRole("button", { name: "Apply brand" }).click();
  await expect(prompt).toHaveValue(/Luma Labs brand palette/);
  await page.getByRole("button", { name: "Enhance" }).click();
  await expect(prompt).toHaveValue(/production-ready negative space/);
  await page.getByRole("button", { name: "Camera recipe" }).click();
  await page.getByRole("button", { name: /35mm slow push-in/ }).click();
  await expect(page.getByRole("status")).toContainText("35mm slow push-in applied");
  await expect(prompt).toHaveValue(/35mm lens, slow controlled dolly-in/);
  await page.getByRole("button", { name: "Capability registry" }).click();
  await expect(page.getByRole("heading", { name: "Model registry" })).toBeVisible();
  await expect(page.locator(".capability-list > div")).toHaveCount(3);
});

test("runs project review, Test Card, production, and review-link actions", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "One mutation journey");
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Projects" })
    .click();

  await page.getByRole("button", { name: "Add Test Card" }).click();
  await page.getByLabel("Concept title").fill("The focused afternoon");
  await page
    .getByLabel("Opening hook")
    .fill("Your strongest afternoon can start with one calm ritual.");
  await page.getByRole("button", { name: "Add Test Card", exact: true }).last().click();
  await expect(page.locator(".test-card")).toHaveCount(5);

  await page.getByRole("button", { name: "Share review" }).click();
  await page.getByRole("button", { name: "Create review link" }).click();
  await expect(page.getByText("Review link ready")).toBeVisible();
  const reviewHref = await page
    .getByRole("link", { name: "Open review page" })
    .getAttribute("href");
  expect(reviewHref).toMatch(/\/review\/[A-Za-z0-9_-]{40,}/);
  const reviewResponse = await page.request.get(reviewHref!);
  expect(reviewResponse.ok()).toBe(true);
  expect(await reviewResponse.text()).toContain("Luma launch sprint");
  await page.getByRole("button", { name: "Close dialog" }).click();

  await page.getByRole("button", { name: "Produce approved" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Approved concepts queued for production",
  );
});

test("supports asset import, details, brand versioning, credits, and settings", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "One workspace mutation journey");
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "More tools" })
    .click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Import assets" }).click();
  await page.getByLabel("Asset name").fill("Launch packaging reference");
  await page
    .getByRole("button", { name: "Import asset", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Asset imported");

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Library" })
    .click();
  await expect(page.locator(".asset-grid > article")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Launch packaging reference", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Launch packaging reference" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "More tools" })
    .click();
  await page.getByRole("button", { name: "Brand system" }).click();
  await page.getByRole("button", { name: "Edit brand pack" }).click();
  await page
    .getByLabel("Brand description")
    .fill(
      "A refined functional beverage brand for creative professionals seeking calm and sustained focus.",
    );
  await page.getByRole("button", { name: "Save new version" }).click();
  await expect(page.getByText("Version 4")).toBeVisible();

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "More tools" })
    .click();
  await page.getByRole("button", { name: "Usage & billing" }).click();
  await page.getByRole("button", { name: "Buy credits" }).click();
  await page.getByRole("button", { name: /1,000 credits/ }).click();
  await expect(page.locator(".balance-card strong")).toHaveText("2,250");

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toContainText("Preferences saved locally");
});

test("creates a project through the visible overview action", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "One project mutation");
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "More tools" })
    .click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByLabel("Project name").fill("Autumn product sprint");
  await page
    .getByLabel("Creative objective")
    .fill("Identify a scalable product demonstration for the autumn campaign.");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("status")).toContainText("Project created");
  await expect(page.getByText("3", { exact: true }).first()).toBeVisible();
});

test("rejects malformed and cross-tenant API requests", async ({ request }) => {
  const tenantResponse = await request.get("/api/demo", {
    headers: { "x-relayframe-organization": "org_other" },
  });
  expect(tenantResponse.status()).toBe(200);
  expect((await tenantResponse.json()).organization.id).toBe("org_demo");

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

  const crossSite = await request.post("/api/projects", {
    headers: {
      origin: "https://attacker.example",
      "x-relayframe-organization": "org_demo",
    },
    data: {
      name: "Attacker project",
      objective: "This request must never mutate the workspace.",
      budgetCredits: 100,
    },
  });
  expect(crossSite.status()).toBe(403);

  const document = await request.get("/");
  expect(document.headers()["content-security-policy"]).toContain(
    "default-src 'self'",
  );
  expect(document.headers()["x-frame-options"]).toBe("DENY");
  expect(document.headers()["strict-transport-security"]).toContain(
    "max-age=63072000",
  );
});

test("has no serious automated accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const severe = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );
  expect(severe).toEqual([]);
});

test("keeps interactive dialogs accessible", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "More tools" })
    .click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  const trigger = page.getByRole("button", { name: "Import assets" });
  await trigger.click();
  await expect(
    page.getByRole("heading", { name: "Import source media" }),
  ).toBeVisible();
  const close = page.getByRole("button", { name: "Close dialog" });
  await expect(close).toBeFocused();
  const results = await new AxeBuilder({ page }).analyze();
  const severe = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );
  expect(severe).toEqual([]);
  await close.click();
  await expect(trigger).toBeFocused();
});

test("fits and navigates at a compact touch viewport", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only test");
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "Primary" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "What will you create?" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "More tools" })
    .click();
  await page.getByRole("button", { name: "Usage & billing" }).click();
  await expect(
    page.getByRole("heading", { name: "Usage & billing" }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
