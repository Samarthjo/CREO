import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { markJustUnlocked, takeJustUnlocked } from "../src/lib/access-marker.ts";

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
const useStorage = (s: Store) => Object.defineProperty(globalThis, "sessionStorage", { value: s, configurable: true, writable: true });

let data: Map<string, string>;
const memory = (): Store => ({
  getItem: (k) => data.get(k) ?? null,
  setItem: (k, v) => void data.set(k, String(v)),
  removeItem: (k) => void data.delete(k),
});

beforeEach(() => { data = new Map(); useStorage(memory()); });
afterEach(() => { if (original) Object.defineProperty(globalThis, "sessionStorage", original); else delete (globalThis as { sessionStorage?: unknown }).sessionStorage; });

test("marker: the hand-over from the code page counts once", () => {
  markJustUnlocked();
  assert.equal(takeJustUnlocked(), true);
  assert.equal(takeJustUnlocked(), false, "a second read finds it used up");
});

test("marker: without one, the workspace stays locked", () => {
  assert.equal(takeJustUnlocked(), false);
});

test("marker: an old note does not count, and is cleared anyway", () => {
  data.set("creo.justUnlocked", String(Date.now() - 60_000));
  assert.equal(takeJustUnlocked(), false);
  assert.equal(data.size, 0);
});

test("marker: junk in the slot does not count", () => {
  data.set("creo.justUnlocked", "yes");
  assert.equal(takeJustUnlocked(), false);
});

test("marker: it holds a time, nothing else", () => {
  markJustUnlocked();
  const [value] = [...data.values()];
  assert.match(value, /^\d+$/);
});

test("marker: blocked storage never throws, and never opens the workspace", () => {
  const blocked = () => { throw new Error("blocked"); };
  useStorage({ getItem: blocked, setItem: blocked, removeItem: blocked });
  assert.doesNotThrow(() => markJustUnlocked());
  assert.equal(takeJustUnlocked(), false);
});
