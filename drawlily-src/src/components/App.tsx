// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2017-present Jocelyn Stericker <jocelyn@nettek.ca>

import { TriangleAlert } from "lucide-react";
import type * as monacoEditor from "monaco-editor";
import React from "react";

import type Makelily from "#/components/Makelily";
import { initAnalytics, track, trackPageview } from "#/lib/analytics";
import { parseGitHubSongRef, rawGitHubUrl } from "#/lib/githubSongRef";
import { renderVersionFor } from "#/lib/lilypondVersion";
import type { Song } from "#/lib/localStorage";
import RPCClient from "#/lib/RPCClient";
import RpcSvgRenderer from "#/lib/RpcSvgRenderer";
import type { SvgRenderer } from "#/lib/SvgRenderer";
import { cn } from "#/lib/utils";
import WasmRenderer from "#/lib/WasmRenderer";

import Editor from "./Editor";
import type { ViewMode } from "./Header";
import Header, { MIN_BOTH_WIDTH, MODE_BOTH, MODE_VIEW } from "./Header";
import Modal404 from "./Modal404";
import ModalAbout from "./ModalAbout";
import ModalLocked, {
  lock,
  setEditingNotificationHandler,
} from "./ModalLocked";
import ModalOpen from "./ModalOpen";
import ModalUnsavedChangesInterstitial from "./ModalUnsavedChangesInterstitial";
import Preview from "./Preview";
import { APP_STYLE } from "./styles";

const INITIAL_WS_COOLOFF = 2;
const BACKEND_WS_URL: string | undefined = process.env.REACT_APP_BACKEND_WS_URL;
const PUBLIC_READONLY = "PUBLIC_READONLY";

/**
 * Properties derived from URL.
 *
 * e.g., https://www.hacklily.org/?edit=hacklily/user-emilyskidsister/test.ly =>
 *   {
 *     edit: 'hacklily/user-emilyskidsister/test.ly',
 *   }
 *
 * NOTE: When you add a key here, also add it to QUERY_PROP_KEYS below.
 */
export interface QueryProps {
  /**
   * Truthy if this was redirected from a 404 page.
   */
  "404"?: string;

  /*
   * Truthy if we should show the about page.
   */
  about?: string;

  /**
   * The song being edited, with the following format:
   *
   *   `${org}/${repo}/${song}.ly`
   *
   * If it is undefined, Hacklily will act as a sandbox.
   */
  edit?: string;

  /**
   * When set, open a read-only sandbox with this code.
   * Takes precedence over "edit".
   */
  src?: string;
}

export const QUERY_PROP_KEYS: Array<keyof QueryProps> = [
  "404",
  "about",
  "edit",
  "src",
];

interface Props extends QueryProps {
  /**
   * Based on media query.
   */
  colourScheme: "dark" | "light";

  /**
   * From localStorage, all songs that have changes not pushed to GitHub.
   */
  dirtySongs: { [key: string]: Song };

  /**
   * True if the warning that is shown when unstable LilyPond is used should be shown.
   */
  hideUnstableNotification: boolean;

  /**
   * Mark a song as dirty and store it in localStorage.
   */
  editSong(songID: string, song: Song): void;

  /**
   * Remove a song from dirtySongs. This can be either because the song is now
   * clean, or because the local changes have been discarded. Updates localStorage.
   */
  markSongClean(song: string): void;

  /**
   * Sets whether the warning that is shown when LilyPond 2.23 is used should be shown.
   */
  setHideUnstableNotification(hideUnstableNotification: boolean): void;

  /**
   * Updates a field in the URL query.
   */
  setQuery<K extends keyof QueryProps>(
    updates: Pick<QueryProps, K>,
    replaceState?: boolean,
  ): void;

  /**
   * Which renderer backs the SVG preview. "server" uses the JSON-RPC WebSocket
   * (the historical path); "wasm" engraves locally in a lilypond-wasm Web
   * Worker, with the WebSocket still used for PDF.
   */
  variant: "server" | "wasm";
}

