// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2017-present Jocelyn Stericker <jocelyn@nettek.ca>

import {
  CirclePlus,
  Code,
  Download,
  FileText,
  FolderOpen,
  Import,
  Music,
  Save,
} from "lucide-react";
import React from "react";

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "#/components/ui/dropdown-menu.tsx";
import type { Auth } from "#/lib/auth";

interface Props {
  canCreateNew: boolean;
  canExport: boolean;
  songURL: string | null;
  onExportLy(): any;
  onExportMIDI(): any;
  onExportPDF(): any;
  onShowAbout(): void;
  onShowOpen(): void;
  onShowNew(): void;

  // <Header /> still passes these. They are not used any more, and go away
  // with the rest of the login code.
  auth?: Auth | null;
  canSave?: boolean;
  canSaveAs?: boolean;
  onDeleteSong?(song: string): void;
  onLoadSong?(song: string): void;
  onShowClone?(): void;
  onShowPublish?(): void;
  onSignIn?(): void;
  onSignOut?(): void;
}

/**
 * Renders the File menu.
 * The menu button is rendered by <Header />
 */
const FileMenu: React.FC<Props> = React.memo(function FileMenu(props) {
  const {
    canCreateNew,
    canExport,
    onShowAbout,
    onShowOpen,
    onExportLy,
    onExportMIDI,
    onExportPDF,
    onShowNew,
    songURL,
  } = props;

  const tutorial: React.ReactNode = (
    <DropdownMenuItem
      onClick={() =>
        window.open(
          `http://lilypond.org/doc/v${
            process.env.REACT_APP_STABLE_LILYPOND_VERSION?.split(".")
              .slice(0, 2)
              .join(".") ?? "2.26"
          }/Documentation/learning/index`,
          "_blank",
          "noopener noreferrer",
        )
      }
    >
      LilyPond manual&hellip;
    </DropdownMenuItem>
  );

  const about: React.ReactNode = (
    <DropdownMenuItem onClick={onShowAbout}>About Hacklily</DropdownMenuItem>
  );

  return (
    <>
      <DropdownMenuItem onClick={onShowNew} disabled={!canCreateNew}>
        <CirclePlus size="1em" className="inline" />
        New song
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onShowOpen}>
        <FolderOpen size="1em" className="inline" />
        Open&hellip;
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => window.open("/musicxml2ly", "_self")}>
        <Import size="1em" className="inline" />
        Import MusicXML&hellip;
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onExportLy}>
        <Save size="1em" className="inline" />
        Save (.ly file)
      </DropdownMenuItem>
      <DropdownMenuSub disabled={!canExport}>
        <DropdownMenuSubTrigger>
          <Download size="1em" className="inline" />
          Export
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onClick={onExportLy} disabled={!canExport}>
            <Code size="1em" className="inline" />
            LilyPond source
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPDF} disabled={!canExport}>
            <FileText size="1em" className="inline" />
            PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportMIDI} disabled={!canExport}>
            <Music size="1em" className="inline" />
            MIDI
          </DropdownMenuItem>
          {songURL && <DropdownMenuSeparator />}
          {songURL && (
            <DropdownMenuItem
              onClick={() =>
                window.open(songURL.replace(/\.ly$/, ".pdf"), "_blank")
              }
            >
              View on GitHub&hellip;
            </DropdownMenuItem>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      {tutorial}
      {about}
    </>
  );
});

export default FileMenu;
