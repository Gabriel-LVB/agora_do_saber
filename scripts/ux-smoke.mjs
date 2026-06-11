import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.UX_BASE_URL || 'http://localhost:3003/';
const expectPrivate2 = process.env.UX_EXPECT_PRIVATE_2 === 'true';
const outDir = path.resolve('test-results/ux-smoke');
const viewports = [
  { name:'desktop-dark', width:1440, height:900, dark:true, fontScale:100 },
  { name:'desktop-large-font', width:1440, height:900, dark:true, fontScale:130 },
  { name:'mobile-dark-large-font', width:390, height:844, dark:true, fontScale:130 },
  { name:'mobile-light', width:390, height:844, dark:false, fontScale:100 },
];

const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch(e) {
    fail('Playwright não está instalado. Rode `npm i -D playwright` e depois `npx playwright install chromium`.');
    return null;
  }
}

async function main() {
  const playwright = await loadPlaywright();
  if (!playwright) return;

  await fs.mkdir(outDir, { recursive:true });
  const browser = await playwright.chromium.launch();

  try {
    for (const cfg of viewports) {
      const page = await browser.newPage({ viewport:{ width:cfg.width, height:cfg.height } });
      page.setDefaultTimeout(20000);
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(baseUrl, { waitUntil:'domcontentloaded', timeout:30000 });

      await page.evaluate(({ dark, fontScale }) => {
        localStorage.setItem('qb_dark', JSON.stringify(dark));
        localStorage.setItem('qb_font_scale', String(fontScale));
      }, cfg);
      await page.reload({ waitUntil:'domcontentloaded' });
      await page.locator('#root').waitFor({ state:'attached' });
      await page.waitForFunction(
        () => document.body.innerText.includes('Entrar com Google')
          || document.body.innerText.includes('Acesso negado')
          || document.body.innerText.includes('Ágora 2.0'),
        null,
        { timeout:30000 }
      );

      const rootVisible = await page.locator('#root').evaluate(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
      });
      if (!rootVisible) fail(`${cfg.name}: root invisível ou sem dimensão.`);

      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      if (horizontalOverflow) fail(`${cfg.name}: overflow horizontal detectado.`);

      const bodyText = await page.locator('body').innerText();
      if (!bodyText.includes('Entrar com Google')) fail(`${cfg.name}: entrada Google não encontrada.`);
      if (expectPrivate2 && !bodyText.includes('ÁGORA 2.0 · AMBIENTE PRIVADO')) {
        fail(`${cfg.name}: selo do ambiente privado não encontrado.`);
      }
      if (pageErrors.length) fail(`${cfg.name}: erro de página: ${pageErrors.join(' | ')}`);

      await page.screenshot({ path:path.join(outDir, `${cfg.name}.png`), fullPage:true });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