interface State {
  cleanSongs: { [key: string]: Song };
  defaultSelection: monacoEditor.ISelection | null;
  interstitialChanges: {} | null;

  /**
   * True if we started editing this song in another tab.
   */
  locked: boolean;
  logs: string | null;
  makelilyClef: string;
  makelilyKey: string;
  makelilySingleTaskMode: boolean;
  makelilyTime: string;
  makelilyTool: string;
  midi: ArrayBuffer | null;
  mode: ViewMode;
  pendingPreviews: number;
  reconnectCooloff: number;
  reconnectTimeout: number;
  rendererVersion: "stable" | "unstable";
  open: boolean;
  showMakelily: typeof Makelily | null;
  windowWidth: number;
  wsError: boolean;
  branch: string | null;

  /**
   * (wasm only) True once the lilypond-wasm worker has signaled ready. The
   * preview gates on this independently of the WebSocket on /wasm.
   */
  wasmReady: boolean;

  /**
   * (wasm only) Non-null when the worker has crashed and is being recycled;
   * cleared once it boots again.
   */
  wasmError: string | null;

  makelilyInsertCB?(ly: string): void;
}

const DEFAULT_SONG = `\\version "${
  process.env.REACT_APP_STABLE_LILYPOND_VERSION || "2.26.0"
}"

\\header {
  title = "Untitled"
  composer = "Composer"
}

\\score {
  \\relative c' {
    c4
  }

  \\layout {}
  \\midi {}
}`;

/**
 * Root component of Hacklily. This renders everything on the page.
 *
 * Receives props from the query (URL) as well as localStorage -- see index.tsx for how that works.
 */
export default class App extends React.PureComponent<Props, State> {
  state: State = {
    cleanSongs: {
      null: {
        baseSHA: null,
        src: DEFAULT_SONG,
      },
    },
    defaultSelection: null,
    interstitialChanges: null,
    locked: false,
    logs: "",
    makelilyClef: "treble",
    makelilyKey: "c \\major",
    makelilySingleTaskMode: true,
    makelilyTime: "4/4",
    makelilyTool: "notes",
    midi: null,
    mode: window.innerWidth >= MIN_BOTH_WIDTH ? MODE_BOTH : MODE_VIEW,
    pendingPreviews: 0,
    reconnectCooloff: INITIAL_WS_COOLOFF,
    reconnectTimeout: NaN,
    rendererVersion: "stable",
    open: false,
    showMakelily: null,
    windowWidth: window.innerWidth,
    wsError: false,
    branch: null,
    wasmReady: false,
    wasmError: null,
  };

  private editor: Editor | null = null;
  private rpc: RPCClient | null = null;
  private svgRenderer: SvgRenderer | null = null;
  private socket: WebSocket | null = null;

  componentDidMount(): void {
    initAnalytics();
    trackPageview("/", "Hacklily");
    // Fires once per real page load (this component instance persists across
    // the query-param navigation index.tsx does via history.pushState), so
    // this distinguishes "opened a specific song/snippet link" from starting
    // at a blank sandbox -- without recording which song or whose it is.
    if (this.props.edit) {
      track("load-link");
    } else if (this.props.src) {
      track("load-src");
    }
    window.addEventListener("resize", this.handleWindowResize);
    this.connectToWS();
    void this.fetchSong();
    lock(this.props.edit || "null");
    window.addEventListener("beforeunload", this.handleBeforeUnload);
    setEditingNotificationHandler(this.handleEditingNotification);

    if (this.props.variant === "wasm") {
      this.bootWasmRenderer();
    }
  }

  componentDidUpdate(prevProps: Props): void {
    if (this.props.edit !== prevProps.edit) {
      void this.fetchSong();
      lock(this.props.edit || "null");
    }
  }

