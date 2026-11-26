// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";

import { parseGitHubSongRef, rawGitHubUrl } from "./githubSongRef";

describe("parseGitHubSongRef", () => {
  it("reads owner/repo/path", () => {
    expect(parseGitHubSongRef(" PObdr/songs/tunes/a.ly ")).toEqual({
      ok: true,
      ref: { owner: "PObdr", repo: "songs", path: "tunes/a.ly", branch: null },
    });
  });

  it("reads a github.com link and ignores the query", () => {
    const result = parseGitHubSongRef(
      "https://github.com/PObdr/songs/blob/main/tunes/a.ly?plain=1",
    );
    expect(result).toEqual({
      ok: true,
      ref: { owner: "PObdr", repo: "songs", path: "tunes/a.ly", branch: "main" },
    });
  });

  it("reads a raw.githubusercontent.com link", () => {
    const result = parseGitHubSongRef(
      "https://raw.githubusercontent.com/PObdr/songs/main/a.ily",
    );
    expect(result).toEqual({
      ok: true,
      ref: { owner: "PObdr", repo: "songs", path: "a.ily", branch: "main" },
    });
  });

  it("rejects input that is not a file", () => {
    expect(parseGitHubSongRef("").ok).toBe(false);
    expect(parseGitHubSongRef("PObdr/songs").ok).toBe(false);
    expect(parseGitHubSongRef("PObdr/songs/readme.md").ok).toBe(false);
  });

  it("rejects unsafe paths and names", () => {
    expect(parseGitHubSongRef("PObdr/songs/../a.ly").ok).toBe(false);
    expect(parseGitHubSongRef("PObdr/songs/my song.ly").ok).toBe(false);
    expect(parseGitHubSongRef("-bad/songs/a.ly").ok).toBe(false);
    expect(parseGitHubSongRef("PObdr/songs/a%2F..%2Fb.ly").ok).toBe(false);
    expect(parseGitHubSongRef(`PObdr/songs/${"a".repeat(300)}.ly`).ok).toBe(
      false,
    );
  });
});

describe("rawGitHubUrl", () => {
  it("uses the default branch when no branch is given", () => {
    const ref = { owner: "PObdr", repo: "songs", path: "a.ly", branch: null };
    expect(rawGitHubUrl(ref)).toBe(
      "https://raw.githubusercontent.com/PObdr/songs/HEAD/a.ly",
    );
  });

  it("uses the branch of a link", () => {
    const ref = { owner: "PObdr", repo: "songs", path: "a.ly", branch: "dev" };
    expect(rawGitHubUrl(ref)).toBe(
      "https://raw.githubusercontent.com/PObdr/songs/dev/a.ly",
    );
  });
});
