import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { accessConfigured, accessToken, codeIsRight, safeNext, tokenIsRight } from "../src/lib/access.ts";

const saved = process.env.WORKSPACE_ACCESS_CODE;
afterEach(() => { if (saved === undefined) delete process.env.WORKSPACE_ACCESS_CODE; else process.env.WORKSPACE_ACCESS_CODE = saved; });

test("access: with no code set, nobody gets in", () => {
  delete process.env.WORKSPACE_ACCESS_CODE;
  assert.equal(accessConfigured(), false);
  assert.equal(codeIsRight(""), false);
  assert.equal(codeIsRight("anything"), false);
  assert.equal(accessToken(), null);
  assert.equal(tokenIsRight(undefined), false);
  assert.equal(tokenIsRight("abc"), false);
});

test("access: the right code opens, a wrong one does not", () => {
  process.env.WORKSPACE_ACCESS_CODE = "  creo-open-sesame ";
  assert.equal(accessConfigured(), true);
  assert.equal(codeIsRight("creo-open-sesame"), true);
  assert.equal(codeIsRight("  creo-open-sesame  "), true);
  assert.equal(codeIsRight("creo-open-sesamE"), false);
  assert.equal(codeIsRight("creo"), false);
  assert.equal(codeIsRight(undefined), false);
  assert.equal(codeIsRight(42), false);
});

test("access: the cookie proves the code without containing it, and changes when the code changes", () => {
  process.env.WORKSPACE_ACCESS_CODE = "first-code";
  const token = accessToken()!;
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.ok(!token.includes("first-code"));
  assert.equal(tokenIsRight(token), true);
  assert.equal(tokenIsRight(token.slice(0, -1) + "0"), false);
  process.env.WORKSPACE_ACCESS_CODE = "second-code";
  assert.equal(tokenIsRight(token), false);
});

test("access: after the code you only ever land inside the workspace", () => {
  assert.equal(safeNext("/app/trend"), "/app/trend");
  assert.equal(safeNext("/app"), "/app");
  assert.equal(safeNext("https://evil.example"), "/app");
  assert.equal(safeNext("//evil.example"), "/app");
  assert.equal(safeNext("/application"), "/app");
  assert.equal(safeNext("/app//x"), "/app");
  assert.equal(safeNext(undefined), "/app");
});