  componentWillUnmount(): void {
    this.disconnectWS();
    this.destroyWasmRenderer();
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    window.addEventListener("resize", this.handleWindowResize);
    setEditingNotificationHandler(null);
  }

  private bootWasmRenderer = (): void => {
    if (this.svgRenderer) {
      return;
    }
    this.svgRenderer = new WasmRenderer({
      onReady: () => this.setState({ wasmReady: true, wasmError: null }),
      onCrash: (message: string) =>
        this.setState({ wasmReady: false, wasmError: message }),
    });
  };

  private destroyWasmRenderer = (): void => {
    if (this.svgRenderer instanceof WasmRenderer) {
      this.svgRenderer.destroy();
      this.svgRenderer = null;
    }
    this.setState({ wasmReady: false, wasmError: null });
  };

  render(): JSX.Element {
    const { logs, mode, midi, defaultSelection, rendererVersion, windowWidth } =
      this.state;

    const { edit, hideUnstableNotification } = this.props;

    const online: boolean = this.isOnline();
    const preview: React.ReactNode = this.renderPreview();
    const song: Song | undefined = this.song();
    const sandboxIsDirty: boolean =
      Boolean(this.props.edit || this.props.src) &&
      Boolean(this.props.dirtySongs.null);

    let songURL: string | null = null;
    if (this.props.edit && this.state.branch) {
      const songParts: string[] = this.props.edit.split("/");
      songURL = `https://github.com/${songParts[0]}/${songParts[1]}/blob/${
        this.state.branch
      }/${songParts.slice(2).join("/")}`;
    }

    const header: React.ReactNode = (
      <Header
        onShowAbout={this.handleShowHelp}
        mode={mode}
        midi={midi}
        onModeChanged={this.handleModeChanged}
        onShowMakelily={this.handleShowMakelily}
        onShowNew={this.handleShowNew}
        onShowOpen={this.handleShowOpen}
        sandboxIsDirty={sandboxIsDirty}
        song={this.props.src ? "untitled-import" : edit}
        isDirty={this.isDirty()}
        windowWidth={windowWidth}
        canExport={Boolean(logs && this.state.pendingPreviews === 0)}
        canExportPdf={Boolean(
          online && this.rpc && logs && this.state.pendingPreviews === 0,
        )}
        onExportLy={this.handleExportLy}
        onExportMIDI={this.handleExportMIDI}
        onExportPDF={this.handleExportPDF}
        songURL={songURL}
      />
    );

    return (
      <div className="App">
        {header}
        {this.renderModal()}
        <div className="content">
          <Editor
            ref={this.setEditor}
            variant={this.props.variant}
            code={song ? song.src : undefined}
            colourScheme={this.props.colourScheme}
            mode={mode}
            hideUnstableNotification={hideUnstableNotification}
            onSetCode={this.handleCodeChanged}
            onHideUnstableNotification={this.handleHideUnstableNotification}
            logs={logs}
            defaultSelection={defaultSelection}
            readOnly={song ? song.baseSHA === PUBLIC_READONLY : false}
            isImmutableSrc={Boolean(this.props.src)}
            showMakelily={this.handleShowMakelily}
            rendererVersion={rendererVersion}
          />
          {preview}
        </div>
      </div>
    );
  }

  private cancelInterstitial = (): void => {
    this.setState({
      interstitialChanges: null,
    });
  };

  private connectToWS(): void {
    if (!BACKEND_WS_URL) {
      this.setState({
        wsError: true,
      });

      return;
    }
    this.socket = new WebSocket(BACKEND_WS_URL);

    this.socket.addEventListener("open", this.handleWSOpen);
    this.socket.addEventListener("error", this.handleWSError);
    this.socket.addEventListener("close", this.handleWSError);
    this.forceUpdate();
  }

  private discardChanges = (): void => {
    if (!this.state.interstitialChanges) {
      throw new Error("Invariant violation");
    }
    const edit: string = this.props.edit || "null";
    this.props.markSongClean(edit);
    this.props.setQuery(this.state.interstitialChanges);
    this.setState({
      interstitialChanges: null,
    });
  };

