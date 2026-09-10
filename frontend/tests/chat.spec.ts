import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  // The configured server uses only backend/.test-data/browser.db.
  const list = await request.get('http://127.0.0.1:8000/api/conversations');
  for (const conversation of await list.json()) {
    await request.delete(`http://127.0.0.1:8000/api/conversations/${conversation.id}`);
  }
});

test("create, send, switch, reload and delete persisted chats", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.locator(".new-chat"),
  ).toBeEnabled();
  if (!process.env.E2E_MISSING_KEY)
    await page
      .locator(".new-chat")
      .click();
  const first = `最初の会話-${Date.now()}`;
  await page
    .getByRole("textbox", { name: "メッセージ", exact: true })
    .fill(first);
  await page.getByRole("button", { name: "送信", exact: true }).click();
  if (process.env.E2E_MISSING_KEY) {
    await expect(
      page.getByRole("alert").filter({ hasText: "OPENAI_API_KEY" }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "メッセージ", exact: true }),
    ).toHaveValue(first);
    await expect(
      page.getByRole("button", { name: "送信", exact: true }),
    ).toBeEnabled();
    expect(errors).toEqual([]);
    return;
  }
  await expect(
    page.getByText(`E2E回答: ${first} (履歴 1 件)`, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "メッセージ", exact: true })
    .fill("続きを教えて");
  await page.getByRole("button", { name: "送信", exact: true }).click();
  await expect(
    page.getByText("E2E回答: 続きを教えて (履歴 3 件)", { exact: true }),
  ).toBeVisible();
  await page
    .locator(".new-chat")
    .click();
  const second = `別の会話-${Date.now()}`;
  await page
    .getByRole("textbox", { name: "メッセージ", exact: true })
    .fill(second);
  await page.getByRole("button", { name: "送信", exact: true }).click();
  await expect(
    page.getByText(`E2E回答: ${second} (履歴 1 件)`, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: first, exact: true }).click();
  await expect(
    page.getByText("E2E回答: 続きを教えて (履歴 3 件)", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("E2E回答: 続きを教えて (履歴 3 件)", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/chat-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/chat-mobile.png",
    fullPage: true,
  });
  page.on("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: `${first}を削除`, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: first, exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: second, exact: true }).click();
  await expect(
    page.getByText(`E2E回答: ${second} (履歴 1 件)`, { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
