// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Pure helpers that edit a single LilyPond note token in the source text.
 *
 * Everything here works on plain strings and character offsets, so it can be
 * tested without Monaco or a browser.
 */

export type Accidental =
  | "doubleFlat"
  | "flat"
  | "natural"
  | "sharp"
  | "doubleSharp";

export type NoteAction =
  | { type: "duration"; value: string }
  | { type: "dots" }
  | { type: "accidental"; value: Accidental }
  | { type: "rest" }
  | { type: "delete" };

export interface ParsedNote {
  /** Pitch name including accidental suffix, e.g. "c", "cis", "ees", or "r". */
  pitch: string;

  /** Octave marks, e.g. "'" or ",,". */
  octave: string;

  /** Forced or cautionary accidental mark: "!" or "?". */
  forced: string;

  /** Written duration, e.g. "4". Empty when inherited from a previous note. */
  duration: string;

  /** Duration dots, e.g. "..". */
  dots: string;

  /** Everything after the duration, e.g. "~" or "\\p". */
  suffix: string;
}

export interface DurationSpec {
  duration: string;
  dots: string;
}

export interface TextRange {
  start: number;
  end: number;
}

export interface TextEdit extends TextRange {
  text: string;
}

export interface NoteEditResult {
  /** Non-overlapping edits, expressed in offsets of the original text. */
  edits: TextEdit[];

  /** Range of the edited note after the edits are applied, or null if deleted. */
  selection: TextRange | null;
}

export interface NoteInfo extends TextRange {
  duration: string;
  dots: string;
  accidental: Accidental;
  isRest: boolean;
}

const DEFAULT_DURATION: DurationSpec = { duration: "4", dots: "" };

const ACCIDENTAL_SUFFIX: Record<Accidental, string> = {
  doubleFlat: "eses",
  flat: "es",
  natural: "",
  sharp: "is",
  doubleSharp: "isis",
};

