// Playwright capture: body view plus one view per section, at 390 and 1440 px, dark and light.
// Run through the Playwright MCP `browser_run_code` tool (filename = this file).
async (page) => {
  const dir = 'qa/shots/'; // relative to where Playwright runs; use an absolute path if shots land elsewhere
  const views = [['body', null], ['nervous', null], ['nervous', 'brain'], ['nervous', 'nerves'], ['heart', null], ['heart', 'lv'], ['lungs', 'ru'], ['digestive', 'intestine_large'], ['urinary', null], ['vessels', 'arteries'], ['skeleton', null], ['lymph', null], ['reproductive', null]];
  const sizes = [[390, 844], [1440, 900]];
  const out = [];
  for (const theme of ['dark', 'light']) for (const [w, h] of sizes) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`http://localhost:5178/?theme=${theme}`);
    await page.waitForFunction(() => window.__anatomy);
    for (const [id, focus] of views) {
      await page.evaluate(([id, focus]) => window.__anatomy.select(id === 'body' ? null : id, { focus }), [id, focus]);
      await page.waitForTimeout(1700);
      const name = `${id}${focus && id !== 'digestive' ? '-' + focus : ''}-${w}-${theme}.png`;
      await page.screenshot({ path: dir + name });
      out.push(name);
    }
  }
  const errors = await page.evaluate(() => window.__anatomy.scene.quality);
  return { shots: out.length, quality: errors };
}
