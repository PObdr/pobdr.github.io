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
 * For chords, pitchToken selects the pitch inside the chord the action is for.
 */
function run(
  text: string,
  token: string,
  action: NoteAction,
  pitchToken?: string,
): string | null {
  const start = text.indexOf(token);

  let fullAction = action;
  if (pitchToken) {
    const pitchStart = text.indexOf(pitchToken, start + 1);
    fullAction = {
      ...action,
      pitch: { start: pitchStart, end: pitchStart + pitchToken.length },
    } as NoteAction;
  }

  const result = applyNoteAction(
    text,
    start,
    start + token.length,
    fullAction,
  );
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

  it("sets and toggles double accidentals", () => {
    const doubleSharp: NoteAction = {
      type: "accidental",
      value: "doubleSharp",
    };
    const doubleFlat: NoteAction = { type: "accidental", value: "doubleFlat" };
    const flat: NoteAction = { type: "accidental", value: "flat" };
    expect(run("c4 d", "c4", doubleSharp)).toBe("cisis4 d");
    expect(run("cisis4", "cisis4", doubleSharp)).toBe("c4");
    expect(run("e4", "e4", doubleFlat)).toBe("eeses4");
    expect(run("d'8", "d'8", doubleFlat)).toBe("deses'8");
    expect(run("deses4", "deses4", flat)).toBe("des4");
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

describe("applyNoteAction on chords", () => {
  it("changes the duration of the whole chord", () => {
    expect(
      run("<c e g>4 d", "<c e g>4", { type: "duration", value: "8" }),
    ).toBe("<c e g>8 d4");
  });

  it("pins the inherited duration on the next chord", () => {
    expect(
      run("c4 <c e g> d", "<c e g>", { type: "duration", value: "8" }),
    ).toBe("c4 <c e g>8 d4");
  });

  it("adds dots to a chord", () => {
    expect(run("<c e>4", "<c e>4", { type: "dots" })).toBe("<c e>4.");
  });

  it("changes the accidental of one pitch only", () => {
    const sharp: NoteAction = { type: "accidental", value: "sharp" };
    expect(run("<c e g>4", "<c e g>4", sharp, "e")).toBe("<c eis g>4");

    const doubleFlat: NoteAction = { type: "accidental", value: "doubleFlat" };
    expect(run("<c' e'>2", "<c' e'>2", doubleFlat, "e'")).toBe(
      "<c' eeses'>2",
    );
  });

  it("needs a selected pitch for an accidental", () => {
    expect(
      run("<c e>4", "<c e>4", { type: "accidental", value: "sharp" }),
    ).toBeNull();
  });

  it("turns a chord into a rest", () => {
    expect(run("<c e g>4~ d", "<c e g>4~", { type: "rest" })).toBe("r4~ d");
  });

  it("removes one pitch from a chord", () => {
    expect(run("<c e g>4", "<c e g>4", { type: "delete" }, "e")).toBe(
      "<c g>4",
    );
    expect(run("<c e g>4", "<c e g>4", { type: "delete" }, "g")).toBe(
      "<c e>4",
    );
  });

  it("deletes the whole chord when no pitch is selected", () => {
    expect(run("<c e>4 d", "<c e>4", { type: "delete" })).toBe("d");
    expect(run("<c>4 d", "<c>4", { type: "delete" }, "c")).toBe("d");
  });

  it("keeps the rhythm after a chord with an explicit duration", () => {
    expect(run("<c e>8 d e", "d", { type: "duration", value: "16" })).toBe(
      "<c e>8 d16 e8",
    );
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
      isChord: false,
      pitch: null,
      pitchCount: 1,
    });
  });

  it("recognises sharps, flats and their doubles", () => {
    expect(describeNote("fis4", 0, 3)?.accidental).toBe("sharp");
    expect(describeNote("ces4", 0, 3)?.accidental).toBe("flat");
    expect(describeNote("cisis4", 0, 3)?.accidental).toBe("doubleSharp");
    expect(describeNote("eeses4", 0, 3)?.accidental).toBe("doubleFlat");
  });

  it("describes a chord and the pitch that is selected", () => {
    expect(describeNote("<c e g>8 d", 3, 4)).toEqual({
      start: 0,
      end: 8,
      duration: "8",
      dots: "",
      accidental: "natural",
      isRest: false,
      isChord: true,
      pitch: { start: 3, end: 4 },
      pitchCount: 3,
    });
  });

  it("describes a chord without a selected pitch", () => {
    const info = describeNote("<c e g>8 d", 0, 1);
    expect(info?.isChord).toBe(true);
    expect(info?.pitch).toBeNull();
  });
});