  private disconnectWS(): void {
    if (this.socket) {
      this.socket.removeEventListener("open", this.handleWSOpen);
      this.socket.removeEventListener("error", this.handleWSError);
      this.socket.removeEventListener("close", this.handleWSError);
      this.socket.close();
      this.socket = null;
      if (this.rpc) {
        this.rpc.destroy();
        this.rpc = null;
      }
      // On /wasm the renderer is the WasmRenderer, which is independent of
      // the WebSocket and must survive reconnects; only / tears down the
      // server renderer here.
      if (this.props.variant !== "wasm" && this.svgRenderer) {
        this.svgRenderer.destroy();
        this.svgRenderer = null;
      }
    }
  }

  private async fetchSong(): Promise<void> {
    const { edit } = this.props;
    if (edit === "null" || !edit) {
      return;
    }

    this.setState({
      branch: null,
    });

    const parsed = parseGitHubSongRef(edit);
    if (!parsed.ok) {
      track("song-not-found");
      this.props.setQuery({
        edit: undefined,
        src: undefined,
        404: "1",
      });

      return;
    }

    let req: Response;
    try {
      req = await fetch(rawGitHubUrl(parsed.ref));
    } catch (_err) {
      alert("Could not fetch the requested song.");

      return;
    }

    if (req.status === 404) {
      track("song-not-found");
      this.props.setQuery({
        edit: undefined,
        src: undefined,
        404: "1",
      });

      return;
    }
    if (req.status >= 400) {
      alert("Could not fetch the requested song.");

      return;
    }

    const content: string = await req.text();
    const cleanSongs: { [key: string]: Song } = JSON.parse(
      JSON.stringify(this.state.cleanSongs),
    );
    if (cleanSongs[edit]) {
      // We have a better version.
      return;
    }
    cleanSongs[edit] = {
      baseSHA: PUBLIC_READONLY,
      src: content,
    };

    this.setState({
      cleanSongs,
      branch: parsed.ref.branch || "HEAD",
    });
  }

  private getSongName = (): string => {
    const songParts: string[] = this.props.edit
      ? this.props.edit.split("/")
      : ["untitled"];
    return songParts[songParts.length - 1];
  };

  private handleBeforeUnload = (ev: BeforeUnloadEvent): void => {
    // Don't bug users when they have no choice
    if (this.state.locked) {
      return;
    }

    if (this.isDirty()) {
      this.setState({
        interstitialChanges: null,
      });
      ev.returnValue = "Changes you made have not been saved.";
    }
  };

  private handleClear404 = (): void => {
    this.props.setQuery({
      404: undefined,
    });
  };

  private handleCodeChanged = (newValue: string): void => {
    const { baseSHA, src: clean } =
      this.state.cleanSongs[this.props.edit || "null"];
    if (clean === newValue) {
      this.props.markSongClean(this.props.edit || "null");
    } else {
      this.props.editSong(this.props.edit || "null", {
        baseSHA,
        src: newValue,
      });
    }
  };

  private handleEditingNotification = (song: string): void => {
    if (song === (this.props.edit || "null")) {
      this.setState({
        locked: true,
      });
    }
  };

  private handleExportMIDI = (): void => {
    const { midi } = this.state;
    if (!midi) {
      alert(
        "No MIDI data found. Make sure you have " +
          "a \\midi {} and a \\layout {} in your \\score {}.",
      );
      return;
    }

    track("export/midi");
    const name = this.getSongName();
    const blob = new Blob([midi], { type: "audio/midi" });
    const src = URL.createObjectURL(blob);

    this.triggerDownload(`${name}.midi`, src);
  };

