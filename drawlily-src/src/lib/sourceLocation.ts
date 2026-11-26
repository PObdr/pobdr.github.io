// SPDX-License-Identifier: AGPL-3.0-or-later

import { findTokenRange, parseNote } from "./noteEdit";

/**
 * Location parsed from a LilyPond point-and-click link, e.g.
 * `textedit:///tmp/hacklily.ly:12:4:5`. Lines are 1-based, columns 0-based.
 */
export interface TextEditLocation {
  line: number;
  startColumn: number;
  endColumn: number;
}

/**
 * A selection in Monaco coordinates (1-based lines and columns).
 */
export interface SourceSelection {
  selectionStartLineNumber: number;
  selectionStartColumn: number;
  positionLineNumber: number;
  positionColumn: number;
}

const TEXTEDIT_RE = /\.ly:(\d+):(\d+)(?::(\d+))?$/;

export function parseTextEditLink(link: string): TextEditLocation | null {
  const match = TEXTEDIT_RE.exec(link);
  if (!match) {
    return null;
  }

  const startColumn = parseInt(match[2], 10);
  const endColumn = match[3] ? parseInt(match[3], 10) : startColumn;

  return {
    line: parseInt(match[1], 10),
    startColumn,
    endColumn,
  };
}

/**
 * Finds the note that starts at a column of a line. A pitch inside a chord
 * (e.g. the e' in `<c' e' g'>4`) counts as a note, without the angle brackets
 * and the duration of the chord.
 */
function noteTokenAt(
  lineText: string,
  column: number,
): { start: number; end: number } | null {
  const range = findTokenRange(lineText, column, column);
  if (!range) {
    return null;
  }

  let start = range.start;
  let end = range.end;

  if (lineText[start] === "<" && lineText[start + 1] !== "<") {
    if (column === start) {
      return null;
    }
    start += 1;
  }

  const closing = lineText.indexOf(">", start);
  if (closing >= 0 && closing < end) {
    end = closing;
  }

  if (start !== column || end <= start) {
    return null;
  }
  if (!parseNote(lineText.slice(start, end))) {
    return null;
  }

  return { start, end };
}

/**
 * Converts a point-and-click location to a Monaco selection.
 *
 * The server renderer adds one line before the user's code, the wasm renderer
 * does not. lineOffset is the number of added lines, which is the expected
 * case. If the expected line does not contain a note at that column but a
 * neighbouring line does, the neighbouring line wins, so a wrong guess does
 * not move the cursor to the wrong place.
 */
export function locationToSelection(
  code: string,
  location: TextEditLocation,
  lineOffset: number,
): SourceSelection {
  const lines = code.split("\n");
  const expected = location.line - lineOffset;
  const candidates = [expected, expected - 1, expected + 1];

  let line = expected;
  let token: { start: number; end: number } | null = null;
  for (const candidate of candidates) {
    const text = lines[candidate - 1];
    if (text === undefined) {
      continue;
    }

    const found = noteTokenAt(text, location.startColumn);
    if (found) {
      line = candidate;
      token = found;
      break;
    }
  }

  const start = location.startColumn;
  const end = token ? token.end : Math.max(location.endColumn, start + 1);

  return {
    selectionStartLineNumber: line,
    selectionStartColumn: start + 1,
    positionLineNumber: line,
    positionColumn: end + 1,
  };
}
