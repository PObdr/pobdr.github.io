// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2019-present Jocelyn Stericker <jocelyn@nettek.ca>

import { useNavigate } from "@tanstack/react-router";
import { Loader2, Upload } from "lucide-react";
import React from "react";

import { Button } from "#/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#/components/ui/tabs.tsx";
import type { GitHubSongRef } from "#/lib/githubSongRef";
import { parseGitHubSongRef, rawGitHubUrl } from "#/lib/githubSongRef";
import type { SourceResult } from "#/lib/localSong";
import {
  checkFileMeta,
  decodeSource,
  findIncludes,
  MAX_SOURCE_BYTES,
} from "#/lib/localSong";
import type { Song } from "#/lib/localStorage";
import { editSong, getDirtySongs } from "#/lib/localStorage";
import { cn } from "#/lib/utils";

interface Props {
  onHide(): void;
}

/**
 * Puts a song that was read from outside the app into the editor.
 *
 * It becomes the song of the sandbox (the one that is kept in localStorage),
 * and the address is cleared, so a song that was opened by its link is
 * replaced. Returns false when the user decides not to replace their work.
 */
function useImportSong(onHide: () => void): (src: string) => Promise<boolean> {
  const navigate = useNavigate();

  return React.useCallback(
    async (src: string): Promise<boolean> => {
      const includes = findIncludes(src);
      if (
        includes.length > 0 &&
        !confirm(
          `This song includes other files (${includes.join(", ")}). Files that are not part of LilyPond cannot be loaded here, so the preview may show errors. Open it anyway?`,
        )
      ) {
        return false;
      }

      const current = getDirtySongs()["null"] as Song | undefined;
      if (
        current &&
        current.src !== src &&
        !confirm("This replaces the song you are editing now. Continue?")
      ) {
        return false;
      }

      editSong("null", { baseSHA: null, src });
      await navigate({ to: ".", search: {}, hash: "" } as any);
      onHide();

      return true;
    },
    [navigate, onHide],
  );
}

async function fetchGitHubSource(ref: GitHubSongRef): Promise<SourceResult> {
  let response: Response;
  try {
    response = await fetch(rawGitHubUrl(ref));
  } catch (_err) {
    return { ok: false, error: "Could not reach GitHub. Check your connection." };
  }

  if (response.status === 404) {
    return {
      ok: false,
      error:
        "File not found. Check the name. Only public repositories can be opened.",
    };
  }
  if (!response.ok) {
    return { ok: false, error: `GitHub answered with status ${response.status}.` };
  }

  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_SOURCE_BYTES) {
    return { ok: false, error: checkFileMeta(ref.path, length) || "Too large." };
  }

  try {
    return decodeSource(await response.arrayBuffer());
  } catch (_err) {
    return { ok: false, error: "Could not read the file from GitHub." };
  }
}

function ComputerOpen({ onHide }: { onHide(): void }): JSX.Element {
  const importSong = useImportSong(onHide);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const openFile = async (file: File): Promise<void> => {
    setError(null);

    const metaError = checkFileMeta(file.name, file.size);
    if (metaError) {
      setError(metaError);

      return;
    }

    let result: SourceResult;
    try {
      result = decodeSource(await file.arrayBuffer());
    } catch (_err) {
      setError("Could not read the file.");

      return;
    }
    if (!result.ok) {
      setError(result.error);

      return;
    }

    await importSong(result.src);
  };

  const handleChange = (ev: React.ChangeEvent<HTMLInputElement>): void => {
    const file = ev.target.files?.[0];
    // Allow choosing the same file again.
    ev.target.value = "";
    if (file) {
      void openFile(file);
    }
  };

  const handleDrop = (ev: React.DragEvent<HTMLDivElement>): void => {
    ev.preventDefault();
    setDragging(false);

    const files = ev.dataTransfer.files;
    if (files.length > 1) {
      setError("Drop one file at a time.");

      return;
    }
    if (files[0]) {
      void openFile(files[0]);
    }
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center gap-3 rounded-md",
        "border-2 border-dashed p-6 text-center text-sm",
        dragging && "bg-muted",
      )}
      onDragOver={(ev) => {
        ev.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".ly,.ily,.txt,text/plain"
        className="hidden"
        onChange={handleChange}
      />
      <Upload size="2em" className="inline" />
      <div>Drop a .ly file here, or</div>
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        Choose a file&hellip;
      </Button>
      <div className="text-muted-foreground">
        Text files up to {MAX_SOURCE_BYTES / 1024} kB. Use File &rarr; Save to
        get your song back as a .ly file.
      </div>
      {error && <div className="text-destructive">{error}</div>}
    </div>
  );
}

function GitHubOpen({ onHide }: { onHide(): void }): JSX.Element {
  const importSong = useImportSong(onHide);
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (ev: React.FormEvent): Promise<void> => {
    ev.preventDefault();
    setError(null);

    const parsed = parseGitHubSongRef(value);
    if (!parsed.ok) {
      setError(parsed.error);

      return;
    }

    setLoading(true);
    try {
      const result = await fetchGitHubSource(parsed.ref);
      if (!result.ok) {
        setError(result.error);

        return;
      }
      await importSong(result.src);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="flex h-full flex-col gap-3 text-sm"
      onSubmit={(ev) => void handleSubmit(ev)}
    >
      <label htmlFor="github-song">Public file on GitHub</label>
      <input
        id="github-song"
        type="text"
        value={value}
        placeholder="owner/repo/path/to/song.ly"
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        onChange={(ev) => setValue(ev.target.value)}
      />
      <div className="text-muted-foreground">
        You can also paste a github.com link to the file. It is opened as your
        own copy, from the default branch unless the link names another one.
        Private repositories are not supported.
      </div>
      <div>
        <Button type="submit" disabled={loading || value.trim() === ""}>
          {loading && <Loader2 className="animate-spin size-4" />}
          Open
        </Button>
      </div>
      {error && <div className="text-destructive">{error}</div>}
    </form>
  );
}

/**
 * The dialog you see when you choose File → Open. A song comes from a file on
 * the computer or from a public file on GitHub, and replaces the song in the
 * editor.
 */
class ModalOpen extends React.PureComponent<Props, {}> {
  render(): JSX.Element {
    const { onHide } = this.props;

    return (
      <Dialog open={true} onOpenChange={(open) => !open && onHide()}>
        <DialogContent className="sm:max-w-[565px]">
          <DialogHeader>
            <DialogTitle>Open song</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="computer" orientation="vertical">
            <TabsList className="flex-col w-fit">
              <TabsTrigger value="computer">Computer</TabsTrigger>
              <TabsTrigger value="github">GitHub</TabsTrigger>
            </TabsList>
            <TabsContent value="computer" className="flex-1 h-[300px]">
              <ComputerOpen onHide={onHide} />
            </TabsContent>
            <TabsContent value="github" className="flex-1 h-[300px]">
              <GitHubOpen onHide={onHide} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  }
}

export default ModalOpen;