  private handleExportPDF = async (): Promise<void> => {
    const song = this.song();
    if (!song) {
      alert("Could not export PDF.");
      return;
    }

    const rpc = this.rpc;
    if (!rpc) {
      alert("Could not connect to server");
      return;
    }

    // TODO TRIGGER LOADING

    const name = this.getSongName();

    try {
      const version = renderVersionFor(song.src);

      const pdf: string = (
        await rpc.call("render", {
          version,
          backend: "pdf",
          src: song.src,
        })
      ).result.files[0];

      console.log(pdf);

      track("export/pdf");
      this.triggerDownload(`${name}.pdf`, "data:text/plain;base64," + pdf);
    } catch (_err) {
      alert("Could not export PDF.");
    }

    return;
  };

  private handleExportLy = (): void => {
    const song = this.song();
    if (!song) {
      alert("Could not export lilypond source.");
      return;
    }

    track("export/ly");
    const name = this.getSongName();
    this.triggerDownload(
      `${name}.ly`,
      "data:text/plain;charset=utf-8," + encodeURIComponent(song.src),
    );
  };

  private handleHideHelp = (): void => {
    this.props.setQuery({
      about: undefined,
    });
  };

  private handleHideOpen = (): void => {
    this.setState({
      open: false,
    });
  };

  private handleHideMakelily = (): void => {
    this.setState({
      makelilyInsertCB: undefined,
      showMakelily: null,
    });
  };

  private handleHideUnstableNotification = (): void => {
    this.props.setHideUnstableNotification(true);
  };

  private handleInsertLy = (ly: string): void => {
    if (this.editor) {
      if (this.state.makelilyInsertCB) {
        this.state.makelilyInsertCB(`${ly}\n`);
      } else {
        this.editor.insertText(`\n${ly}\n`);
      }
    }
    this.setState({
      makelilyInsertCB: undefined,
      showMakelily: null,
    });
  };

  private handleLogsObtained = (
    logs: string | null,
    version: "stable" | "unstable",
  ): void => {
    if (logs !== this.state.logs || version !== this.state.rendererVersion) {
      this.setState({
        logs,
        rendererVersion: version,
      });
    }
  };

  private handleMidiObtained = (midi: ArrayBuffer | null): void => {
    if (midi !== this.state.midi) {
      this.setState({
        midi,
      });
    }
  };

  private handleModeChanged = (mode: ViewMode): void => {
    this.setState({
      mode,
    });
  };

  private handleSaveAndContinue = (): void => {
    this.handleExportLy();
    this.discardChanges();
  };

  private handleSelectionChanged = (
    selection: monacoEditor.ISelection | null,
  ): void => {
    if (selection !== this.state.defaultSelection) {
      this.setState({
        defaultSelection: selection,
      });
    }
  };

  private handleShowHelp = (): void => {
    this.props.setQuery({
      about: "1",
    });
  };

  private handleShowOpen = (): void => {
    this.setState({
      open: true,
    });
  };

  private handleShowMakelily = async (
    tool?: string,
    cb?: (ly: string) => void,
  ): Promise<void> => {
    const editor: Editor | null = this.editor;
    if (!editor) {
      return;
    }

    const makelilyComponent: typeof Makelily = (
      await import("#/components/Makelily")
    ).default;

    track(`makelily/${tool || this.state.makelilyTool}`);
    this.setState({
      showMakelily: makelilyComponent,
      ...editor.getMakelilyProperties(),
      makelilyInsertCB: cb,
      makelilySingleTaskMode: !!tool,
      makelilyTool: tool || this.state.makelilyTool,
    });
  };

  private handleShowNew = (): void => {
    this.setQueryOrShowInterstitial({
      edit: undefined,
      src: undefined,
    });
  };

  private handleWindowResize = (): void => {
    this.setState({
      windowWidth: window.innerWidth,
    });
    if (this.state.mode === MODE_BOTH && window.innerWidth < MIN_BOTH_WIDTH) {
      this.setState({
        mode: MODE_VIEW,
      });
    }
    if (this.state.mode !== MODE_BOTH && window.innerWidth >= MIN_BOTH_WIDTH) {
      this.setState({
        mode: MODE_BOTH,
      });
    }
  };

