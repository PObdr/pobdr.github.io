// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Checks for song files that come from outside the app, i.e. files chosen on
 * the computer or downloaded from GitHub. Nothing here touches the DOM, so it
 * can be tested without a browser.
 */

/**
 * Largest song we accept. A real score is a few kilobytes, so this is generous,
 * but it keeps a wrong file from freezing the editor and the preview.
 */
export const MAX_SOURCE_BYTES = 512 * 1024;

const ALLOWED_EXTENSIONS = [".ly", ".ily", ".txt"];

export type SourceResult =
  | { ok: true; src: string }
  | { ok: false; error: string };

function fail(error: string): SourceResult {
  return { ok: false, error };
}

/**
 * Checks what is known before the file is read: the name and the size.
 * Returns a message for the user, or null if the file may be read.
 */
export function checkFileMeta(name: string, size: number): string | null {
  const lower = name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((extension) => lower.endsWith(extension))) {
    return "Only .ly, .ily and .txt files can be opened.";
  }
  if (size === 0) {
    return "The file is empty.";
  }
  if (size > MAX_SOURCE_BYTES) {
    return `The file is too large (${Math.round(size / 1024)} kB). The limit is ${MAX_SOURCE_BYTES / 1024} kB.`;
  }

  return null;
}

/**
 * Uses \n for line breaks. Otherwise the line numbers of the point-and-click
 * links would not match the editor.
 */
export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

/**
 * Turns the bytes of a file into the song source.
 *
 * The file must be valid UTF-8 text. A byte order mark is removed, and a file
 * with null bytes (so, not text) is rejected.
 */
export function decodeSource(buffer: BufferSource): SourceResult {
  if (buffer.byteLength === 0) {
    return fail("The file is empty.");
  }
  if (buffer.byteLength > MAX_SOURCE_BYTES) {
    return fail(
      `The file is too large (${Math.round(buffer.byteLength / 1024)} kB). The limit is ${MAX_SOURCE_BYTES / 1024} kB.`,
    );
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch (_err) {
    return fail("The file is not valid UTF-8 text.");
  }

  if (text.includes("\u0000")) {
    return fail("The file is not a text file.");
  }

  const src = normalizeNewlines(text);
  if (src.trim() === "") {
    return fail("The file has no content.");
  }

  return { ok: true, src };
}

/**
 * The files a song pulls in with \include. They cannot be loaded here, so the
 * preview may show errors for them. Includes in comments are ignored.
 */
export function findIncludes(src: string): string[] {
  const withoutComments = src
    .split("\n")
    .map((line) => line.replace(/%.*$/, ""))
    .join("\n");

  const names = new Set<string>();
  const re = /\\include\s+"([^"]*)"/g;
  for (let m = re.exec(withoutComments); m; m = re.exec(withoutComments)) {
    names.add(m[1]);
  }

  return Array.from(names);
}
