import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (window.localStorage.getItem("processcanvas:workspace")) return;
    window.localStorage.setItem("processcanvas:workspace", JSON.stringify({
      version: 3,
      workflowName: "Demo",
      nodes: [],
      edges: [],
      locale: "ru",
      theme: "light",
      introSeen: true,
      onboardingSeen: true,
      isDemo: false,
      tutorialSeen: true,
      tutorialCompleted: false,
      tutorialActive: false,
      tutorialStep: 0,
      tutorialEvents: { edit: false, undo: false, redo: false, autosave: false },
      tutorialBackup: null,
    }));
  });
});

test("guest can open tools and apply a template", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("ProcessCanvas").first()).toBeVisible();
  await page.getByRole("button", { name: "Импорт, экспорт и шаблоны" }).click();
  await expect(page.getByRole("dialog")).toContainText("Готовые шаблоны");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /использовать/i }).first().click();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("invalid import is rejected and a valid file is imported", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Импорт, экспорт и шаблоны" }).click();
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles("tests/fixtures/invalid-workflow.json");
  await expect(page.getByText("Файл не является корректным процессом ProcessCanvas.", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Название процесса" })).toHaveValue("Demo");
  page.once("dialog", (dialog) => dialog.accept());
  await fileInput.setInputFiles("tests/fixtures/valid-workflow.json");
  await expect(page.getByRole("textbox", { name: "Название процесса" })).toHaveValue("Импортированный процесс");
});

test("export downloads a versioned ProcessCanvas file", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Импорт, экспорт и шаблоны" }).click();
  const download = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Экспортировать JSON/i }).click(),
  ]).then(([result]) => result);
  expect(download.suggestedFilename()).toBe("demo.processcanvas.json");
});

test("language and theme persist after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "en", exact: true }).click();
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await page.waitForTimeout(900);
  await page.reload();
  await expect(page.getByText("Workflow design studio", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use light theme" })).toBeVisible();
});

test("editor fits a compact desktop viewport", async ({ page }) => {
  await page.setViewportSize({ width: 850, height: 700 });
  await page.goto("/");
  await expect(page.locator("main.canvas")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
