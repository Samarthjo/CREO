// A one-time note, kept in this tab only, that says "the code was just typed on the code page".
// Without it the workspace would ask for the code a second time right after the code page asked. It holds a time, never the code,
// and it is used up the first time the workspace reads it.
const KEY = "creo.justUnlocked";
const FRESH_MS = 20_000;

/** The code page calls this just before it sends the visitor into the workspace. */
export function markJustUnlocked(): void {
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Storage is blocked (private window): the workspace will simply ask once more.
  }
}

/** The workspace calls this when it loads: true once, if the code page handed this tab over a moment ago. */
export function takeJustUnlocked(): boolean {
  try {
    const at = Number(sessionStorage.getItem(KEY));
    sessionStorage.removeItem(KEY);
    return at > 0 && Date.now() - at < FRESH_MS;
  } catch {
    return false;
  }
}