  private handleWSError = (_e: Event): void => {
    if (!this.socket) {
      return;
    }

    this.disconnectWS();
    this.setState({
      reconnectCooloff: this.state.reconnectCooloff * 2,
      reconnectTimeout: this.state.reconnectCooloff,
      wsError: true,
    });
    setTimeout(this.wsReconnectTick, 1000);
  };

  private handleWSOpen = async (): Promise<void> => {
    if (!this.socket) {
      throw new Error("Socket not opened, but handleWSOpen called.");
    }
    this.rpc = new RPCClient(this.socket);
    // On /wasm the preview renderer is the local WasmRenderer (booted in
    // componentDidMount), independent of the WebSocket; only / wires the
    // server renderer to the socket here.
    if (this.props.variant !== "wasm") {
      this.svgRenderer = new RpcSvgRenderer(this.rpc);
    }
    this.setState({
      reconnectCooloff: INITIAL_WS_COOLOFF,
    });
    this.forceUpdate();
  };

  private isDirty(): boolean {
    const { edit, dirtySongs, src } = this.props;

    if (src) {
      return false;
    }

    return dirtySongs[edit || "null"] !== undefined;
  }

  private isOnline(): boolean {
    return Boolean(this.rpc);
  }

  private renderModal(): React.ReactNode {
    const { locked, interstitialChanges, showMakelily, open } = this.state;

    const { about, "404": _404 } = this.props;

    switch (true) {
      case locked:
        return <ModalLocked />;
      case _404 !== undefined:
        return <Modal404 onHide={this.handleClear404} />;
      case Boolean(about):
        return <ModalAbout onHide={this.handleHideHelp} />;
      case interstitialChanges !== null:
        return (
          <ModalUnsavedChangesInterstitial
            discardChanges={this.discardChanges}
            cancel={this.cancelInterstitial}
            save={this.handleSaveAndContinue}
          />
        );
      case open:
        return <ModalOpen onHide={this.handleHideOpen} />;
      case showMakelily !== null:
        if (showMakelily === null) {
          throw new Error("(this will never happen");
        }

        {
          const MakelilyComponent: typeof Makelily = showMakelily;

          return (
            <MakelilyComponent
              clef={this.state.makelilyClef}
              defaultTool={this.state.makelilyTool}
              keySig={this.state.makelilyKey}
              onHide={this.handleHideMakelily}
              singleTaskMode={this.state.makelilySingleTaskMode}
              onInsertLy={this.handleInsertLy}
              time={this.state.makelilyTime}
            />
          );
        }
      default:
        return null;
    }
  }

