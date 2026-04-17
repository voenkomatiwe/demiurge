import { test, expect } from "bun:test";
import { parseInvocation } from "../src/index.js";

test("no args → scaffold invocation", () => {
  expect(parseInvocation([])).toEqual({ kind: "scaffold", rest: [] });
});

test("positional target → scaffold", () => {
  expect(parseInvocation(["my-proj"])).toEqual({ kind: "scaffold", rest: ["my-proj"] });
});

test("add app <name> --role=<role> → addApp", () => {
  expect(parseInvocation(["add", "app", "landing", "--role=frontend"])).toEqual({
    kind: "add-app",
    name: "landing",
    role: "frontend",
  });
});

test("add app missing --role throws", () => {
  expect(() => parseInvocation(["add", "app", "landing"])).toThrow(/--role/);
});

test("add app missing name throws", () => {
  expect(() => parseInvocation(["add", "app", "--role=frontend"])).toThrow(/name/);
});
