// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Pure helpers that edit a single LilyPond note or chord in the source text.
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
  | { type: "accidental"; value: Accidental; pitch?: TextRange | null }
  | { type: "rest" }
  | { type: "delete"; pitch?: TextRange | null };

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

export interface ParsedChord {
  /** The text between the angle brackets, e.g. "c' e' g'". */
  inner: string;

  /** Written duration, e.g. "4". Empty when inherited from a previous note. */
  duration: string;

  /** Duration dots, e.g. "..". */
  dots: string;

  /** Everything after the duration, e.g. "~". */
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

  /** Accidental of the note, or of the selected pitch inside a chord. */
  accidental: Accidental;
  isRest: boolean;
  isChord: boolean;

  /** The pitch inside a chord that is selected, if any. */
  pitch: TextRange | null;

  /** Number of pitches in the chord, or 1 for a single note. */
  pitchCount: number;
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

const CHORD_RE = /^<([^<>{}]*)>(\d+)?(\.*)((?:[~()\[\]\\^_|*-].*)?)$/;

/**
 * The part of a chord between (and including) the angle brackets. `<<` and
 * `>>` belong to simultaneous music, not to chords.
 */
const CHORD_CORE_SOURCE = "<(?!<)[^<>{}]*>(?!>)";

const NEXT_CHORD_RE = new RegExp(`^(\\s*)(${CHORD_CORE_SOURCE}\\S*)`);

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

export function parseChord(token: string): ParsedChord | null {
  const match = CHORD_RE.exec(token);
  if (!match) {
    return null;
  }

  return {
    inner: match[1],
    duration: match[2] || "",
    dots: match[3] || "",
    suffix: match[4] || "",
  };
}

export function formatChord(chord: ParsedChord): string {
  return `<${chord.inner}>${chord.duration}${chord.dots}${chord.suffix}`;
}

export function accidentalOf(pitch: string): Accidental {
  if (pitch === "r") {
    return "natural";
  }
  if (pitch.endsWith("isis")) {
    return "doubleSharp";
  }
  if (pitch.endsWith("eses") || pitch.endsWith("ases")) {
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
 * Finds the chord, including its duration and suffix, that contains the
 * selection.
 */
function findChordToken(
  text: string,
  start: number,
  end: number,
): TextRange | null {
  const re = new RegExp(CHORD_CORE_SOURCE, "g");

  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > start) {
      break;
    }

    let tokenEnd = m.index + m[0].length;
    while (tokenEnd < text.length && !/\s/.test(text[tokenEnd])) {
      tokenEnd += 1;
    }

    if (end <= tokenEnd && parseChord(text.slice(m.index, tokenEnd))) {
      return { start: m.index, end: tokenEnd };
    }
  }

  return null;
}

interface NoteToken extends TextRange {
  chord: boolean;
}

function findNoteToken(
  text: string,
  start: number,
  end: number,
): NoteToken | null {
  const chord = findChordToken(text, start, end);
  if (chord) {
    return { ...chord, chord: true };
  }

  const range = findTokenRange(text, start, end);
  if (range && parseNote(text.slice(range.start, range.end))) {
    return { ...range, chord: false };
  }

  return null;
}

/**
 * The duration LilyPond would apply to a note written right after textBefore,
 * i.e. the last explicit duration seen so far.
 */
export function effectiveDuration(textBefore: string): DurationSpec {
  // Remove the spaces inside chords, so that each chord is one token.
  const normalized = textBefore.replace(
    new RegExp(CHORD_CORE_SOURCE, "g"),
    (chord) => chord.replace(/\s+/g, ""),
  );

  const tokens = normalized.split(/\s+/);
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const parsed = parseNote(tokens[i]) || parseChord(tokens[i]);
    if (parsed && parsed.duration) {
      return { duration: parsed.duration, dots: parsed.dots };
    }
  }

  return DEFAULT_DURATION;
}

/**
 * Finds the pitch inside a chord that contains the selection.
 */
function findPitch(
  text: string,
  chord: TextRange,
  start: number,
  end: number,
): { pitch: TextRange | null; count: number } {
  const open = chord.start + 1;
  const close = text.indexOf(">", chord.start);
  const inner = text.slice(open, close);

  let pitch: TextRange | null = null;
  let count = 0;
  const re = /\S+/g;
  for (let m = re.exec(inner); m; m = re.exec(inner)) {
    count += 1;

    const pitchStart = open + m.index;
    const pitchEnd = pitchStart + m[0].length;
    if (start >= pitchStart && end <= pitchEnd) {
      pitch = { start: pitchStart, end: pitchEnd };
    }
  }

  return { pitch, count };
}

/**
 * Describes the note or chord at a range for the toolbar, or null if it is
 * neither.
 */
