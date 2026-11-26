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
  { value: "doubleFlat", label: "\u266d\u266d", title: "Double flat (eses)" },
  { value: "flat", label: "\u266d", title: "Flat (es)" },
  { value: "natural", label: "\u266e", title: "Natural" },
  { value: "sharp", label: "\u266f", title: "Sharp (is)" },
  { value: "doubleSharp", label: "\u266f\u266f", title: "Double sharp (isis)" },
];

interface Props {
  note: NoteInfo;
  onAction(action: NoteAction): void;
}

/**
 * Floating toolbar for the note or chord that is selected in the editor.
 * Every button rewrites that note's text in the LilyPond source.
 *
 * In a chord, the duration, dots and rest buttons change the whole chord. The
 * accidental buttons and the delete button work on the selected pitch, so a
 * pitch has to be selected (e.g. by clicking its notehead in the preview).
 */
export default function NoteToolbar({ note, onAction }: Props): JSX.Element {
  // Keep the focus (and the selection) in the editor when clicking a button.
  const keepFocus = (ev: React.MouseEvent): void => {
    ev.preventDefault();
  };

  const needsPitch = note.isChord && note.pitch === null;

  return (
    <div
      className={cn(
        "absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center",
        "gap-1 rounded-md border bg-background p-1 shadow-lg",
      )}
      onMouseDown={keepFocus}
    >
      {note.isChord && (
        <span className="px-1 text-xs text-muted-foreground">Chord</span>
      )}
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
          title={
            needsPitch
              ? `${item.title} (click a notehead of the chord first)`
              : item.title
          }
          disabled={note.isRest || needsPitch}
          onClick={() =>
            onAction({
              type: "accidental",
              value: item.value,
              pitch: note.pitch,
            })
          }
        >
          {item.label}
        </Button>
      ))}
      <Button
        variant={note.isRest ? "default" : "outline"}
        className="h-7 px-2"
        title={note.isChord ? "Make this chord a rest" : "Make this note a rest"}
        disabled={note.isRest}
        onClick={() => onAction({ type: "rest" })}
      >
        Rest
      </Button>
      <Button
        variant="outline"
        className="h-7 min-w-7 px-2"
        title={
          note.isChord && note.pitch && note.pitchCount > 1
            ? "Delete the selected pitch"
            : note.isChord
              ? "Delete the chord"
              : "Delete note"
        }
        onClick={() => onAction({ type: "delete", pitch: note.pitch })}
      >
        <Trash2 size="1em" className="inline" />
      </Button>
    </div>
  );
}
