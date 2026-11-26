// SPDX-License-Identifier: AGPL-3.0-or-later

import { Trash2 } from "lucide-react";
import React from "react";

import { Button } from "#/components/ui/button";
import type { Accidental, NoteAction, NoteInfo } from "#/lib/noteEdit";
import { cn } from "#/lib/utils";

const DURATIONS: Array<{ value: string; title: string }> = [
  { value: "1", title: "Whole note" },
  { value: "2", title: "Half note" },
  { value: "4", title: "Quarter note" },
  { value: "8", title: "Eighth note" },
  { value: "16", title: "16th note" },
  { value: "32", title: "32nd note" },
];

const ACCIDENTALS: Array<{
  value: Accidental;
  label: string;
  title: string;
}> = [
  { value: "flat", label: "\u266d", title: "Flat" },
  { value: "natural", label: "\u266e", title: "Natural" },
  { value: "sharp", label: "\u266f", title: "Sharp" },
];

interface Props {
  note: NoteInfo;
  onAction(action: NoteAction): void;
}

/**
 * Floating toolbar for the note that is selected in the editor. Every button
 * rewrites that note's text in the LilyPond source.
 */
export default function NoteToolbar({ note, onAction }: Props): JSX.Element {
  // Keep the focus (and the selection) in the editor when clicking a button.
  const keepFocus = (ev: React.MouseEvent): void => {
    ev.preventDefault();
  };

  return (
    <div
      className={cn(
        "absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center",
        "gap-1 rounded-md border bg-background p-1 shadow-lg",
      )}
      onMouseDown={keepFocus}
    >
      {DURATIONS.map((item) => (
        <Button
          key={item.value}
          variant={note.duration === item.value ? "default" : "outline"}
          className="h-7 min-w-7 px-2"
          title={item.title}
          onClick={() => onAction({ type: "duration", value: item.value })}
        >
          {item.value}
        </Button>
      ))}
      <Button
        variant={note.dots.length > 0 ? "default" : "outline"}
        className="h-7 min-w-7 px-2"
        title="Dots (cycles 0 to 3)"
        onClick={() => onAction({ type: "dots" })}
      >
        {"."}
      </Button>
      {ACCIDENTALS.map((item) => (
        <Button
          key={item.value}
          variant={note.accidental === item.value ? "default" : "outline"}
          className="h-7 min-w-7 px-2"
          title={item.title}
          disabled={note.isRest}
          onClick={() => onAction({ type: "accidental", value: item.value })}
        >
          {item.label}
        </Button>
      ))}
      <Button
        variant={note.isRest ? "default" : "outline"}
        className="h-7 px-2"
        title="Make this note a rest"
        disabled={note.isRest}
        onClick={() => onAction({ type: "rest" })}
      >
        Rest
      </Button>
      <Button
        variant="outline"
        className="h-7 min-w-7 px-2"
        title="Delete note"
        onClick={() => onAction({ type: "delete" })}
      >
        <Trash2 size="1em" className="inline" />
      </Button>
    </div>
  );
}