export function describeNote(
  text: string,
  start: number,
  end: number,
): NoteInfo | null {
  const token = findNoteToken(text, start, end);
  if (!token) {
    return null;
  }

  const raw = text.slice(token.start, token.end);
  const before = effectiveDuration(text.slice(0, token.start));

  if (token.chord) {
    const chord = parseChord(raw);
    if (!chord) {
      return null;
    }

    const { pitch, count } = findPitch(text, token, start, end);
    const spec = chord.duration
      ? { duration: chord.duration, dots: chord.dots }
      : before;

    let accidental: Accidental = "natural";
    if (pitch) {
      const parsedPitch = parseNote(text.slice(pitch.start, pitch.end));
      if (parsedPitch) {
        accidental = accidentalOf(parsedPitch.pitch);
      }
    }

    return {
      start: token.start,
      end: token.end,
      duration: spec.duration,
      dots: spec.dots,
      accidental,
      isRest: false,
      isChord: true,
      pitch,
      pitchCount: count,
    };
  }

  const parsed = parseNote(raw);
  if (!parsed) {
    return null;
  }

  const spec = parsed.duration
    ? { duration: parsed.duration, dots: parsed.dots }
    : before;

  return {
    start: token.start,
    end: token.end,
    duration: spec.duration,
    dots: spec.dots,
    accidental: accidentalOf(parsed.pitch),
    isRest: parsed.pitch === "r",
    isChord: false,
    pitch: null,
    pitchCount: 1,
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
 * A note or chord without a written duration inherits the previous one. When
 * an edit changes the duration that follows, pin the old duration on the next
 * note or chord so the rest of the music keeps its rhythm.
 */
function carryDuration(
  text: string,
  offset: number,
  spec: DurationSpec,
): TextEdit | null {
  const rest = text.slice(offset);

  const chordMatch = NEXT_CHORD_RE.exec(rest);
  if (chordMatch) {
    const chord = parseChord(chordMatch[2]);
    if (!chord || chord.duration) {
      return null;
    }

    const start = offset + chordMatch[1].length;

    return {
      start,
      end: start + chordMatch[2].length,
      text: formatChord({ ...chord, duration: spec.duration, dots: spec.dots }),
    };
  }

  const match = /^(\s*)(\S+)/.exec(rest);
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

/**
 * Replaces a whole note or chord (or deletes it, when replacement is null).
 * old is the duration it had, after the duration that follows it.
 */
function replaceToken(
  text: string,
  range: TextRange,
  replacement: string | null,
  old: DurationSpec,
  after: DurationSpec,
): NoteEditResult {
  let editEnd = range.end;
  if (replacement === null && /[ \t]/.test(text[range.end] || "")) {
    editEnd = range.end + 1;
  }

  const edits: TextEdit[] = [
    {
      start: range.start,
      end: editEnd,
      text: replacement === null ? "" : replacement,
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
    selection:
      replacement === null
        ? null
        : { start: range.start, end: range.start + replacement.length },
  };
}

function applyChordAccidental(
  text: string,
  range: TextRange,
  accidental: Accidental,
  pitch: TextRange | null | undefined,
): NoteEditResult | null {
  if (!pitch || pitch.start < range.start || pitch.end > range.end) {
    return null;
  }

  const parsed = parseNote(text.slice(pitch.start, pitch.end));
  if (!parsed) {
    return null;
  }

  const updated = formatNote(applyAccidental(parsed, accidental));
  const delta = updated.length - (pitch.end - pitch.start);

  return {
    edits: [{ start: pitch.start, end: pitch.end, text: updated }],
    selection: { start: range.start, end: range.end + delta },
  };
}

/**
 * Removes one pitch from a chord, together with one neighbouring space.
 */
function removeChordPitch(
  text: string,
  range: TextRange,
  pitch: TextRange,
): NoteEditResult {
  let removeStart = pitch.start;
  let removeEnd = pitch.end;
  if (/[ \t]/.test(text[removeEnd] || "")) {
    removeEnd += 1;
  } else if (/[ \t]/.test(text[removeStart - 1] || "")) {
    removeStart -= 1;
  }

  return {
    edits: [{ start: removeStart, end: removeEnd, text: "" }],
    selection: {
      start: range.start,
      end: range.end - (removeEnd - removeStart),
    },
  };
}

export function applyNoteAction(
  text: string,
  start: number,
  end: number,
  action: NoteAction,
): NoteEditResult | null {
  const range: TextRange = { start, end };
  const raw = text.slice(start, end);
  const chord = parseChord(raw);
  const note = chord ? null : parseNote(raw);
  const written = chord || note;
  if (!written) {
    return null;
  }

  const before = effectiveDuration(text.slice(0, start));
  const old: DurationSpec = written.duration
    ? { duration: written.duration, dots: written.dots }
    : before;

  const withDuration = (spec: DurationSpec): string => {
    if (chord) {
      return formatChord({ ...chord, ...spec });
    }
    if (note) {
      return formatNote({ ...note, ...spec });
    }

    return raw;
  };

  switch (action.type) {
    case "duration": {
      const spec = { duration: action.value, dots: old.dots };

      return replaceToken(text, range, withDuration(spec), old, spec);
    }
    case "dots": {
      const spec = {
        duration: old.duration,
        dots: ".".repeat((old.dots.length + 1) % 4),
      };

      return replaceToken(text, range, withDuration(spec), old, spec);
    }
    case "accidental": {
      if (chord) {
        return applyChordAccidental(text, range, action.value, action.pitch);
      }
      if (!note) {
        return null;
      }

      return replaceToken(
        text,
        range,
        formatNote(applyAccidental(note, action.value)),
        old,
        old,
      );
    }
    case "rest": {
      const rest = formatNote({
        pitch: "r",
        octave: "",
        forced: "",
        duration: written.duration,
        dots: written.dots,
        suffix: written.suffix,
      });

      return replaceToken(text, range, rest, old, old);
    }
    case "delete": {
      if (chord && action.pitch) {
        const pitches = chord.inner.split(/\s+/).filter(Boolean);
        if (pitches.length > 1) {
          return removeChordPitch(text, range, action.pitch);
        }
      }

      return replaceToken(text, range, null, old, before);
    }
    default:
      return null;
  }
}
