import { expect, test } from "@playwright/test";

test("основната навигация и темата работят между презареждания", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: /Открий своя.*път към Университета/i })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.getByRole("button", { name: "Включи светла тема" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.getByRole("button", { name: "Още функции" }).click();
    await page.getByRole("menuitem", { name: /^ДЗИ стратег/i }).click();
    await expect(page).toHaveURL(/\/dzi-strateg\/?$/);
    await expect(page.getByRole("heading", { level: 1, name: /Кой втори ДЗИ ти отваря/i })).toBeVisible();
});

test("краткият кариерен тест започва без регистрация", async ({ page }) => {
    await page.goto("/career-advisor/");
    await expect(page.getByRole("heading", { level: 1, name: "Какво те интересува?" })).toBeVisible();
    await page.getByRole("radio", { name: "Кратка" }).check();
    await page.getByRole("button", { name: /Започни краткия тест/i }).click();
    await expect(page.getByText("Въпрос 1 от 30")).toBeVisible();
});

test("приемът след 7. клас приема основните резултати", async ({ page }) => {
    await page.goto("/priem-7-klas/");
    await expect(page.getByRole("heading", { level: 1, name: /Виж в кои гимназии влизаш/i })).toBeVisible();

    await page.getByLabel("НВО БЕЛ (точки)").fill("88.5");
    await page.getByLabel("НВО математика (точки)").fill("92");
    await expect(page.getByLabel("НВО БЕЛ (точки)")).toHaveValue("88.5");
    await expect(page.getByLabel("НВО математика (точки)")).toHaveValue("92");
});