const NOTE_RE =
  /^([a-g](?:isis|eses|is|es|s)?|r)([',]*)([!?]?)(\d+)?(\.*)((?:[~()\[\]\\^_|*-].*)?)$/;

export function parseNote(token: string): ParsedNote | null {
  const match = NOTE_RE.exec(token);
  if (!match) {
    return null;
  }

  return {
    pitch: match[1],
    octave: match[2],
    forced: match[3],
    duration: match[4] || "",
    dots: match[5] || "",
    suffix: match[6] || "",
  };
}

export function formatNote(note: ParsedNote): string {
  return (
    note.pitch +
    note.octave +
    note.forced +
    note.duration +
    note.dots +
    note.suffix
  );
}

export function accidentalOf(pitch: string): Accidental {
  if (pitch === "r") {
    return "natural";
  }
  if (pitch.endsWith("isis")) {
    return "doubleSharp";
  }
  if (pitch.endsWith("eses")) {
    return "doubleFlat";
  }
  if (pitch.endsWith("is")) {
    return "sharp";
  }
  if (pitch.endsWith("es") || pitch === "as") {
    return "flat";
  }

  return "natural";
}

/**
 * Expands a selection to the whitespace-delimited token around it.
 * Returns null when there is no token, or when the selection spans several.
 */
export function findTokenRange(
  text: string,
  start: number,
  end: number,
): TextRange | null {
  let tokenStart = start;
  while (tokenStart > 0 && !/\s/.test(text[tokenStart - 1])) {
    tokenStart -= 1;
  }

  let tokenEnd = end;
  while (tokenEnd < text.length && !/\s/.test(text[tokenEnd])) {
    tokenEnd += 1;
  }

  if (tokenEnd <= tokenStart) {
    return null;
  }
  if (/\s/.test(text.slice(tokenStart, tokenEnd))) {
    return null;
  }

  return { start: tokenStart, end: tokenEnd };
}

/**
 * The duration LilyPond would apply to a note written right after textBefore,
 * i.e. the last explicit duration seen so far.
 */
export function effectiveDuration(textBefore: string): DurationSpec {
  const tokens = textBefore.split(/\s+/);
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const parsed = parseNote(tokens[i]);
    if (parsed && parsed.duration) {
      return { duration: parsed.duration, dots: parsed.dots };
    }
  }

  return DEFAULT_DURATION;
}

/**
 * Describes the note at a range for the toolbar, or null if it is not a note.
 */
export function describeNote(
  text: string,
  start: number,
  end: number,
): NoteInfo | null {
  const range = findTokenRange(text, start, end);
  if (!range) {
    return null;
  }

  const parsed = parseNote(text.slice(range.start, range.end));
  if (!parsed) {
    return null;
  }

  const spec = parsed.duration
    ? { duration: parsed.duration, dots: parsed.dots }
    : effectiveDuration(text.slice(0, range.start));

  return {
    start: range.start,
    end: range.end,
    duration: spec.duration,
    dots: spec.dots,
    accidental: accidentalOf(parsed.pitch),
    isRest: parsed.pitch === "r",
  };
}

function applyAccidental(note: ParsedNote, accidental: Accidental): ParsedNote {
  if (note.pitch === "r") {
    return note;
  }

  const current = accidentalOf(note.pitch);
  const target = current === accidental ? "natural" : accidental;

  return { ...note, pitch: note.pitch[0] + ACCIDENTAL_SUFFIX[target] };
}

/**
 * A note without a written duration inherits the previous one. When an edit
 * changes the duration that follows, pin the old duration on the next note so
 * the rest of the music keeps its rhythm.
 */
function carryDuration(
  text: string,
  offset: number,
  spec: DurationSpec,
): TextEdit | null {
  const match = /^(\s*)(\S+)/.exec(text.slice(offset));
  if (!match) {
    return null;
  }

  const parsed = parseNote(match[2]);
  if (!parsed || parsed.duration) {
    return null;
  }

  const start = offset + match[1].length;

  return {
    start,
    end: start + match[2].length,
    text: formatNote({ ...parsed, duration: spec.duration, dots: spec.dots }),
  };
}

export function applyNoteAction(
  text: string,
  start: number,
  end: number,
  action: NoteAction,
): NoteEditResult | null {
  const parsed = parseNote(text.slice(start, end));
  if (!parsed) {
    return null;
  }

  const before = effectiveDuration(text.slice(0, start));
  const old: DurationSpec = parsed.duration
    ? { duration: parsed.duration, dots: parsed.dots }
    : before;

  let updated: ParsedNote | null = parsed;
  let after: DurationSpec = old;

  switch (action.type) {
    case "duration":
      updated = { ...parsed, duration: action.value, dots: old.dots };
      after = { duration: action.value, dots: old.dots };
      break;
    case "dots": {
      const dots = ".".repeat((old.dots.length + 1) % 4);
      updated = { ...parsed, duration: old.duration, dots };
      after = { duration: old.duration, dots };
      break;
    }
    case "accidental":
      updated = applyAccidental(parsed, action.value);
      break;
    case "rest":
      updated = { ...parsed, pitch: "r", octave: "", forced: "" };
      break;
    case "delete":
      updated = null;
      after = before;
      break;
    default:
      return null;
  }

  let editEnd = end;
  if (updated === null && /[ \t]/.test(text[end] || "")) {
    editEnd = end + 1;
  }

  const edits: TextEdit[] = [
    {
      start,
      end: editEnd,
      text: updated ? formatNote(updated) : "",
    },
  ];

  if (after.duration !== old.duration || after.dots !== old.dots) {
    const carry = carryDuration(text, editEnd, old);
    if (carry) {
      edits.push(carry);
    }
  }

  return {
    edits,
    selection: updated
      ? { start, end: start + edits[0].text.length }
      : null,
  };
}
