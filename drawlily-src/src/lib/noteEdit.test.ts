// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";

import type { NoteAction } from "./noteEdit";
import {
  applyNoteAction,
  describeNote,
  findTokenRange,
  parseNote,
} from "./noteEdit";

/**
 * Applies an action to the first occurrence of token and returns the new text.
 */
function run(text: string, token: string, action: NoteAction): string | null {
  const start = text.indexOf(token);
  const result = applyNoteAction(text, start, start + token.length, action);
  if (!result) {
    return null;
  }

  let out = text;
  const edits = [...result.edits].sort((a, b) => b.start - a.start);
  for (const edit of edits) {
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  }

  return out;
}

describe("applyNoteAction", () => {
  it("changes duration and pins the old one on the next note", () => {
    expect(run("c4 d e", "c4", { type: "duration", value: "8" })).toBe(
      "c8 d4 e",
    );
  });

  it("adds a duration to a note that inherited one", () => {
    expect(run("c4 d e", "d", { type: "duration", value: "8" })).toBe(
      "c4 d8 e4",
    );
  });

  it("cycles dots from none to three and back", () => {
    expect(run("c4 d", "c4", { type: "dots" })).toBe("c4. d4");
    expect(run("c4...", "c4...", { type: "dots" })).toBe("c4");
  });

  it("sets and toggles accidentals", () => {
    const sharp: NoteAction = { type: "accidental", value: "sharp" };
    const flat: NoteAction = { type: "accidental", value: "flat" };
    expect(run("d'4 e", "d'4", sharp)).toBe("dis'4 e");
    expect(run("dis'4", "dis'4", sharp)).toBe("d'4");
    expect(run("e4", "e4", flat)).toBe("ees4");
  });

  it("turns a note into a rest", () => {
    expect(run("c'4 d", "c'4", { type: "rest" })).toBe("r4 d");
  });

  it("deletes a note and keeps the rhythm of the next one", () => {
    expect(run("c4 d e", "c4", { type: "delete" })).toBe("d e");
    expect(run("c8 d e", "c8", { type: "delete" })).toBe("d8 e");
  });

  it("keeps trailing symbols such as ties", () => {
    expect(run("c4~ c", "c4~", { type: "duration", value: "2" })).toBe(
      "c2~ c4",
    );
  });

  it("ignores tokens that are not simple notes", () => {
    expect(run("<c e>4", "<c", { type: "rest" })).toBeNull();
  });
});

describe("parseNote", () => {
  it("rejects words and commands", () => {
    expect(parseNote("dynamic")).toBeNull();
    expect(parseNote("\\clef")).toBeNull();
  });
});

describe("findTokenRange", () => {
  it("expands a cursor to the surrounding token", () => {
    expect(findTokenRange("a  c4 d", 4, 5)).toEqual({ start: 3, end: 5 });
  });
});

describe("describeNote", () => {
  it("reports the inherited duration", () => {
    expect(describeNote("c8 d e", 3, 4)).toEqual({
      start: 3,
      end: 4,
      duration: "8",
      dots: "",
      accidental: "natural",
      isRest: false,
    });
  });
});
