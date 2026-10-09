// Interrupt tests. Run through the Playwright MCP `browser_run_code` tool (filename = this file).
// Checks: retarget mid-transition without a cut, tap a second organ mid-flight, drag tracks 1:1,
// flick carries momentum, grab-and-reverse mid-coast, sheet drag / flick / grab mid-animation.
async (page) => {
  const results = [];
  const check = (name, pass, detail) => results.push({ name, pass: !!pass, detail });
  const load = async (w, h) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('http://localhost:5178/?theme=dark');
    await page.waitForFunction(() => window.__anatomy);
    await page.waitForTimeout(600);
  };
  // Record the on-screen position and size of one fixed organ (the heart) and the azimuth every frame.
  // A fixed organ is used so the numbers describe the camera, not a change of subject.
  const record = (ms) => page.evaluate((ms) => new Promise((res) => {
    const s = window.__anatomy.scene, out = [], t0 = performance.now();
    const tick = () => { const f = s.projectEntity('liver_right'); out.push({ t: performance.now() - t0, x: f.x, y: f.y, r: f.r, az: s.azimuth }); performance.now() - t0 < ms ? requestAnimationFrame(tick) : res(out); };
    requestAnimationFrame(tick);
  }), ms);
  const maxStep = (rows, key) => rows.slice(1).reduce((m, r, i) => Math.max(m, Math.abs(r[key] - rows[i][key])), 0);

  // 1. Retarget mid-transition (programmatic): heart, then nervous 150 ms later.
  await load(1440, 900);
  await page.evaluate(() => { window.__anatomy.select('heart'); setTimeout(() => window.__anatomy.select('nervous'), 150); });
  let rows = await record(2200);
  let settled = await page.evaluate(() => ({ s: window.__anatomy.scene.settled, sec: window.__anatomy.state.section }));
  check('retarget mid-transition is continuous (no cut)', maxStep(rows, 'r') < 60 && maxStep(rows, 'az') < 0.2 && settled.sec === 'nervous', { maxRadiusStepPx: +maxStep(rows, 'r').toFixed(1), maxAzStep: +maxStep(rows, 'az').toFixed(3), frames: rows.length, ...settled });

  // 2. Real tap on a second organ while the camera is still moving.
  await page.evaluate(() => window.__anatomy.select(null)); await page.waitForTimeout(1500);
  await page.evaluate(() => window.__anatomy.select('digestive')); await page.waitForTimeout(180);
  const midFlight = await page.evaluate(() => !window.__anatomy.scene.settled);
  const lung = await page.evaluate(() => window.__anatomy.scene.projectEntity('lung_r_upper'));
  await page.mouse.click(lung.x, lung.y);
  rows = await record(1800);
  const after = await page.evaluate(() => window.__anatomy.state.section);
  check('tap second organ mid-transition retargets', midFlight && after === 'lungs' && maxStep(rows, 'r') < 60, { midFlight, selected: after, maxRadiusStepPx: +maxStep(rows, 'r').toFixed(1) });

  // 3. Drag tracks 1:1, release coasts, grab mid-coast and reverse.
  await page.evaluate(() => window.__anatomy.select(null)); await page.waitForTimeout(1500);
  const az0 = await page.evaluate(() => window.__anatomy.scene.azimuth);
  await page.mouse.move(700, 450); await page.mouse.down();
  await page.mouse.move(690, 450); // past the slop threshold; tracking is measured from here
  const azA = await page.evaluate(() => window.__anatomy.scene.azimuth);
  for (let i = 1; i <= 10; i++) { await page.mouse.move(690 - i * 20, 450); await page.waitForTimeout(8); }
  const azB = await page.evaluate(() => window.__anatomy.scene.azimuth);
  check('drag tracks the pointer 1:1', Math.abs((azB - azA) - 200 * 0.0075) < 0.02, { expectedRad: 1.5, gotRad: +(azB - azA).toFixed(3) });
  await page.mouse.up();
  await page.waitForTimeout(120);
  const azC = await page.evaluate(() => window.__anatomy.scene.azimuth);
  check('flick projects momentum after release', azC - azB > 0.05, { coastedRad: +(azC - azB).toFixed(3) });
  // grab while still coasting, drag the other way
  await page.mouse.move(490, 450); await page.mouse.down();
  const azGrab = await page.evaluate(() => window.__anatomy.scene.azimuth);
  await page.waitForTimeout(60);
  const azHeld = await page.evaluate(() => window.__anatomy.scene.azimuth);
  await page.mouse.move(500, 450);
  for (let i = 1; i <= 5; i++) { await page.mouse.move(500 + i * 20, 450); await page.waitForTimeout(8); }
  const azRev = await page.evaluate(() => window.__anatomy.scene.azimuth);
  await page.mouse.up(); await page.waitForTimeout(900);
  check('grab mid-coast stops it at the live value and reverses', Math.abs(azHeld - azGrab) < 0.01 && azRev < azHeld - 0.5, { driftWhileHeld: +(azHeld - azGrab).toFixed(4), reversedBy: +(azRev - azHeld).toFixed(3) });

  // 4. Vertical rubber-band: drag far past the tilt limit, then release.
  await page.mouse.move(700, 300); await page.mouse.down(); await page.mouse.move(700, 310);
  for (let i = 1; i <= 10; i++) { await page.mouse.move(700, 310 + i * 40); await page.waitForTimeout(8); }
  const sy1 = await page.evaluate(() => window.__anatomy.scene.projectFrame().y);
  await page.mouse.up(); await page.waitForTimeout(1200);
  const tiltOk = await page.evaluate(() => window.__anatomy.scene.settled);
  check('tilt rubber-bands and springs back inside limits', tiltOk, { settledAfterRelease: tiltOk, screenYWhileHeld: Math.round(sy1) });

  // 5. Bottom sheet at 390 px: drag up, flick down, grab mid-animation.
  await load(390, 844);
  await page.evaluate(() => window.__anatomy.select('heart')); await page.waitForTimeout(1200);
  const top = () => page.evaluate(() => Math.round(document.getElementById('panel').getBoundingClientRect().top));
  const peekTop = await top();
  const gx = 195, gy = peekTop + 20;
  await page.mouse.move(gx, gy); await page.mouse.down(); await page.mouse.move(gx, gy - 10);
  for (let i = 1; i <= 6; i++) { await page.mouse.move(gx, gy - 10 - i * 20); await page.waitForTimeout(16); }
  const dragTop = await top();
  check('sheet tracks the finger 1:1', Math.abs((peekTop - dragTop) - 120) <= 3, { movedPx: peekTop - dragTop, expected: 120 });
  await page.mouse.up(); await page.waitForTimeout(160);
  const midTop = await top();
  // grab it again before it settles and throw it down
  await page.mouse.move(gx, midTop + 20); await page.mouse.down();
  const grabTop = await top(); // measured after the grab, so the comparison is not racing the animation
  await page.waitForTimeout(50); const heldTop = await top();
  await page.mouse.move(gx, midTop + 30);
  for (let i = 1; i <= 4; i++) { await page.mouse.move(gx, midTop + 30 + i * 30); await page.waitForTimeout(8); }
  await page.mouse.up(); await page.waitForTimeout(900);
  const endTop = await top(), det = await page.evaluate(() => window.__anatomy.sheet.name);
  check('sheet can be grabbed mid-animation and flicked back', Math.abs(heldTop - grabTop) <= 1 && det === 'peek' && Math.abs(endTop - peekTop) <= 2, { movingWhenGrabbed: grabTop !== peekTop, heldDrift: heldTop - grabTop, detent: det, endTop, peekTop });
  // over-drag past the top detent resists
  await page.evaluate(() => window.__anatomy.sheet.go('full')); await page.waitForTimeout(900);
  const fullTop = await top();
  await page.mouse.move(gx, fullTop + 20); await page.mouse.down(); await page.mouse.move(gx, fullTop + 10);
  for (let i = 1; i <= 5; i++) { await page.mouse.move(gx, fullTop + 10 - i * 20); await page.waitForTimeout(8); }
  const overTop = await top(); await page.mouse.up(); await page.waitForTimeout(800);
  check('sheet rubber-bands past its top detent', fullTop - overTop > 5 && fullTop - overTop < 70 && Math.abs((await top()) - fullTop) <= 2, { pulledPx: 100, movedPx: fullTop - overTop });

  // 6. Keyboard and reduced motion.
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  check('Escape returns to body view', (await page.evaluate(() => window.__anatomy.state.section)) === null, {});
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => window.__anatomy.select('nervous')); await page.waitForTimeout(400);
  const rm = await page.evaluate(() => ({ settled: window.__anatomy.scene.settled, live: document.getElementById('live').textContent.slice(0, 20) }));
  check('reduced motion: camera snaps (no travel), change is announced', rm.settled && rm.live.startsWith('Nervous selected'), rm);
  await page.emulateMedia({ reducedMotion: null });

  // 7. Guided tour: steps retarget the camera mid-move; taking the controls ends the tour.
  await load(390, 844);
  await page.click('#tours-btn'); await page.click('#tour-list button');
  await page.waitForTimeout(200);
  await page.click('#tour-next'); await page.waitForTimeout(120); await page.click('#tour-next'); // second press lands mid-transition
  rows = await record(1800);
  const ts = await page.evaluate(() => ({ i: window.__anatomy.tour.i, sec: window.__anatomy.state.section, focus: window.__anatomy.state.focus, cut: document.getElementById('cut').value, step: document.getElementById('tour-step').textContent, live: document.getElementById('live').textContent.slice(0, 12) }));
  check('tour steps are one continuous move and set part and cutaway', ts.i === 2 && ts.focus === 'valves' && ts.cut === '40' && ts.live === 'Step 3 of 10' && maxStep(rows, 'r') < 60, { ...ts, maxRadiusStepPx: +maxStep(rows, 'r').toFixed(1) });
  await page.click('#tabs button:nth-child(4)'); await page.waitForTimeout(300);
  const ended = await page.evaluate(() => ({ active: !!window.__anatomy.tour.active, hidden: document.getElementById('tour').hidden, sec: window.__anatomy.state.section, cut: document.getElementById('cut').value }));
  check('choosing a section yourself ends the tour and clears the cutaway', !ended.active && ended.hidden && ended.sec === 'lungs' && ended.cut === '0', ended);

  // 8. Search: type, pick the first match with Enter, land on the right piece. Then reset from anywhere.
  await page.click('#search-btn'); await page.keyboard.type('tibia'); await page.waitForTimeout(100);
  const found = await page.evaluate(() => ({ count: document.getElementById('finder-count').textContent, first: document.querySelector('.finder__item strong')?.textContent }));
  await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  const landed = await page.evaluate(() => ({ open: document.getElementById('finder').open, s: window.__anatomy.state.section, f: window.__anatomy.state.focus, d: window.__anatomy.state.detail }));
  check('search finds a piece and flies to it', found.first === 'Tibia' && !landed.open && landed.s === 'skeleton' && landed.f === 'legs' && landed.d === 'tibia', { ...found, ...landed });
  await page.click('#search-btn'); await page.keyboard.type('kneecap'); await page.waitForTimeout(100);
  const alias = await page.evaluate(() => document.querySelector('.finder__item strong')?.textContent);
  await page.keyboard.type('zzz'); await page.waitForTimeout(100);
  const empty = await page.evaluate(() => ({ msg: !!document.querySelector('.finder__empty'), count: document.getElementById('finder-count').textContent }));
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  check('search knows everyday names and says so when nothing matches', alias === 'Patella' && empty.msg && empty.count === '0 matches', { alias, ...empty });
  await page.evaluate(() => { const i = document.getElementById('cut'); i.value = '40'; i.dispatchEvent(new Event('input')); window.__anatomy.scene.zoomBy(1.8); window.__anatomy.scene.nudge(2, 0); });
  await page.waitForTimeout(200); await page.click('#reset-btn'); await page.waitForTimeout(1600);
  const rs = await page.evaluate(() => ({ s: window.__anatomy.state.section, zoom: +window.__anatomy.scene.zoom.toFixed(2), az: +(((window.__anatomy.scene.azimuth % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).toFixed(1), cut: document.getElementById('cut').value }));
  check('reset returns to the whole body, opening angle and zoom, cutaway off', rs.s === null && rs.zoom === 1 && rs.cut === '0' && Math.abs(rs.az - 0.4) < 0.25, rs);
  const fit = await page.evaluate(() => { const t = document.getElementById('tabs'); return { overflow: t.scrollWidth - t.clientWidth, minH: Math.min(...[...t.children].map((b) => Math.round(b.getBoundingClientRect().height))), visible: [...t.children].every((b) => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }) }; });
  check('all ten section tabs fit at 390 px with no scrolling and 44 px targets', fit.overflow <= 0 && fit.visible && fit.minH >= 44, fit);

  // 9. Second body: the switch reloads with the female set, its own section and no parts it lacks.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5178/?theme=dark&body=male'); await page.waitForFunction(() => window.__anatomy);
  await page.click('#body-btn'); await page.waitForFunction(() => window.__anatomy && document.getElementById('app').dataset.body === 'female', null, { timeout: 60000 });
  await page.evaluate(() => window.__anatomy.select('reproductive', { focus: 'uterus', detail: 'cervix' })); await page.waitForTimeout(600);
  const fem = await page.evaluate(() => ({ lastTab: [...document.querySelectorAll('#tabs .tab__name')].pop().textContent, urethra: window.__anatomy.INDEX.some((e) => e.label === 'Urethra'), prostate: window.__anatomy.INDEX.some((e) => /prostate/i.test(e.label)), uterus: window.__anatomy.INDEX.some((e) => e.label === 'Cervix'), detail: window.__anatomy.state.detail, height: document.getElementById('ruler-top').textContent, tag: document.getElementById('tag-name').textContent }));
  check('female body loads with its own section and without parts it lacks', fem.lastTab === 'Uterus' && !fem.urethra && !fem.prostate && fem.uterus && fem.detail === 'cervix' && fem.tag === 'Cervix' && fem.height === '1.67 m', fem);
  await page.click('#body-btn'); await page.waitForFunction(() => window.__anatomy && document.getElementById('app').dataset.body === 'male', null, { timeout: 60000 });
  const back = await page.evaluate(() => ({ lastTab: [...document.querySelectorAll('#tabs .tab__name')].pop().textContent, height: document.getElementById('ruler-top').textContent }));
  check('switching back restores the male body', back.lastTab === 'Prostate' && back.height === '1.83 m', back);

  const errors = await page.evaluate(() => window.__anatomy.scene.quality);
  return { passed: results.filter((r) => r.pass).length, total: results.length, results, quality: errors };
}
