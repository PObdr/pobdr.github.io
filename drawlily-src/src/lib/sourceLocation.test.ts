// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";

import { locationToSelection, parseTextEditLink } from "./sourceLocation";

const CODE = ["\\relative c' {", "  c4 d e", "  fis8 g", "}"].join("\n");

const CHORD_CODE = ["\\relative c' {", "  <c e g>4", "}"].join("\n");

describe("parseTextEditLink", () => {
  it("reads line, start and end column", () => {
    expect(parseTextEditLink("textedit:///tmp/hacklily.ly:3:2:3")).toEqual({
      line: 3,
      startColumn: 2,
      endColumn: 3,
    });
  });

  it("works without an end column", () => {
    expect(parseTextEditLink("textedit:///a.ly:3:2")).toEqual({
      line: 3,
      startColumn: 2,
      endColumn: 2,
    });
  });

  it("rejects other links", () => {
    expect(parseTextEditLink("https://example.com")).toBeNull();
  });
});

describe("locationToSelection", () => {
  it("selects the whole note without a line offset (wasm)", () => {
    const location = { line: 2, startColumn: 5, endColumn: 6 };
    expect(locationToSelection(CODE, location, 0)).toEqual({
      selectionStartLineNumber: 2,
      selectionStartColumn: 6,
      positionLineNumber: 2,
      positionColumn: 7,
    });
  });

  it("selects the whole note with one added line (server)", () => {
    const location = { line: 3, startColumn: 2, endColumn: 3 };
    expect(locationToSelection(CODE, location, 1)).toEqual({
      selectionStartLineNumber: 2,
      selectionStartColumn: 3,
      positionLineNumber: 2,
      positionColumn: 5,
    });
  });

  it("recovers when the offset guess is wrong", () => {
    const location = { line: 2, startColumn: 2, endColumn: 3 };
    const selection = locationToSelection(CODE, location, 1);
    expect(selection.selectionStartLineNumber).toBe(2);
    expect(selection.selectionStartColumn).toBe(3);
  });

  it("extends to the end of a longer token", () => {
    const location = { line: 3, startColumn: 2, endColumn: 3 };
    const selection = locationToSelection(CODE, location, 0);
    expect(selection.selectionStartLineNumber).toBe(3);
    expect(selection.positionColumn).toBe(7);
  });

  it("selects a pitch in the middle of a chord", () => {
    const location = { line: 2, startColumn: 5, endColumn: 6 };
    expect(locationToSelection(CHORD_CODE, location, 0)).toEqual({
      selectionStartLineNumber: 2,
      selectionStartColumn: 6,
      positionLineNumber: 2,
      positionColumn: 7,
    });
  });

  it("selects the last pitch of a chord without the closing bracket", () => {
    const location = { line: 2, startColumn: 7, endColumn: 8 };
    expect(locationToSelection(CHORD_CODE, location, 0)).toEqual({
      selectionStartLineNumber: 2,
      selectionStartColumn: 8,
      positionLineNumber: 2,
      positionColumn: 9,
    });
  });

  it("selects the first pitch of a chord without the opening bracket", () => {
    const location = { line: 2, startColumn: 3, endColumn: 4 };
    expect(locationToSelection(CHORD_CODE, location, 0)).toEqual({
      selectionStartLineNumber: 2,
      selectionStartColumn: 4,
      positionLineNumber: 2,
      positionColumn: 5,
    });
  });
});
