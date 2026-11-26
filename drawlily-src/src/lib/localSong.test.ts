// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";

import {
  checkFileMeta,
  decodeSource,
  findIncludes,
  MAX_SOURCE_BYTES,
  normalizeNewlines,
} from "./localSong";

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe("checkFileMeta", () => {
  it("accepts LilyPond and text files", () => {
    expect(checkFileMeta("song.ly", 100)).toBeNull();
    expect(checkFileMeta("song.ily", 100)).toBeNull();
    expect(checkFileMeta("notes.txt", 100)).toBeNull();
    expect(checkFileMeta("SONG.LY", 100)).toBeNull();
  });

  it("rejects other file types", () => {
    expect(checkFileMeta("song.pdf", 100)).toContain("Only");
    expect(checkFileMeta("song", 100)).toContain("Only");
  });

  it("rejects empty and huge files", () => {
    expect(checkFileMeta("song.ly", 0)).toContain("empty");
    expect(checkFileMeta("song.ly", MAX_SOURCE_BYTES + 1)).toContain(
      "too large",
    );
    expect(checkFileMeta("song.ly", MAX_SOURCE_BYTES)).toBeNull();
  });
});

describe("normalizeNewlines", () => {
  it("turns every line break into a line feed", () => {
    expect(normalizeNewlines("a\r\nb\rc\nd")).toBe("a\nb\nc\nd");
  });
});

describe("decodeSource", () => {
  it("decodes UTF-8 and normalizes line breaks", () => {
    const result = decodeSource(bytes('\\version "2.26.0"\r\n{ c4 }\r\n'));
    expect(result).toEqual({ ok: true, src: '\\version "2.26.0"\n{ c4 }\n' });
  });

  it("keeps non-ASCII characters", () => {
    const result = decodeSource(bytes('title = "\u010cesk\u00e1 p\u00edse\u0148"'));
    expect(result).toEqual({ ok: true, src: 'title = "\u010cesk\u00e1 p\u00edse\u0148"' });
  });

  it("removes a byte order mark", () => {
    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...bytes("{ c4 }")]);
    expect(decodeSource(withBom)).toEqual({ ok: true, src: "{ c4 }" });
  });

  it("rejects text that is not UTF-8", () => {
    const result = decodeSource(new Uint8Array([0xff, 0xfe, 0xfd, 0x41]));
    expect(result.ok).toBe(false);
  });

  it("rejects binary files", () => {
    const result = decodeSource(bytes("a\u0000b"));
    expect(result).toEqual({ ok: false, error: "The file is not a text file." });
  });

  it("rejects empty, blank and huge files", () => {
    expect(decodeSource(new Uint8Array(0)).ok).toBe(false);
    expect(decodeSource(bytes(" \n\t\n")).ok).toBe(false);
    expect(decodeSource(new Uint8Array(MAX_SOURCE_BYTES + 1)).ok).toBe(false);
  });
});

describe("findIncludes", () => {
  it("lists each included file once and skips comments", () => {
    const src = [
      '\\include "a.ly"',
      '% \\include "b.ly"',
      '\\include  "c/d.ily"',
      '\\include "a.ly"',
    ].join("\n");
    expect(findIncludes(src)).toEqual(["a.ly", "c/d.ily"]);
  });

  it("returns nothing for a song without includes", () => {
    expect(findIncludes("{ c4 d e f }")).toEqual([]);
  });
});
