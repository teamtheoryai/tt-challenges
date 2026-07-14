// Startup helper: retry an async probe until it succeeds or attempts run out.
export async function waitFor(label, probe, { attempts = 40, delayMs = 1500 } = {}) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await probe();
      console.log(`[wait] ${label}: ready`);
      return;
    } catch (err) {
      if (i === attempts) {
        throw new Error(`[wait] ${label}: gave up after ${attempts} attempts — ${err.message}`);
      }
      if (i % 5 === 0) console.log(`[wait] ${label}: not ready yet (${err.message})`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