  private renderPreview(): React.ReactNode {
    const { mode, reconnectTimeout, logs, wsError, wasmReady, wasmError } =
      this.state;
    const { variant } = this.props;

    const song: Song | undefined = this.song();

    const online: boolean = this.isOnline();
    if (!song) {
      return (
        <div
          className={cn(
            APP_STYLE.sheetMusicView,
            mode === MODE_BOTH
              ? "w-1/2"
              : mode === MODE_VIEW
                ? "w-full"
                : "w-0",
          )}
        >
          <div className={cn(APP_STYLE.sheetMusicError)}>
            Fetching sheet music&hellip;
          </div>
        </div>
      );
    }

    if (variant === "wasm") {
      // The wasm worker is the preview source and is independent of the
      // WebSocket (used only for PDF on /wasm), so the WS
      // connect/reconnect state never blocks the preview here.
      if (wasmReady && this.svgRenderer) {
        return (
          <Preview
            code={song.src}
            mode={mode}
            onLogsObtained={this.handleLogsObtained}
            onMidiObtained={this.handleMidiObtained}
            onSelectionChanged={this.handleSelectionChanged}
            renderer={this.svgRenderer}
            logs={logs}
          />
        );
      }
      return (
        <div
          className={cn(
            APP_STYLE.sheetMusicView,
            mode === MODE_BOTH
              ? "w-1/2"
              : mode === MODE_VIEW
                ? "w-full"
                : "w-0",
          )}
        >
          <div className={cn(APP_STYLE.sheetMusicError)}>
            {wasmError ? (
              <>
                <TriangleAlert size="1em" className="inline" /> LilyPond worker
                crashed ({wasmError}); restarting&hellip;
              </>
            ) : (
              <>Booting LilyPond&hellip;</>
            )}
          </div>
        </div>
      );
    }

    if (this.socket) {
      if (online && this.svgRenderer) {
        return (
          <Preview
            code={song.src}
            mode={mode}
            onLogsObtained={this.handleLogsObtained}
            onMidiObtained={this.handleMidiObtained}
            onSelectionChanged={this.handleSelectionChanged}
            renderer={this.svgRenderer}
            logs={logs}
          />
        );
      }

      const previewMaskStyle: string = cn(
        APP_STYLE.pendingPreviewMask,
        mode === MODE_VIEW && APP_STYLE.previewPendingMaskModeView,
      );

      return (
        <span>
          <div
            className={cn(
              APP_STYLE.sheetMusicView,
              mode === MODE_BOTH
                ? "w-1/2"
                : mode === MODE_VIEW
                  ? "w-full"
                  : "w-0",
            )}
          />
          <div className={previewMaskStyle} />
        </span>
      );
    }

    if (!BACKEND_WS_URL) {
      return (
        <div
          className={cn(
            APP_STYLE.sheetMusicView,
            mode === MODE_BOTH
              ? "w-1/2"
              : mode === MODE_VIEW
                ? "w-full"
                : "w-0",
          )}
        >
          <div className={cn(APP_STYLE.sheetMusicError)}>
            Could not connect to server because the{" "}
            <code>REACT_APP_BACKEND_WS_URL</code> environment variable was not
            set during bundling.
          </div>
        </div>
      );
    }

    if (wsError) {
      return (
        <div
          className={cn(
            APP_STYLE.sheetMusicView,
            mode === MODE_BOTH
              ? "w-1/2"
              : mode === MODE_VIEW
                ? "w-full"
                : "w-0",
          )}
        >
          <div className={cn(APP_STYLE.sheetMusicError, "flex flex-col")}>
            <TriangleAlert size="1em" className="self-center" /> Could not
            connect to server. Trying again in {reconnectTimeout}
            &hellip;
          </div>
        </div>
      );
    }

    return null;
  }

  private setEditor = (editor: Editor | null): void => {
    this.editor = editor;
  };

  private setQueryOrShowInterstitial = <K extends keyof QueryProps>(
    updates: Pick<QueryProps, K>,
  ): void => {
    if (this.isDirty()) {
      this.setState({
        interstitialChanges: updates,
      });
    } else {
      this.props.setQuery(updates);
    }
  };

  private song(): Song | undefined {
    const { dirtySongs, edit, src } = this.props;

    if (src) {
      return {
        baseSHA: PUBLIC_READONLY,
        src,
      };
    }

    const { cleanSongs } = this.state;
    const songName: string = edit || "null";

    const song: Song | undefined = dirtySongs[songName] || cleanSongs[songName];
    if (!song) {
      return undefined;
    }

    return song;
  }

  private triggerDownload = (filename: string, src: string) => {
    const element = document.createElement("a");
    element.setAttribute("href", src);
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  };

  private wsReconnectTick = (): void => {
    const secondsRemaining: number = this.state.reconnectTimeout - 1;
    if (secondsRemaining > 0) {
      this.setState({
        reconnectTimeout: secondsRemaining,
      });
      setTimeout(this.wsReconnectTick, 1000);
    } else {
      this.setState({
        reconnectTimeout: NaN,
      });
      this.connectToWS();
    }
  };
}
