import { test, expect, Locator } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await expect(page).toHaveTitle("SlackerNews");
});

test('has demo links', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // expect there are 3 links
  const linkRows: Locator = page.locator("_react=LinkRow");
  const linkCounts = await linkRows.count()
  await expect(linkCounts).toEqual(3);

  const enterpriseReadyLinkRow: Locator = (await linkRows.all())[0];
  expect(await enterpriseReadyLinkRow.innerText()).toContain(`EnterpriseReady - Build SaaS Features Enterprises Love (www.enterpriseready.io`);
  expect(await enterpriseReadyLinkRow.innerText()).toContain(`3 points`);

  const replicatedLinkRow: Locator = (await linkRows.all())[1];
  expect(await replicatedLinkRow.innerText()).toContain(`We help software vendors ship their apps to complex customer environments`);
  expect(await replicatedLinkRow.innerText()).toContain(`2 points`);

  const slackerNewsLinkRow: Locator = (await linkRows.all())[2];
  expect(await slackerNewsLinkRow.innerText()).toContain(`Getting started with SlackerNews`);
  expect(await slackerNewsLinkRow.innerText()).toContain(`1 points`);
});

