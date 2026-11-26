// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Turns what the user typed (a short path or a github.com link) into a public
 * file on GitHub. Only public repositories are supported, so there is no login.
 */

export interface GitHubSongRef {
  owner: string;
  repo: string;
  path: string;

  /** The branch from a github.com link, or null for the default branch. */
  branch: string | null;
}

export type GitHubRefResult =
  | { ok: true; ref: GitHubSongRef }
  | { ok: false; error: string };

const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;
const BRANCH_RE = /^[A-Za-z0-9._-]{1,100}$/;
const SEGMENT_RE = /^[A-Za-z0-9._()+,@=~-]+$/;
const SONG_EXTENSION_RE = /\.(ly|ily)$/i;

const URL_PATTERNS: RegExp[] = [
  /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/([^/]+)\/(.+)$/i,
  /^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i,
];

const USAGE =
  "Use the form owner/repo/path/to/song.ly, or paste a github.com link to the file.";

function fail(error: string): GitHubRefResult {
  return { ok: false, error };
}

export function parseGitHubSongRef(input: string): GitHubRefResult {
  const text = input.trim();
  if (!text) {
    return fail(USAGE);
  }
  if (text.length > 300) {
    return fail("That is too long to be a GitHub file.");
  }

  let owner = "";
  let repo = "";
  let branch: string | null = null;
  let path = "";

  let isUrl = false;
  for (const pattern of URL_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      owner = match[1];
      repo = match[2];
      branch = match[3];
      path = match[4].replace(/[?#].*$/, "");
      isUrl = true;
      break;
    }
  }

  if (!isUrl) {
    const parts = text.split("/");
    if (parts.length < 3) {
      return fail(USAGE);
    }
    owner = parts[0];
    repo = parts[1];
    path = parts.slice(2).join("/");
  }

  try {
    path = decodeURIComponent(path);
  } catch (_err) {
    return fail("The file path contains invalid characters.");
  }

  if (!OWNER_RE.test(owner)) {
    return fail("That does not look like a GitHub user or organisation.");
  }
  if (!REPO_RE.test(repo) || repo === "." || repo === "..") {
    return fail("That does not look like a repository name.");
  }
  if (branch !== null && !BRANCH_RE.test(branch)) {
    return fail(
      "Branch names with unusual characters are not supported. Use owner/repo/path/to/song.ly instead.",
    );
  }

  const segments = path.split("/");
  const pathIsSafe = segments.every(
    (segment) =>
      segment !== "." && segment !== ".." && SEGMENT_RE.test(segment),
  );
  if (!pathIsSafe) {
    return fail("The file path contains characters that are not supported.");
  }
  if (!SONG_EXTENSION_RE.test(path)) {
    return fail("Only .ly and .ily files can be opened.");
  }

  return { ok: true, ref: { owner, repo, path, branch } };
}

/**
 * Where the file can be downloaded from. HEAD is the default branch.
 */
export function rawGitHubUrl(ref: GitHubSongRef): string {
  return `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${ref.branch || "HEAD"}/${ref.path}`;
}
