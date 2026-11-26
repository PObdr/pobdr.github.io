// This code implements the `-sMODULARIZE` settings by taking the generated
// JS program code (INNER_JS_CODE) and wrapping it in a factory function.

// Single threaded MINIMAL_RUNTIME programs do not need access to
// document.currentScript, so a simple export declaration is enough.
var createLilypond = (() => {
  // When MODULARIZE this JS may be executed later,
  // after document.currentScript is gone, so we save it.
  // In EXPORT_ES6 mode we can just use 'import.meta.url'.
  var _scriptName = globalThis.document?.currentScript?.src;
  return async function(moduleArg = {}) {
    var Module = moduleArg;
// include: shell.js
// include: minimum_runtime_check.js
// end include: minimum_runtime_check.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).
// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = !!globalThis.window;

var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;

// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = globalThis.process?.versions?.node && globalThis.process?.type != "renderer";

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// include: /tmp/tmp86f3v9nf.js
if (!Module["expectedDataFileDownloads"]) Module["expectedDataFileDownloads"] = 0;

Module["expectedDataFileDownloads"]++;

(() => {
  // Do not attempt to redownload the virtual filesystem data when in a pthread or a Wasm Worker context.
  var isPthread = typeof ENVIRONMENT_IS_PTHREAD != "undefined" && ENVIRONMENT_IS_PTHREAD;
  var isWasmWorker = typeof ENVIRONMENT_IS_WASM_WORKER != "undefined" && ENVIRONMENT_IS_WASM_WORKER;
  if (isPthread || isWasmWorker) return;
  async function loadPackage(metadata) {
    var PACKAGE_PATH = "";
    if (typeof window === "object") {
      PACKAGE_PATH = window["encodeURIComponent"](window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")) + "/");
    } else if (typeof process === "undefined" && typeof location !== "undefined") {
      // web worker
      PACKAGE_PATH = encodeURIComponent(location.pathname.substring(0, location.pathname.lastIndexOf("/")) + "/");
    }
    var PACKAGE_NAME = "out/lilypond.data";
    var REMOTE_PACKAGE_BASE = "lilypond.data";
    var REMOTE_PACKAGE_NAME = Module["locateFile"] ? Module["locateFile"](REMOTE_PACKAGE_BASE, "") : REMOTE_PACKAGE_BASE;
    var REMOTE_PACKAGE_SIZE = metadata["remote_package_size"];
    async function fetchRemotePackage(packageName, packageSize) {
      if (!Module["dataFileDownloads"]) Module["dataFileDownloads"] = {};
      try {
        var response = await fetch(packageName);
      } catch (e) {
        throw new Error(`Network Error: ${packageName}`, {
          e
        });
      }
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.url}`);
      }
      const chunks = [];
      const headers = response.headers;
      const total = Number(headers.get("Content-Length") || packageSize);
      let loaded = 0;
      Module["setStatus"] && Module["setStatus"]("Downloading data...");
      const reader = response.body.getReader();
      while (1) {
        var {done, value} = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        Module["dataFileDownloads"][packageName] = {
          loaded,
          total
        };
        let totalLoaded = 0;
        let totalSize = 0;
        for (const download of Object.values(Module["dataFileDownloads"])) {
          totalLoaded += download.loaded;
          totalSize += download.total;
        }
        Module["setStatus"] && Module["setStatus"](`Downloading data... (${totalLoaded}/${totalSize})`);
      }
      const packageData = new Uint8Array(chunks.map(c => c.length).reduce((a, b) => a + b, 0));
      let offset = 0;
      for (const chunk of chunks) {
        packageData.set(chunk, offset);
        offset += chunk.length;
      }
      return packageData.buffer;
    }
    var fetchPromise;
    var fetched = Module["getPreloadedPackage"] && Module["getPreloadedPackage"](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);
    if (!fetched) {
      // Note that we don't use await here because we want to execute the
      // the rest of this function immediately.
      fetchPromise = fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);
    }
    async function runWithFS(Module) {
      function assert(check, msg) {
        if (!check) throw new Error(msg);
      }
      Module["FS_createPath"]("/", "lilypond", true, true);
      Module["FS_createPath"]("/lilypond", "fonts", true, true);
      Module["FS_createPath"]("/lilypond/fonts", "text", true, true);
      Module["FS_createPath"]("/lilypond", "guile-ccache", true, true);
      Module["FS_createPath"]("/lilypond/guile-ccache", "ice-9", true, true);
      Module["FS_createPath"]("/lilypond/guile-ccache", "language", true, true);
      Module["FS_createPath"]("/lilypond/guile-ccache/language", "scheme", true, true);
      Module["FS_createPath"]("/lilypond/guile-ccache/language", "tree-il", true, true);
      Module["FS_createPath"]("/lilypond/guile-ccache", "oop", true, true);
      Module["FS_createPath"]("/lilypond/guile-ccache", "rnrs", true, true);
      Module["FS_createPath"]("/lilypond/guile-ccache/rnrs", "bytevectors", true, true);
      Module["FS_createPath"]("/lilypond/guile-ccache/rnrs", "io", true, true);
      Module["FS_createPath"]("/lilypond/guile-ccache/rnrs", "records", true, true);
      Module["FS_createPath"]("/lilypond/guile-ccache", "srfi", true, true);
      Module["FS_createPath"]("/lilypond/guile-ccache/srfi", "srfi-9", true, true);
      Module["FS_createPath"]("/lilypond/guile-ccache", "system", true, true);
      Module["FS_createPath"]("/lilypond/guile-ccache/system", "base", true, true);
      Module["FS_createPath"]("/lilypond/guile-ccache/system", "vm", true, true);
      Module["FS_createPath"]("/lilypond", "lib", true, true);
      Module["FS_createPath"]("/lilypond/lib", "lilypond", true, true);
      Module["FS_createPath"]("/lilypond/lib/lilypond", "2.27.1", true, true);
      Module["FS_createPath"]("/lilypond/lib/lilypond/2.27.1", "ccache", true, true);
      Module["FS_createPath"]("/lilypond/lib/lilypond/2.27.1/ccache", "lily", true, true);
      Module["FS_createPath"]("/lilypond", "share", true, true);
      Module["FS_createPath"]("/lilypond/share", "lilypond", true, true);
      Module["FS_createPath"]("/lilypond/share/lilypond", "2.27.1", true, true);
      Module["FS_createPath"]("/lilypond/share/lilypond/2.27.1", "fonts", true, true);
      Module["FS_createPath"]("/lilypond/share/lilypond/2.27.1/fonts", "otf", true, true);
      Module["FS_createPath"]("/lilypond/share/lilypond/2.27.1/fonts", "source", true, true);
      Module["FS_createPath"]("/lilypond/share/lilypond/2.27.1/fonts", "svg", true, true);
      Module["FS_createPath"]("/lilypond/share/lilypond/2.27.1", "ly", true, true);
      Module["FS_createPath"]("/lilypond/share/lilypond/2.27.1", "ps", true, true);
      Module["FS_createPath"]("/lilypond/share/lilypond/2.27.1", "scm", true, true);
      Module["FS_createPath"]("/lilypond/share/lilypond/2.27.1/scm", "lily", true, true);
      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, "Loading data file failed.");
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, "bad input to processPackageData " + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        // Reuse the bytearray from the XHR as the source for file reads.
        for (var file of metadata["files"]) {
          var name = file["filename"];
          var data = byteArray.subarray(file["start"], file["end"]);
          // canOwn this data in the filesystem, it is a slice into the heap that will never change
          Module["FS_createDataFile"](name, null, data, true, true, true);
        }
        Module["removeRunDependency"]("datafile_out/lilypond.data");
      }
      Module["addRunDependency"]("datafile_out/lilypond.data");
      if (!Module["preloadResults"]) Module["preloadResults"] = {};
      Module["preloadResults"][PACKAGE_NAME] = {
        fromCache: false
      };
      if (!fetched) {
        fetched = await fetchPromise;
      }
      await processPackageData(fetched);
    }
    // Detect whether the module JS file has already been loaded.
    if (Module["FS_createPath"]) {
      runWithFS(Module);
    } else {
      if (!Module["preRun"]) Module["preRun"] = [];
      Module["preRun"].push(runWithFS);
    }
  }
  loadPackage({
    "files": [ {
      "filename": "/lilypond/fonts.conf",
      "start": 0,
      "end": 156
    }, {
      "filename": "/lilypond/fonts/text/DejaVuSans-Bold.ttf",
      "start": 156,
      "end": 709076
    }, {
      "filename": "/lilypond/fonts/text/DejaVuSans.ttf",
      "start": 709076,
      "end": 1468796
    }, {
      "filename": "/lilypond/fonts/text/DejaVuSansMono-Bold.ttf",
      "start": 1468796,
      "end": 1803064
    }, {
      "filename": "/lilypond/fonts/text/DejaVuSansMono-BoldOblique.ttf",
      "start": 1803064,
      "end": 2058024
    }, {
      "filename": "/lilypond/fonts/text/DejaVuSansMono-Oblique.ttf",
      "start": 2058024,
      "end": 2311472
    }, {
      "filename": "/lilypond/fonts/text/DejaVuSansMono.ttf",
      "start": 2311472,
      "end": 2654612
    }, {
      "filename": "/lilypond/fonts/text/DejaVuSerif-Bold.ttf",
      "start": 2654612,
      "end": 3011280
    }, {
      "filename": "/lilypond/fonts/text/DejaVuSerif.ttf",
      "start": 3011280,
      "end": 3391940
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/and-let-star.go",
      "start": 3391940,
      "end": 3465537
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/arrays.go",
      "start": 3465537,
      "end": 3537550
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/binary-ports.go",
      "start": 3537550,
      "end": 3615507
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/boot-9.go",
      "start": 3615507,
      "end": 4462360
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/control.go",
      "start": 4462360,
      "end": 4542405
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/copy-tree.go",
      "start": 4542405,
      "end": 4611842
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/custom-ports.go",
      "start": 4611842,
      "end": 4802879
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/deprecated.go",
      "start": 4802879,
      "end": 4874172
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/eval-string.go",
      "start": 4874172,
      "end": 4945585
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/eval.go",
      "start": 4945585,
      "end": 5040558
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/exceptions.go",
      "start": 5040558,
      "end": 5137043
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/format.go",
      "start": 5137043,
      "end": 5605536
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/ftw.go",
      "start": 5605536,
      "end": 5695109
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/futures.go",
      "start": 5695109,
      "end": 5876690
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/hash-table.go",
      "start": 5876690,
      "end": 5950927
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/iconv.go",
      "start": 5950927,
      "end": 6021460
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/list.go",
      "start": 6021460,
      "end": 6089825
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/match.go",
      "start": 6089825,
      "end": 6381022
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/optargs.go",
      "start": 6381022,
      "end": 6468179
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/ports.go",
      "start": 6468179,
      "end": 6569032
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/posix.go",
      "start": 6569032,
      "end": 6643675
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/pretty-print.go",
      "start": 6643675,
      "end": 6730512
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/psyntax-pp.go",
      "start": 6730512,
      "end": 7212517
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/q.go",
      "start": 7212517,
      "end": 7286274
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/rdelim.go",
      "start": 7286274,
      "end": 7365391
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/receive.go",
      "start": 7365391,
      "end": 7434204
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/regex.go",
      "start": 7434204,
      "end": 7512001
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/rw.go",
      "start": 7512001,
      "end": 7579356
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/soft-ports.go",
      "start": 7579356,
      "end": 7660737
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/textual-ports.go",
      "start": 7660737,
      "end": 7743462
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/threads.go",
      "start": 7743462,
      "end": 7832147
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/unicode.go",
      "start": 7832147,
      "end": 7899712
    }, {
      "filename": "/lilypond/guile-ccache/ice-9/vlist.go",
      "start": 7899712,
      "end": 8185213
    }, {
      "filename": "/lilypond/guile-ccache/language/scheme/compile-tree-il.go",
      "start": 8185213,
      "end": 8253234
    }, {
      "filename": "/lilypond/guile-ccache/language/scheme/decompile-tree-il.go",
      "start": 8253234,
      "end": 8439943
    }, {
      "filename": "/lilypond/guile-ccache/language/scheme/spec.go",
      "start": 8439943,
      "end": 8509276
    }, {
      "filename": "/lilypond/guile-ccache/language/tree-il.go",
      "start": 8509276,
      "end": 8792329
    }, {
      "filename": "/lilypond/guile-ccache/language/tree-il/primitives.go",
      "start": 8792329,
      "end": 8983222
    }, {
      "filename": "/lilypond/guile-ccache/oop/goops.go",
      "start": 8983222,
      "end": 9829155
    }, {
      "filename": "/lilypond/guile-ccache/rnrs/base.go",
      "start": 9829155,
      "end": 9927824
    }, {
      "filename": "/lilypond/guile-ccache/rnrs/bytevectors.go",
      "start": 9927824,
      "end": 9998221
    }, {
      "filename": "/lilypond/guile-ccache/rnrs/bytevectors/gnu.go",
      "start": 9998221,
      "end": 10065754
    }, {
      "filename": "/lilypond/guile-ccache/rnrs/conditions.go",
      "start": 10065754,
      "end": 10137629
    }, {
      "filename": "/lilypond/guile-ccache/rnrs/control.go",
      "start": 10137629,
      "end": 10206072
    }, {
      "filename": "/lilypond/guile-ccache/rnrs/enums.go",
      "start": 10206072,
      "end": 10287781
    }, {
      "filename": "/lilypond/guile-ccache/rnrs/exceptions.go",
      "start": 10287781,
      "end": 10357192
    }, {
      "filename": "/lilypond/guile-ccache/rnrs/files.go",
      "start": 10357192,
      "end": 10432045
    }, {
      "filename": "/lilypond/guile-ccache/rnrs/hashtables.go",
      "start": 10432045,
      "end": 10510218
    }, {
      "filename": "/lilypond/guile-ccache/rnrs/io/ports.go",
      "start": 10510218,
      "end": 10702399
    }, {
      "filename": "/lilypond/guile-ccache/rnrs/lists.go",
      "start": 10702399,
      "end": 10774604
    }, {
      "filename": "/lilypond/guile-ccache/rnrs/records/procedural.go",
      "start": 10774604,
      "end": 10849673
    }, {
      "filename": "/lilypond/guile-ccache/rnrs/records/syntactic.go",
      "start": 10849673,
      "end": 10941926
    }, {
      "filename": "/lilypond/guile-ccache/rnrs/syntax-case.go",
      "start": 10941926,
      "end": 11012771
    }, {
      "filename": "/lilypond/guile-ccache/srfi/srfi-1.go",
      "start": 11012771,
      "end": 11208480
    }, {
      "filename": "/lilypond/guile-ccache/srfi/srfi-11.go",
      "start": 11208480,
      "end": 11283245
    }, {
      "filename": "/lilypond/guile-ccache/srfi/srfi-13.go",
      "start": 11283245,
      "end": 11353456
    }, {
      "filename": "/lilypond/guile-ccache/srfi/srfi-14.go",
      "start": 11353456,
      "end": 11422963
    }, {
      "filename": "/lilypond/guile-ccache/srfi/srfi-16.go",
      "start": 11422963,
      "end": 11490312
    }, {
      "filename": "/lilypond/guile-ccache/srfi/srfi-2.go",
      "start": 11490312,
      "end": 11557787
    }, {
      "filename": "/lilypond/guile-ccache/srfi/srfi-26.go",
      "start": 11557787,
      "end": 11631448
    }, {
      "filename": "/lilypond/guile-ccache/srfi/srfi-39.go",
      "start": 11631448,
      "end": 11699717
    }, {
      "filename": "/lilypond/guile-ccache/srfi/srfi-4.go",
      "start": 11699717,
      "end": 11799026
    }, {
      "filename": "/lilypond/guile-ccache/srfi/srfi-69.go",
      "start": 11799026,
      "end": 11981799
    }, {
      "filename": "/lilypond/guile-ccache/srfi/srfi-8.go",
      "start": 11981799,
      "end": 12049242
    }, {
      "filename": "/lilypond/guile-ccache/srfi/srfi-9.go",
      "start": 12049242,
      "end": 12148527
    }, {
      "filename": "/lilypond/guile-ccache/srfi/srfi-9/gnu.go",
      "start": 12148527,
      "end": 12232668
    }, {
      "filename": "/lilypond/guile-ccache/system/base/ck.go",
      "start": 12232668,
      "end": 12303753
    }, {
      "filename": "/lilypond/guile-ccache/system/base/compile.go",
      "start": 12303753,
      "end": 12389590
    }, {
      "filename": "/lilypond/guile-ccache/system/base/language.go",
      "start": 12389590,
      "end": 12465283
    }, {
      "filename": "/lilypond/guile-ccache/system/base/message.go",
      "start": 12465283,
      "end": 12563256
    }, {
      "filename": "/lilypond/guile-ccache/system/base/pmatch.go",
      "start": 12563256,
      "end": 12639317
    }, {
      "filename": "/lilypond/guile-ccache/system/base/syntax.go",
      "start": 12639317,
      "end": 12726298
    }, {
      "filename": "/lilypond/guile-ccache/system/base/target.go",
      "start": 12726298,
      "end": 12805847
    }, {
      "filename": "/lilypond/guile-ccache/system/foreign-library.go",
      "start": 12805847,
      "end": 12909580
    }, {
      "filename": "/lilypond/guile-ccache/system/foreign.go",
      "start": 12909580,
      "end": 13012345
    }, {
      "filename": "/lilypond/guile-ccache/system/vm/debug.go",
      "start": 13012345,
      "end": 13323942
    }, {
      "filename": "/lilypond/guile-ccache/system/vm/dwarf.go",
      "start": 13323942,
      "end": 14319923
    }, {
      "filename": "/lilypond/guile-ccache/system/vm/elf.go",
      "start": 14319923,
      "end": 14930944
    }, {
      "filename": "/lilypond/guile-ccache/system/vm/loader.go",
      "start": 14930944,
      "end": 14998605
    }, {
      "filename": "/lilypond/guile-ccache/system/vm/program.go",
      "start": 14998605,
      "end": 15086650
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/accreg.go",
      "start": 15086650,
      "end": 15179589
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/auto-beam.go",
      "start": 15179589,
      "end": 15253088
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/autochange.go",
      "start": 15253088,
      "end": 15323155
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/backend-library.go",
      "start": 15323155,
      "end": 15415830
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/bar-line.go",
      "start": 15415830,
      "end": 15589249
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/breath.go",
      "start": 15589249,
      "end": 15658068
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/c++.go",
      "start": 15658068,
      "end": 15750911
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/chord-entry.go",
      "start": 15750911,
      "end": 15829226
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/chord-ignatzek-names.go",
      "start": 15829226,
      "end": 15905981
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/chord-name.go",
      "start": 15905981,
      "end": 15985496
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/clip-region.go",
      "start": 15985496,
      "end": 16055019
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/color.go",
      "start": 16055019,
      "end": 16310222
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/context.go",
      "start": 16310222,
      "end": 16380297
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/curried-definitions.go",
      "start": 16380297,
      "end": 16459284
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/define-context-properties.go",
      "start": 16459284,
      "end": 16619671
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/define-event-classes.go",
      "start": 16619671,
      "end": 16694346
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/define-grob-interfaces.go",
      "start": 16694346,
      "end": 16770333
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/define-grob-properties.go",
      "start": 16770333,
      "end": 17078288
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/define-grobs.go",
      "start": 17078288,
      "end": 17572267
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/define-markup-commands.go",
      "start": 17572267,
      "end": 18144342
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/define-music-callbacks.go",
      "start": 18144342,
      "end": 18221729
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/define-music-display-methods.go",
      "start": 18221729,
      "end": 18625908
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/define-music-properties.go",
      "start": 18625908,
      "end": 18705151
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/define-music-types.go",
      "start": 18705151,
      "end": 18862706
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/define-note-names.go",
      "start": 18862706,
      "end": 19111653
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/define-stencil-commands.go",
      "start": 19111653,
      "end": 19180848
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/define-woodwind-diagrams.go",
      "start": 19180848,
      "end": 19351219
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/display-lily.go",
      "start": 19351219,
      "end": 19434438
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/display-woodwind-diagrams.go",
      "start": 19434438,
      "end": 19684065
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/file-cache.go",
      "start": 19684065,
      "end": 19751756
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/flag-styles.go",
      "start": 19751756,
      "end": 19833471
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/font-encodings.go",
      "start": 19833471,
      "end": 20001642
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/framework-cairo.go",
      "start": 20001642,
      "end": 20069453
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/framework-ps.go",
      "start": 20069453,
      "end": 20233520
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/framework-svg.go",
      "start": 20233520,
      "end": 20306435
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/fret-diagrams.go",
      "start": 20306435,
      "end": 20474990
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/graphviz.go",
      "start": 20474990,
      "end": 20644473
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/harp-pedals.go",
      "start": 20644473,
      "end": 20717356
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/layout-beam.go",
      "start": 20717356,
      "end": 20787847
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/layout-slur.go",
      "start": 20787847,
      "end": 20856314
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/lily-library.go",
      "start": 20856314,
      "end": 21235877
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/lily.go",
      "start": 21235877,
      "end": 21414552
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/ly-syntax-constructors.go",
      "start": 21414552,
      "end": 21501259
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/markup-macros.go",
      "start": 21501259,
      "end": 21592838
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/markup.go",
      "start": 21592838,
      "end": 21667945
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/midi.go",
      "start": 21667945,
      "end": 21746476
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/modal-transforms.go",
      "start": 21746476,
      "end": 21825919
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/music-functions.go",
      "start": 21825919,
      "end": 22302970
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/operators.go",
      "start": 22302970,
      "end": 22377037
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/output-lib.go",
      "start": 22377037,
      "end": 22936712
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/output-ps.go",
      "start": 22936712,
      "end": 23018467
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/output-svg.go",
      "start": 23018467,
      "end": 23110838
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/page.go",
      "start": 23110838,
      "end": 23188265
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/paper-system.go",
      "start": 23188265,
      "end": 23265484
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/paper.go",
      "start": 23265484,
      "end": 23353319
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/parser-clef.go",
      "start": 23353319,
      "end": 23430074
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/parser-ly-from-scheme.go",
      "start": 23430074,
      "end": 23501149
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/part-combiner.go",
      "start": 23501149,
      "end": 23676424
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/predefined-fretboards.go",
      "start": 23676424,
      "end": 23745795
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/ps-to-png.go",
      "start": 23745795,
      "end": 23820030
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/qr-code.go",
      "start": 23820030,
      "end": 23980769
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/scheme-engravers.go",
      "start": 23980769,
      "end": 24253540
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/scheme-performers.go",
      "start": 24253540,
      "end": 24324439
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/script.go",
      "start": 24324439,
      "end": 24403170
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/skyline.go",
      "start": 24403170,
      "end": 24471101
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/stencil.go",
      "start": 24471101,
      "end": 24655928
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/tablature.go",
      "start": 24655928,
      "end": 24739747
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/time-signature-settings.go",
      "start": 24739747,
      "end": 24836726
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/time-signature.go",
      "start": 24836726,
      "end": 24906633
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/titling.go",
      "start": 24906633,
      "end": 24978524
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/to-xml.go",
      "start": 24978524,
      "end": 25054311
    }, {
      "filename": "/lilypond/lib/lilypond/2.27.1/ccache/lily/translation-functions.go",
      "start": 25054311,
      "end": 25232242
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/00-lilypond-fonts.conf",
      "start": 25232242,
      "end": 25235466
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/99-lilypond-fonts.conf",
      "start": 25235466,
      "end": 25236458
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/emmentaler-font.conf",
      "start": 25236458,
      "end": 25237112
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/otf/emmentaler-11.otf",
      "start": 25237112,
      "end": 25336880
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/otf/emmentaler-13.otf",
      "start": 25336880,
      "end": 25436888
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/otf/emmentaler-14.otf",
      "start": 25436888,
      "end": 25536124
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/otf/emmentaler-16.otf",
      "start": 25536124,
      "end": 25636064
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/otf/emmentaler-18.otf",
      "start": 25636064,
      "end": 25735480
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/otf/emmentaler-20.otf",
      "start": 25735480,
      "end": 25834416
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/otf/emmentaler-23.otf",
      "start": 25834416,
      "end": 25933688
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/otf/emmentaler-26.otf",
      "start": 25933688,
      "end": 26033616
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/otf/emmentaler-brace.otf",
      "start": 26033616,
      "end": 26129616
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/common-modules-and-initialization.mf",
      "start": 26129616,
      "end": 26130544
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/debugging-settings.mf",
      "start": 26130544,
      "end": 26130925
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/declare-autometric-parameters.mf",
      "start": 26130925,
      "end": 26131423
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-accidentals.mf",
      "start": 26131423,
      "end": 26133286
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-accordion.mf",
      "start": 26133286,
      "end": 26146216
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-alphabet-generic.mf",
      "start": 26146216,
      "end": 26146796
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-alphabet11.mf",
      "start": 26146796,
      "end": 26146894
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-alphabet13.mf",
      "start": 26146894,
      "end": 26146992
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-alphabet14.mf",
      "start": 26146992,
      "end": 26147090
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-alphabet16.mf",
      "start": 26147090,
      "end": 26147188
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-alphabet18.mf",
      "start": 26147188,
      "end": 26147286
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-alphabet20.mf",
      "start": 26147286,
      "end": 26147381
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-alphabet23.mf",
      "start": 26147381,
      "end": 26147479
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-alphabet26.mf",
      "start": 26147479,
      "end": 26147577
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-arrow.mf",
      "start": 26147577,
      "end": 26151670
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-arrowheads.mf",
      "start": 26151670,
      "end": 26156776
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-autometric.mf",
      "start": 26156776,
      "end": 26164287
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-braces-a.mf",
      "start": 26164287,
      "end": 26164402
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-braces-b.mf",
      "start": 26164402,
      "end": 26164513
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-braces-c.mf",
      "start": 26164513,
      "end": 26164624
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-braces-d.mf",
      "start": 26164624,
      "end": 26164735
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-braces-e.mf",
      "start": 26164735,
      "end": 26164846
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-braces-f.mf",
      "start": 26164846,
      "end": 26164957
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-braces-g.mf",
      "start": 26164957,
      "end": 26165068
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-braces-generic.mf",
      "start": 26165068,
      "end": 26166463
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-braces-h.mf",
      "start": 26166463,
      "end": 26166574
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-braces-i.mf",
      "start": 26166574,
      "end": 26166685
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-braces.mf",
      "start": 26166685,
      "end": 26170153
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-brackettips.mf",
      "start": 26170153,
      "end": 26172664
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-clefs.mf",
      "start": 26172664,
      "end": 26199570
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-dots.mf",
      "start": 26199570,
      "end": 26200790
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-dynamics.mf",
      "start": 26200790,
      "end": 26221203
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-flags-generic.mf",
      "start": 26221203,
      "end": 26221778
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-flags.mf",
      "start": 26221778,
      "end": 26260052
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-flags11.mf",
      "start": 26260052,
      "end": 26260147
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-flags13.mf",
      "start": 26260147,
      "end": 26260242
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-flags14.mf",
      "start": 26260242,
      "end": 26260337
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-flags16.mf",
      "start": 26260337,
      "end": 26260432
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-flags18.mf",
      "start": 26260432,
      "end": 26260527
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-flags20.mf",
      "start": 26260527,
      "end": 26260619
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-flags23.mf",
      "start": 26260619,
      "end": 26260714
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-flags26.mf",
      "start": 26260714,
      "end": 26260809
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-flats.mf",
      "start": 26260809,
      "end": 26279881
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-macros.mf",
      "start": 26279881,
      "end": 26292864
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-naturals.mf",
      "start": 26292864,
      "end": 26300009
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-noteheads-generic.mf",
      "start": 26300009,
      "end": 26300592
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-noteheads.mf",
      "start": 26300592,
      "end": 26365594
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-noteheads11.mf",
      "start": 26365594,
      "end": 26365693
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-noteheads13.mf",
      "start": 26365693,
      "end": 26365792
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-noteheads14.mf",
      "start": 26365792,
      "end": 26365891
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-noteheads16.mf",
      "start": 26365891,
      "end": 26365990
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-noteheads18.mf",
      "start": 26365990,
      "end": 26366089
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-noteheads20.mf",
      "start": 26366089,
      "end": 26366185
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-noteheads23.mf",
      "start": 26366185,
      "end": 26366284
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-noteheads26.mf",
      "start": 26366284,
      "end": 26366383
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-numbers.mf",
      "start": 26366383,
      "end": 26408968
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-other-generic.mf",
      "start": 26408968,
      "end": 26409768
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-params.mf",
      "start": 26409768,
      "end": 26419803
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-parenthesis.mf",
      "start": 26419803,
      "end": 26421532
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-pedals.mf",
      "start": 26421532,
      "end": 26430127
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-rests.mf",
      "start": 26430127,
      "end": 26453533
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-scripts.mf",
      "start": 26453533,
      "end": 26504679
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-sharps.mf",
      "start": 26504679,
      "end": 26520705
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-sori-koron.mf",
      "start": 26520705,
      "end": 26530805
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-ties.mf",
      "start": 26530805,
      "end": 26532935
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-timesignatures.mf",
      "start": 26532935,
      "end": 26537050
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta-trills.mf",
      "start": 26537050,
      "end": 26546253
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta11.mf",
      "start": 26546253,
      "end": 26546348
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta13.mf",
      "start": 26546348,
      "end": 26546443
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta14.mf",
      "start": 26546443,
      "end": 26546538
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta16.mf",
      "start": 26546538,
      "end": 26546633
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta18.mf",
      "start": 26546633,
      "end": 26546728
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta20.mf",
      "start": 26546728,
      "end": 26546851
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta23.mf",
      "start": 26546851,
      "end": 26546946
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/feta26.mf",
      "start": 26546946,
      "end": 26547041
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-accidentals.mf",
      "start": 26547041,
      "end": 26560071
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-clefs.mf",
      "start": 26560071,
      "end": 26606823
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-custodes.mf",
      "start": 26606823,
      "end": 26620890
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-dots.mf",
      "start": 26620890,
      "end": 26622769
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-flags.mf",
      "start": 26622769,
      "end": 26631887
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-macros.mf",
      "start": 26631887,
      "end": 26637714
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-noteheads-generic.mf",
      "start": 26637714,
      "end": 26638288
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-noteheads.mf",
      "start": 26638288,
      "end": 26697350
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-noteheads11.mf",
      "start": 26697350,
      "end": 26697453
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-noteheads13.mf",
      "start": 26697453,
      "end": 26697556
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-noteheads14.mf",
      "start": 26697556,
      "end": 26697659
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-noteheads16.mf",
      "start": 26697659,
      "end": 26697762
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-noteheads18.mf",
      "start": 26697762,
      "end": 26697865
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-noteheads20.mf",
      "start": 26697865,
      "end": 26697965
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-noteheads23.mf",
      "start": 26697965,
      "end": 26698068
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-noteheads26.mf",
      "start": 26698068,
      "end": 26698171
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-other-generic.mf",
      "start": 26698171,
      "end": 26698918
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-rests.mf",
      "start": 26698918,
      "end": 26708642
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-scripts.mf",
      "start": 26708642,
      "end": 26715713
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan-timesignatures.mf",
      "start": 26715713,
      "end": 26727797
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan11.mf",
      "start": 26727797,
      "end": 26727896
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan13.mf",
      "start": 26727896,
      "end": 26727995
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan14.mf",
      "start": 26727995,
      "end": 26728094
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan16.mf",
      "start": 26728094,
      "end": 26728193
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan18.mf",
      "start": 26728193,
      "end": 26728292
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan20.mf",
      "start": 26728292,
      "end": 26728388
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan23.mf",
      "start": 26728388,
      "end": 26728487
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/source/parmesan26.mf",
      "start": 26728487,
      "end": 26728586
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/svg/emmentaler-11.svg",
      "start": 26728586,
      "end": 27038640
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/svg/emmentaler-13.svg",
      "start": 27038640,
      "end": 27348014
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/svg/emmentaler-14.svg",
      "start": 27348014,
      "end": 27657239
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/svg/emmentaler-16.svg",
      "start": 27657239,
      "end": 27965400
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/svg/emmentaler-18.svg",
      "start": 27965400,
      "end": 28273320
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/svg/emmentaler-20.svg",
      "start": 28273320,
      "end": 28580411
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/svg/emmentaler-23.svg",
      "start": 28580411,
      "end": 28886437
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/svg/emmentaler-26.svg",
      "start": 28886437,
      "end": 29191730
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/fonts/svg/emmentaler-brace.svg",
      "start": 29191730,
      "end": 29418746
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/ancient-init.ly",
      "start": 29418746,
      "end": 29423204
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/arabic.ly",
      "start": 29423204,
      "end": 29428257
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/articulate.ly",
      "start": 29428257,
      "end": 29466014
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/bagpipe.ly",
      "start": 29466014,
      "end": 29478028
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/base-tkit.ly",
      "start": 29478028,
      "end": 29482260
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/catalan.ly",
      "start": 29482260,
      "end": 29483191
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/chord-modifiers-init.ly",
      "start": 29483191,
      "end": 29485204
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/chord-repetition-init.ly",
      "start": 29485204,
      "end": 29488064
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/context-mods-init.ly",
      "start": 29488064,
      "end": 29492888
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/declarations-init.ly",
      "start": 29492888,
      "end": 29498114
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/deutsch.ly",
      "start": 29498114,
      "end": 29499044
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/drumpitch-init.ly",
      "start": 29499044,
      "end": 29510438
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/dynamic-scripts-init.ly",
      "start": 29510438,
      "end": 29512320
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/english.ly",
      "start": 29512320,
      "end": 29513251
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/engraver-init.ly",
      "start": 29513251,
      "end": 29568921
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/espanol.ly",
      "start": 29568921,
      "end": 29569852
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/event-listener.ly",
      "start": 29569852,
      "end": 29578320
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/generate-documentation.ly",
      "start": 29578320,
      "end": 29578501
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/grace-init.ly",
      "start": 29578501,
      "end": 29580081
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/graphviz-init.ly",
      "start": 29580081,
      "end": 29587222
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/gregorian.ly",
      "start": 29587222,
      "end": 29589905
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/guile-debugger.ly",
      "start": 29589905,
      "end": 29591911
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/hel-arabic.ly",
      "start": 29591911,
      "end": 29597213
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/init.ly",
      "start": 29597213,
      "end": 29600590
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/internal-backend-test.ly",
      "start": 29600590,
      "end": 29600757
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/italiano.ly",
      "start": 29600757,
      "end": 29601689
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/lilypond-book-preamble.ly",
      "start": 29601689,
      "end": 29603271
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/lyrics-tkit.ly",
      "start": 29603271,
      "end": 29605832
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/makam.ly",
      "start": 29605832,
      "end": 29611277
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/midi-init.ly",
      "start": 29611277,
      "end": 29613139
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/music-functions-init.ly",
      "start": 29613139,
      "end": 29716139
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/nederlands.ly",
      "start": 29716139,
      "end": 29717063
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/norsk.ly",
      "start": 29717063,
      "end": 29717994
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/paper-defaults-init.ly",
      "start": 29717994,
      "end": 29723776
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/performer-init.ly",
      "start": 29723776,
      "end": 29732256
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/persian.ly",
      "start": 29732256,
      "end": 29741355
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/piano-tkit.ly",
      "start": 29741355,
      "end": 29743340
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/portugues.ly",
      "start": 29743340,
      "end": 29744276
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/predefined-fretboards-init.ly",
      "start": 29744276,
      "end": 29747389
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/predefined-guitar-fretboards.ly",
      "start": 29747389,
      "end": 29771520
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/predefined-guitar-ninth-fretboards.ly",
      "start": 29771520,
      "end": 29775445
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/predefined-mandolin-fretboards.ly",
      "start": 29775445,
      "end": 29807320
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/predefined-ukulele-fretboards.ly",
      "start": 29807320,
      "end": 29854012
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/property-init.ly",
      "start": 29854012,
      "end": 29888441
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/satb.ly",
      "start": 29888441,
      "end": 29894640
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/scale-definitions-init.ly",
      "start": 29894640,
      "end": 29896479
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/scheme-sandbox.ly",
      "start": 29896479,
      "end": 29898531
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/script-init.ly",
      "start": 29898531,
      "end": 29903013
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/spanners-init.ly",
      "start": 29903013,
      "end": 29908080
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/ssaattbb.ly",
      "start": 29908080,
      "end": 29919602
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/staff-tkit.ly",
      "start": 29919602,
      "end": 29925982
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/string-tunings-init.ly",
      "start": 29925982,
      "end": 29930521
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/suomi.ly",
      "start": 29930521,
      "end": 29931450
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/svenska.ly",
      "start": 29931450,
      "end": 29932381
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/swing.ly",
      "start": 29932381,
      "end": 29948521
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/text-replacements.ly",
      "start": 29948521,
      "end": 29952907
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/titling-init.ly",
      "start": 29952907,
      "end": 29957366
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/toc-init.ly",
      "start": 29957366,
      "end": 29966776
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/turkish-makam.ly",
      "start": 29966776,
      "end": 29991938
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/vlaams.ly",
      "start": 29991938,
      "end": 29992868
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/vocal-tkit.ly",
      "start": 29992868,
      "end": 29996428
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ly/voice-tkit.ly",
      "start": 29996428,
      "end": 29997596
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ps/encodingdefs.ps",
      "start": 29997596,
      "end": 30063225
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ps/lilyponddefs.ps",
      "start": 30063225,
      "end": 30064612
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ps/music-drawing-routines.ps",
      "start": 30064612,
      "end": 30071863
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/ps/nocache.ps",
      "start": 30071863,
      "end": 30074920
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/accreg.scm",
      "start": 30074920,
      "end": 30093472
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/auto-beam.scm",
      "start": 30093472,
      "end": 30101698
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/autochange.scm",
      "start": 30101698,
      "end": 30106317
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/backend-library.scm",
      "start": 30106317,
      "end": 30131013
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/bar-line.scm",
      "start": 30131013,
      "end": 30192187
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/breath.scm",
      "start": 30192187,
      "end": 30194790
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/c++.scm",
      "start": 30194790,
      "end": 30204442
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/chord-entry.scm",
      "start": 30204442,
      "end": 30216174
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/chord-ignatzek-names.scm",
      "start": 30216174,
      "end": 30229134
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/chord-name.scm",
      "start": 30229134,
      "end": 30239490
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/clip-region.scm",
      "start": 30239490,
      "end": 30242475
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/color.scm",
      "start": 30242475,
      "end": 30294069
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/context.scm",
      "start": 30294069,
      "end": 30297519
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/curried-definitions.scm",
      "start": 30297519,
      "end": 30300284
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/define-context-properties.scm",
      "start": 30300284,
      "end": 30351547
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/define-event-classes.scm",
      "start": 30351547,
      "end": 30358152
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/define-grob-interfaces.scm",
      "start": 30358152,
      "end": 30380419
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/define-grob-properties.scm",
      "start": 30380419,
      "end": 30469516
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/define-grobs.scm",
      "start": 30469516,
      "end": 30665190
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/define-markup-commands.scm",
      "start": 30665190,
      "end": 30913183
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/define-music-callbacks.scm",
      "start": 30913183,
      "end": 30928549
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/define-music-display-methods.scm",
      "start": 30928549,
      "end": 30993499
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/define-music-properties.scm",
      "start": 30993499,
      "end": 31006105
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/define-music-types.scm",
      "start": 31006105,
      "end": 31042216
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/define-note-names.scm",
      "start": 31042216,
      "end": 31106196
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/define-paper-variables.scm",
      "start": 31106196,
      "end": 31134058
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/define-stencil-commands.scm",
      "start": 31134058,
      "end": 31136035
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/define-woodwind-diagrams.scm",
      "start": 31136035,
      "end": 31173988
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/display-lily.scm",
      "start": 31173988,
      "end": 31187198
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/display-woodwind-diagrams.scm",
      "start": 31187198,
      "end": 31278837
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/document-backend.scm",
      "start": 31278837,
      "end": 31290830
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/document-break-align-symbols.scm",
      "start": 31290830,
      "end": 31294782
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/document-colors.scm",
      "start": 31294782,
      "end": 31299045
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/document-context-mods.scm",
      "start": 31299045,
      "end": 31302363
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/document-functions.scm",
      "start": 31302363,
      "end": 31309475
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/document-identifiers.scm",
      "start": 31309475,
      "end": 31312138
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/document-markup.scm",
      "start": 31312138,
      "end": 31319711
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/document-music.scm",
      "start": 31319711,
      "end": 31324728
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/document-outside-staff-priorities.scm",
      "start": 31324728,
      "end": 31325902
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/document-paper-sizes.scm",
      "start": 31325902,
      "end": 31328275
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/document-paper-variables.scm",
      "start": 31328275,
      "end": 31329823
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/document-script-priorities.scm",
      "start": 31329823,
      "end": 31331053
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/document-translation.scm",
      "start": 31331053,
      "end": 31342483
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/document-type-predicates.scm",
      "start": 31342483,
      "end": 31345949
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/documentation-generate.scm",
      "start": 31345949,
      "end": 31354101
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/documentation-lib.scm",
      "start": 31354101,
      "end": 31363406
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/file-cache.scm",
      "start": 31363406,
      "end": 31364533
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/flag-styles.scm",
      "start": 31364533,
      "end": 31379646
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/font-encodings.scm",
      "start": 31379646,
      "end": 31411062
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/framework-cairo.scm",
      "start": 31411062,
      "end": 31412076
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/framework-ps.scm",
      "start": 31412076,
      "end": 31449328
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/framework-svg.scm",
      "start": 31449328,
      "end": 31453877
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/fret-diagrams.scm",
      "start": 31453877,
      "end": 31509398
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/graphviz.scm",
      "start": 31509398,
      "end": 31512297
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/guile-debugger.scm",
      "start": 31512297,
      "end": 31515961
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/harp-pedals.scm",
      "start": 31515961,
      "end": 31524846
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/hyphenate-internal-words.scm",
      "start": 31524846,
      "end": 31527091
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/layout-beam.scm",
      "start": 31527091,
      "end": 31530101
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/layout-slur.scm",
      "start": 31530101,
      "end": 31531894
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/lily-library.scm",
      "start": 31531894,
      "end": 31599963
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/lily-sort.scm",
      "start": 31599963,
      "end": 31605551
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/lily.scm",
      "start": 31605551,
      "end": 31652268
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/ly-syntax-constructors.scm",
      "start": 31652268,
      "end": 31668293
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/markup-macros.scm",
      "start": 31668293,
      "end": 31688176
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/markup.scm",
      "start": 31688176,
      "end": 31694025
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/midi.scm",
      "start": 31694025,
      "end": 31702287
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/modal-transforms.scm",
      "start": 31702287,
      "end": 31714967
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/music-functions.scm",
      "start": 31714967,
      "end": 31841777
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/operators.scm",
      "start": 31841777,
      "end": 31844749
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/output-lib.scm",
      "start": 31844749,
      "end": 32028949
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/output-ps.scm",
      "start": 32028949,
      "end": 32043933
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/output-svg.scm",
      "start": 32043933,
      "end": 32066812
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/page.scm",
      "start": 32066812,
      "end": 32079968
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/paper-system.scm",
      "start": 32079968,
      "end": 32092897
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/paper.scm",
      "start": 32092897,
      "end": 32110909
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/parser-clef.scm",
      "start": 32110909,
      "end": 32121599
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/parser-ly-from-scheme.scm",
      "start": 32121599,
      "end": 32130676
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/part-combiner.scm",
      "start": 32130676,
      "end": 32177937
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/predefined-fretboards.scm",
      "start": 32177937,
      "end": 32180369
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/ps-to-png.scm",
      "start": 32180369,
      "end": 32187591
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/qr-code.scm",
      "start": 32187591,
      "end": 32219335
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/scheme-engravers.scm",
      "start": 32219335,
      "end": 32341494
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/scheme-performers.scm",
      "start": 32341494,
      "end": 32347207
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/script.scm",
      "start": 32347207,
      "end": 32364026
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/skyline.scm",
      "start": 32364026,
      "end": 32365126
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/stencil.scm",
      "start": 32365126,
      "end": 32412066
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/tablature.scm",
      "start": 32412066,
      "end": 32428032
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/time-signature-settings.scm",
      "start": 32428032,
      "end": 32469764
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/time-signature.scm",
      "start": 32469764,
      "end": 32472211
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/titling.scm",
      "start": 32472211,
      "end": 32477125
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/to-xml.scm",
      "start": 32477125,
      "end": 32485037
    }, {
      "filename": "/lilypond/share/lilypond/2.27.1/scm/lily/translation-functions.scm",
      "start": 32485037,
      "end": 32534983
    } ],
    "remote_package_size": 32534983
  });
})();

// end include: /tmp/tmp86f3v9nf.js
// include: /workspace/jocelyn-stericker/hacklily/lilypond-wasm/lily-browser-pre.js
// pre-js for the lilypond.wasm browser build (MEMFS; the node build uses
// NODERAWFS and needs none of this).  The staging tree is preloaded at
// /lilypond (see bootstrap.sh / webtest-lily); env vars point LilyPond,
// Guile and fontconfig into it.
Module.preRun = Module.preRun || [];

Module.preRun.push(() => {
  ENV.GUILE_AUTO_COMPILE = "0";
  ENV.GUILE_LOAD_COMPILED_PATH = "/lilypond/guile-ccache";
  ENV.LILYPOND_DATADIR = "/lilypond/share/lilypond/2.27.1";
  ENV.LILYPOND_LIBDIR = "/lilypond/lib/lilypond/2.27.1";
  ENV.FONTCONFIG_FILE = "/lilypond/fonts.conf";
});

Module.onRuntimeInitialized = () => {
  // The file packager doesn't preserve mtimes, so preloaded .go bytecode can
  // look staler than its .scm source and Guile silently falls back to the
  // source interpreter (load.c compiled_is_fresh).  Bump ccache mtimes.
  const future = Date.now() + 864e5;
  const walk = dir => {
    for (const name of FS.readdir(dir)) {
      if (name === "." || name === "..") continue;
      const p = dir + "/" + name;
      if (FS.isDir(FS.stat(p).mode)) walk(p); else FS.utime(p, future, future);
    }
  };
  walk("/lilypond/guile-ccache");
  walk("/lilypond/lib/lilypond/2.27.1/ccache");
  FS.mkdir("/fccache");
};

// end include: /workspace/jocelyn-stericker/hacklily/lilypond-wasm/lily-browser-pre.js
// include: /workspace/jocelyn-stericker/hacklily/lilypond-wasm/lily-browser-pre.js
// pre-js for the lilypond.wasm browser build (MEMFS; the node build uses
// NODERAWFS and needs none of this).  The staging tree is preloaded at
// /lilypond (see bootstrap.sh / webtest-lily); env vars point LilyPond,
// Guile and fontconfig into it.
Module.preRun = Module.preRun || [];

Module.preRun.push(() => {
  ENV.GUILE_AUTO_COMPILE = "0";
  ENV.GUILE_LOAD_COMPILED_PATH = "/lilypond/guile-ccache";
  ENV.LILYPOND_DATADIR = "/lilypond/share/lilypond/2.27.1";
  ENV.LILYPOND_LIBDIR = "/lilypond/lib/lilypond/2.27.1";
  ENV.FONTCONFIG_FILE = "/lilypond/fonts.conf";
});

Module.onRuntimeInitialized = () => {
  // The file packager doesn't preserve mtimes, so preloaded .go bytecode can
  // look staler than its .scm source and Guile silently falls back to the
  // source interpreter (load.c compiled_is_fresh).  Bump ccache mtimes.
  const future = Date.now() + 864e5;
  const walk = dir => {
    for (const name of FS.readdir(dir)) {
      if (name === "." || name === "..") continue;
      const p = dir + "/" + name;
      if (FS.isDir(FS.stat(p).mode)) walk(p); else FS.utime(p, future, future);
    }
  };
  walk("/lilypond/guile-ccache");
  walk("/lilypond/lib/lilypond/2.27.1/ccache");
  FS.mkdir("/fccache");
};

// end include: /workspace/jocelyn-stericker/hacklily/lilypond-wasm/lily-browser-pre.js
var programArgs = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
  throw toThrow;
};

if (ENVIRONMENT_IS_WORKER) {
  _scriptName = self.location.href;
}

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = "";

function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  try {
    scriptDirectory = new URL(".", _scriptName).href;
  } catch {}
  {
    // include: web_or_worker_shell_read.js
    if (ENVIRONMENT_IS_WORKER) {
      readBinary = url => {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
        return new Uint8Array(/** @type{!ArrayBuffer} */ (xhr.response));
      };
    }
    readAsync = async url => {
      var response = await fetch(url, {
        credentials: "same-origin"
      });
      if (response.ok) {
        return response.arrayBuffer();
      }
      throw new Error(response.status + " : " + response.url);
    };
  }
} else {}

var out = console.log.bind(console);

var err = console.error.bind(console);

// end include: shell.js
// include: preamble.js
// === Preamble library stuff ===
// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html
var wasmBinary;

// Wasm globals
//========================================
// Runtime essentials
//========================================
// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// include: runtime_common.js
// include: runtime_stack_check.js
// end include: runtime_stack_check.js
// include: runtime_exceptions.js
// Base Emscripten EH error class
class EmscriptenEH {}

class EmscriptenSjLj extends EmscriptenEH {}

// end include: runtime_exceptions.js
// include: runtime_debug.js
// end include: runtime_debug.js
// Memory management
var runtimeInitialized = false;

// When ALLOW_MEMORY_GROWTH is enabled, the conversion from Wasm
// memory to ArrayBuffer requires some additional logic.
function getMemoryBuffer() {
  return wasmMemory.buffer;
}

function updateMemoryViews() {
  // If we already have a heap that is resizeable/growable buffer we don't
  // need to do anything in updateMemoryViews.
  if (HEAP8?.buffer?.resizable) return;
  var b = getMemoryBuffer();
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  HEAP32 = new Int32Array(b);
  HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
  HEAP64 = new BigInt64Array(b);
  HEAPU64 = new BigUint64Array(b);
}

// include: memoryprofiler.js
// end include: memoryprofiler.js
// end include: runtime_common.js
function preRun() {
  var preRun = Module["preRun"];
  if (preRun) {
    if (typeof preRun == "function") preRun = [ preRun ];
    onPreRuns.push(...preRun);
  }
  // Begin ATPRERUNS hooks
  callRuntimeCallbacks(onPreRuns);
}

function initRuntime() {
  runtimeInitialized = true;
  // Begin ATINITS hooks
  if (!Module["noFSInit"] && !FS.initialized) FS.init();
  TTY.init();
  PIPEFS.root = FS.mount(PIPEFS, {}, null);
  // End ATINITS hooks
  wasmExports["__wasm_call_ctors"]();
  // Begin ATPOSTCTORS hooks
  FS.ignorePermissions = false;
}

function postRun() {
  var postRun = Module["postRun"];
  if (postRun) {
    if (typeof postRun == "function") postRun = [ postRun ];
    onPostRuns.push(...postRun);
  }
  // Begin ATPOSTRUNS hooks
  callRuntimeCallbacks(onPostRuns);
}

/**
 * @param {string|number=} what
 */ function abort(what) {
  Module["onAbort"]?.(what);
  what = `Aborted(${what})`;
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);
  ABORT = true;
  what += ". Build with -sASSERTIONS for more info.";
  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.
  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */ var e = new WebAssembly.RuntimeError(what);
  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

var wasmBinaryFile;

function findWasmBinary() {
  return locateFile("lilypond.wasm");
}

function getBinarySync(file) {
  if (readBinary) {
    return readBinary(file);
  }
  // Throwing a plain string here, even though it not normally advisable since
  // this gets turning into an `abort` in instantiateArrayBuffer.
  throw "both async and sync fetching of the wasm failed";
}

async function getWasmBinary(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary) {
    // Fetch the binary using readAsync
    try {
      var response = await readAsync(binaryFile);
      return new Uint8Array(response);
    } catch {}
  }
  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);
    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary) {
    try {
      var response = fetch(binaryFile, {
        credentials: "same-origin"
      });
      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
      return instantiationResult;
    } catch (reason) {
      // We expect the most common failure cause to be a bad MIME type for the binary,
      // in which case falling back to ArrayBuffer instantiation should work.
      err(`wasm streaming compile failed: ${reason}`);
      err("falling back to ArrayBuffer instantiation");
    }
  }
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {
  // prepare imports
  var imports = {
    "env": wasmImports,
    "wasi_snapshot_preview1": wasmImports
  };
  return imports;
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  function receiveInstance(instance) {
    wasmExports = instance.exports;
    assignWasmExports(wasmExports);
    updateMemoryViews();
    return wasmExports;
  }
  // Prefer streaming instantiation if available.
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    return receiveInstance(result["instance"]);
  }
  var info = getWasmImports();
  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  var instantiateWasm = Module["instantiateWasm"];
  if (instantiateWasm) {
    return new Promise(resolve => {
      instantiateWasm(info, inst => resolve(receiveInstance(inst)));
    });
  }
  wasmBinaryFile ??= findWasmBinary();
  var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
  var exports = receiveInstantiationResult(result);
  return exports;
}

// end include: preamble.js
// Begin JS library code
class ExitStatus {
  name="ExitStatus";
  constructor(status) {
    this.message = `Program terminated with exit(${status})`;
    this.status = status;
  }
}

/** @type {!Int16Array} */ var HEAP16;

/** @type {!Int32Array} */ var HEAP32;

/** not-@type {!BigInt64Array} */ var HEAP64;

/** @type {!Int8Array} */ var HEAP8;

/** @type {!Float32Array} */ var HEAPF32;

/** @type {!Float64Array} */ var HEAPF64;

/** @type {!Uint16Array} */ var HEAPU16;

/** @type {!Uint32Array} */ var HEAPU32;

/** not-@type {!BigUint64Array} */ var HEAPU64;

/** @type {!Uint8Array} */ var HEAPU8;

var callRuntimeCallbacks = callbacks => {
  while (callbacks.length > 0) {
    // Pass the module as the first argument.
    callbacks.shift()(Module);
  }
};

var onPostRuns = [];

var onPreRuns = [];

var noExitRuntime = true;

var stackRestore = val => __emscripten_stack_restore(val);

var stackSave = () => _emscripten_stack_get_current();

var UTF8Decoder = globalThis.TextDecoder && new TextDecoder;

/**
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul
   * @return {number}
   */ var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
  var maxIdx = idx + maxBytesToRead;
  if (ignoreNul) return maxIdx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on
  // null terminator by itself.
  // As a tiny code save trick, compare idx against maxIdx using a negation,
  // so that maxBytesToRead=undefined/NaN means Infinity.
  while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
  return idx;
};

/**
   * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
   * array that contains uint8 values, returns a copy of that string as a
   * Javascript String object.
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number=} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */ var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
  var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
  // When using conditional TextDecoder, skip it for short strings as the overhead of the native call is not worth it.
  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
  }
  var str = "";
  while (idx < endPtr) {
    // For UTF8 byte structure, see:
    // http://en.wikipedia.org/wiki/UTF-8#Description
    // https://www.ietf.org/rfc/rfc2279.txt
    // https://tools.ietf.org/html/rfc3629
    var u0 = heapOrArray[idx++];
    if (!(u0 & 128)) {
      str += String.fromCharCode(u0);
      continue;
    }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 224) == 192) {
      str += String.fromCharCode(((u0 & 31) << 6) | u1);
      continue;
    }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 240) == 224) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
    }
    if (u0 < 65536) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 65536;
      str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
    }
  }
  return str;
};

/**
   * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
   * emscripten HEAP, returns a copy of that string as a Javascript String object.
   *
   * @param {number} ptr
   * @param {number=} maxBytesToRead - An optional length that specifies the
   *   maximum number of bytes to read. You can omit this parameter to scan the
   *   string until the first 0 byte. If maxBytesToRead is passed, and the string
   *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
   *   string will cut short at that byte index.
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */ var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : "";

var ___assert_fail = (condition, filename, line, func) => abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [ filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function" ]);

var wasmTableMirror = [];

var getWasmTableEntry = funcPtr => {
  var func = wasmTableMirror[funcPtr];
  if (!func) {
    /** @suppress {checkTypes} */ wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
  }
  return func;
};

var ___call_sighandler = (fp, sig) => getWasmTableEntry(fp)(sig);

var PATH = {
  isAbs: path => path.charAt(0) === "/",
  splitPath: filename => {
    var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
    return splitPathRe.exec(filename).slice(1);
  },
  normalizeArray: (parts, allowAboveRoot) => {
    // if the path tries to go above the root, `up` ends up > 0
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last === ".") {
        parts.splice(i, 1);
      } else if (last === "..") {
        parts.splice(i, 1);
        up++;
      } else if (up) {
        parts.splice(i, 1);
        up--;
      }
    }
    // if the path is allowed to go above the root, restore leading ..s
    if (allowAboveRoot) {
      for (;up; up--) {
        parts.unshift("..");
      }
    }
    return parts;
  },
  normalize: path => {
    var isAbsolute = PATH.isAbs(path), trailingSlash = path.slice(-1) === "/";
    // Normalize the path
    path = PATH.normalizeArray(path.split("/").filter(p => !!p), !isAbsolute).join("/");
    if (!path && !isAbsolute) {
      path = ".";
    }
    if (path && trailingSlash) {
      path += "/";
    }
    return (isAbsolute ? "/" : "") + path;
  },
  dirname: path => {
    var result = PATH.splitPath(path), root = result[0], dir = result[1];
    if (!root && !dir) {
      // No dirname whatsoever
      return ".";
    }
    if (dir) {
      // It has a dirname, strip trailing slash
      dir = dir.slice(0, -1);
    }
    return root + dir;
  },
  basename: path => path && path.match(/([^\/]+|\/)\/*$/)[1],
  join: (...paths) => PATH.normalize(paths.join("/")),
  join2: (l, r) => PATH.normalize(l + "/" + r)
};

var initRandomFill = () => view => (crypto.getRandomValues(view), 0);

var randomFill = view => (randomFill = initRandomFill())(view);

var PATH_FS = {
  resolve: (...args) => {
    var resolvedPath = "", resolvedAbsolute = false;
    for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = (i >= 0) ? args[i] : FS.cwd();
      // Skip empty and invalid entries
      if (typeof path != "string") {
        throw new TypeError("Arguments to path.resolve must be strings");
      } else if (!path) {
        return "";
      }
      resolvedPath = path + "/" + resolvedPath;
      resolvedAbsolute = PATH.isAbs(path);
    }
    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)
    resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(p => !!p), !resolvedAbsolute).join("/");
    return ((resolvedAbsolute ? "/" : "") + resolvedPath) || ".";
  },
  relative: (from, to) => {
    from = PATH_FS.resolve(from).slice(1);
    to = PATH_FS.resolve(to).slice(1);
    function trim(arr) {
      var start = 0;
      for (;start < arr.length; start++) {
        if (arr[start] !== "") break;
      }
      var end = arr.length - 1;
      for (;end >= 0; end--) {
        if (arr[end] !== "") break;
      }
      if (start > end) return [];
      return arr.slice(start, end - start + 1);
    }
    var fromParts = trim(from.split("/"));
    var toParts = trim(to.split("/"));
    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }
    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push("..");
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength));
    return outputParts.join("/");
  }
};

var FS_stdin_getChar_buffer = [];

var lengthBytesUTF8 = str => {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
    // unit, not a Unicode code point of the character! So decode
    // UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var c = str.charCodeAt(i);
    // possibly a lead surrogate
    if (c <= 127) {
      len++;
    } else if (c <= 2047) {
      len += 2;
    } else if (c >= 55296 && c <= 57343) {
      len += 4;
      ++i;
    } else {
      len += 3;
    }
  }
  return len;
};

var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
  // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
  // undefined and false each don't write out any bytes.
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
    // and https://www.ietf.org/rfc/rfc2279.txt
    // and https://tools.ietf.org/html/rfc3629
    var u = str.codePointAt(i);
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 192 | (u >> 6);
      heap[outIdx++] = 128 | (u & 63);
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 224 | (u >> 12);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      heap[outIdx++] = 240 | (u >> 18);
      heap[outIdx++] = 128 | ((u >> 12) & 63);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
      // Gotcha: if codePoint is over 0xFFFF, it is represented as a surrogate pair in UTF-16.
      // We need to manually skip over the second code unit for correct iteration.
      i++;
    }
  }
  // Null-terminate the pointer to the buffer.
  heap[outIdx] = 0;
  return outIdx - startIdx;
};

/** @type {function(string, boolean=, number=)} */ var intArrayFromString = (stringy, dontAddNull, length) => {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
};

var FS_stdin_getChar = () => {
  if (!FS_stdin_getChar_buffer.length) {
    var result = null;
    if (globalThis.window?.prompt) {
      // Browser.
      result = window.prompt("Input: ");
      // returns null on cancel
      if (result !== null) {
        result += "\n";
      }
    } else {}
    if (!result) {
      return null;
    }
    FS_stdin_getChar_buffer = intArrayFromString(result, true);
  }
  return FS_stdin_getChar_buffer.shift();
};

var TTY = {
  ttys: [],
  init() {},
  shutdown() {},
  register(dev, ops) {
    TTY.ttys[dev] = {
      input: [],
      output: [],
      ops
    };
    FS.registerDevice(dev, TTY.stream_ops);
  },
  stream_ops: {
    open(stream) {
      var tty = TTY.ttys[stream.node.rdev];
      if (!tty) {
        throw new FS.ErrnoError(43);
      }
      stream.tty = tty;
      stream.seekable = false;
    },
    close(stream) {
      // flush any pending line data
      stream.tty.ops.fsync(stream.tty);
    },
    fsync(stream) {
      stream.tty.ops.fsync(stream.tty);
    },
    read(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.get_char) {
        throw new FS.ErrnoError(60);
      }
      var bytesRead = 0;
      for (var i = 0; i < length; i++) {
        var result;
        try {
          result = stream.tty.ops.get_char(stream.tty);
        } catch (e) {
          throw new FS.ErrnoError(29);
        }
        if (result === undefined && bytesRead === 0) {
          throw new FS.ErrnoError(6);
        }
        if (result === null || result === undefined) break;
        bytesRead++;
        buffer[offset + i] = result;
      }
      if (bytesRead) {
        stream.node.atime = Date.now();
      }
      return bytesRead;
    },
    write(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.put_char) {
        throw new FS.ErrnoError(60);
      }
      try {
        for (var i = 0; i < length; i++) {
          stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
        }
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
      if (length) {
        stream.node.mtime = stream.node.ctime = Date.now();
      }
      return i;
    }
  },
  default_tty_ops: {
    get_char(tty) {
      return FS_stdin_getChar();
    },
    put_char(tty, val) {
      if (val === null || val === 10) {
        out(UTF8ArrayToString(tty.output));
        tty.output = [];
      } else {
        if (val != 0) tty.output.push(val);
      }
    },
    fsync(tty) {
      if (tty.output?.length > 0) {
        out(UTF8ArrayToString(tty.output));
        tty.output = [];
      }
    },
    ioctl_tcgets(tty) {
      // typical setting
      return {
        c_iflag: 25856,
        c_oflag: 5,
        c_cflag: 191,
        c_lflag: 35387,
        c_cc: [ 3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
      };
    },
    ioctl_tcsets(tty, optional_actions, data) {
      // currently just ignore
      return 0;
    },
    ioctl_tiocgwinsz(tty) {
      return [ 24, 80 ];
    }
  },
  default_tty1_ops: {
    put_char(tty, val) {
      if (val === null || val === 10) {
        err(UTF8ArrayToString(tty.output));
        tty.output = [];
      } else {
        if (val != 0) tty.output.push(val);
      }
    },
    fsync(tty) {
      if (tty.output?.length > 0) {
        err(UTF8ArrayToString(tty.output));
        tty.output = [];
      }
    }
  }
};

var zeroMemory = (ptr, size) => HEAPU8.fill(0, ptr, ptr + size);

var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;

var mmapAlloc = size => {
  size = alignMemory(size, 65536);
  var ptr = _emscripten_builtin_memalign(65536, size);
  if (ptr) zeroMemory(ptr, size);
  return ptr;
};

var MEMFS = {
  ops_table: null,
  mount(mount) {
    return MEMFS.createNode(null, "/", 16895, 0);
  },
  createNode(parent, name, mode, dev) {
    if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
      // not supported
      throw new FS.ErrnoError(63);
    }
    MEMFS.ops_table ||= {
      dir: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr,
          lookup: MEMFS.node_ops.lookup,
          mknod: MEMFS.node_ops.mknod,
          rename: MEMFS.node_ops.rename,
          unlink: MEMFS.node_ops.unlink,
          rmdir: MEMFS.node_ops.rmdir,
          readdir: MEMFS.node_ops.readdir,
          symlink: MEMFS.node_ops.symlink
        },
        stream: {
          llseek: MEMFS.stream_ops.llseek
        }
      },
      file: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr
        },
        stream: {
          llseek: MEMFS.stream_ops.llseek,
          read: MEMFS.stream_ops.read,
          write: MEMFS.stream_ops.write,
          mmap: MEMFS.stream_ops.mmap,
          msync: MEMFS.stream_ops.msync
        }
      },
      link: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr,
          readlink: MEMFS.node_ops.readlink
        },
        stream: {}
      },
      chrdev: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr
        },
        stream: FS.chrdev_stream_ops
      }
    };
    var node = FS.createNode(parent, name, mode, dev);
    if (FS.isDir(node.mode)) {
      node.node_ops = MEMFS.ops_table.dir.node;
      node.stream_ops = MEMFS.ops_table.dir.stream;
      node.contents = {};
    } else if (FS.isFile(node.mode)) {
      node.node_ops = MEMFS.ops_table.file.node;
      node.stream_ops = MEMFS.ops_table.file.stream;
      // The actual number of bytes used in the typed array, as opposed to
      // contents.length which gives the whole capacity.
      node.usedBytes = 0;
      // The byte data of the file is stored in a typed array.
      // Note: typed arrays are not resizable like normal JS arrays are, so
      // there is a small penalty involved for appending file writes that
      // continuously grow a file similar to std::vector capacity vs used.
      node.contents = MEMFS.emptyFileContents ??= new Uint8Array(0);
    } else if (FS.isLink(node.mode)) {
      node.node_ops = MEMFS.ops_table.link.node;
      node.stream_ops = MEMFS.ops_table.link.stream;
    } else if (FS.isChrdev(node.mode)) {
      node.node_ops = MEMFS.ops_table.chrdev.node;
      node.stream_ops = MEMFS.ops_table.chrdev.stream;
    }
    node.atime = node.mtime = node.ctime = Date.now();
    // add the new node to the parent
    if (parent) {
      parent.contents[name] = node;
      parent.atime = parent.mtime = parent.ctime = node.atime;
    }
    return node;
  },
  getFileDataAsTypedArray(node) {
    return node.contents.subarray(0, node.usedBytes);
  },
  expandFileStorage(node, newCapacity) {
    var prevCapacity = node.contents.length;
    if (prevCapacity >= newCapacity) return;
    // No need to expand, the storage was already large enough.
    // Don't expand strictly to the given requested limit if it's only a very
    // small increase, but instead geometrically grow capacity.
    // For small filesizes (<1MB), perform size*2 geometric increase, but for
    // large sizes, do a much more conservative size*1.125 increase to avoid
    // overshooting the allocation cap by a very large margin.
    var CAPACITY_DOUBLING_MAX = 1024 * 1024;
    newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>> 0);
    if (prevCapacity) newCapacity = Math.max(newCapacity, 256);
    // At minimum allocate 256b for each file when expanding.
    var oldContents = MEMFS.getFileDataAsTypedArray(node);
    node.contents = new Uint8Array(newCapacity);
    // Allocate new storage.
    node.contents.set(oldContents);
  },
  resizeFileStorage(node, newSize) {
    if (node.usedBytes == newSize) return;
    var oldContents = node.contents;
    node.contents = new Uint8Array(newSize);
    // Allocate new storage.
    node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
    // Copy old data over to the new storage.
    node.usedBytes = newSize;
  },
  node_ops: {
    getattr(node) {
      var attr = {};
      // device numbers reuse inode numbers.
      attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
      attr.ino = node.id;
      attr.mode = node.mode;
      attr.nlink = 1;
      attr.uid = 0;
      attr.gid = 0;
      attr.rdev = node.rdev;
      if (FS.isDir(node.mode)) {
        attr.size = 4096;
      } else if (FS.isFile(node.mode)) {
        attr.size = node.usedBytes;
      } else if (FS.isLink(node.mode)) {
        attr.size = node.link.length;
      } else {
        attr.size = 0;
      }
      attr.atime = new Date(node.atime);
      attr.mtime = new Date(node.mtime);
      attr.ctime = new Date(node.ctime);
      // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
      //       but this is not required by the standard.
      attr.blksize = 4096;
      attr.blocks = Math.ceil(attr.size / attr.blksize);
      return attr;
    },
    setattr(node, attr) {
      for (const key of [ "mode", "atime", "mtime", "ctime" ]) {
        if (attr[key] != null) {
          node[key] = attr[key];
        }
      }
      if (attr.size !== undefined) {
        MEMFS.resizeFileStorage(node, attr.size);
      }
    },
    lookup(parent, name) {
      // This error may happen quite a bit. To avoid overhead we reuse it (and
      // suffer a lack of stack info).
      if (!MEMFS.doesNotExistError) {
        MEMFS.doesNotExistError = new FS.ErrnoError(44);
        /** @suppress {checkTypes} */ MEMFS.doesNotExistError.stack = "<generic error, no stack>";
      }
      throw MEMFS.doesNotExistError;
    },
    mknod(parent, name, mode, dev) {
      return MEMFS.createNode(parent, name, mode, dev);
    },
    rename(old_node, new_dir, new_name) {
      var new_node;
      try {
        new_node = FS.lookupNode(new_dir, new_name);
      } catch (e) {}
      if (new_node) {
        if (FS.isDir(old_node.mode)) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          for (var i in new_node.contents) {
            throw new FS.ErrnoError(55);
          }
        }
        FS.hashRemoveNode(new_node);
      }
      // do the internal rewiring
      delete old_node.parent.contents[old_node.name];
      new_dir.contents[new_name] = old_node;
      old_node.name = new_name;
      new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
    },
    unlink(parent, name) {
      delete parent.contents[name];
      parent.ctime = parent.mtime = Date.now();
    },
    rmdir(parent, name) {
      var node = FS.lookupNode(parent, name);
      for (var i in node.contents) {
        throw new FS.ErrnoError(55);
      }
      delete parent.contents[name];
      parent.ctime = parent.mtime = Date.now();
    },
    readdir(node) {
      return [ ".", "..", ...Object.keys(node.contents) ];
    },
    symlink(parent, newname, oldpath) {
      var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
      node.link = oldpath;
      return node;
    },
    readlink(node) {
      if (!FS.isLink(node.mode)) {
        throw new FS.ErrnoError(28);
      }
      return node.link;
    }
  },
  stream_ops: {
    read(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= stream.node.usedBytes) return 0;
      var size = Math.min(stream.node.usedBytes - position, length);
      buffer.set(contents.subarray(position, position + size), offset);
      return size;
    },
    write(stream, buffer, offset, length, position, canOwn) {
      // If the buffer is located in main memory (HEAP), and if
      // memory can grow, we can't hold on to references of the
      // memory buffer, as they may get invalidated. That means we
      // need to copy its contents.
      if (buffer.buffer === HEAP8.buffer) {
        canOwn = false;
      }
      if (!length) return 0;
      var node = stream.node;
      node.mtime = node.ctime = Date.now();
      if (canOwn) {
        node.contents = buffer.subarray(offset, offset + length);
        node.usedBytes = length;
      } else if (node.usedBytes === 0 && position === 0) {
        // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
        node.contents = buffer.slice(offset, offset + length);
        node.usedBytes = length;
      } else {
        MEMFS.expandFileStorage(node, position + length);
        // Use typed array write which is available.
        node.contents.set(buffer.subarray(offset, offset + length), position);
        node.usedBytes = Math.max(node.usedBytes, position + length);
      }
      return length;
    },
    llseek(stream, offset, whence) {
      var position = offset;
      if (whence === 1) {
        position += stream.position;
      } else if (whence === 2) {
        if (FS.isFile(stream.node.mode)) {
          position += stream.node.usedBytes;
        }
      }
      if (position < 0) {
        throw new FS.ErrnoError(28);
      }
      return position;
    },
    mmap(stream, length, position, prot, flags) {
      if (!FS.isFile(stream.node.mode)) {
        throw new FS.ErrnoError(43);
      }
      var ptr;
      var allocated;
      var contents = stream.node.contents;
      // Only make a new copy when MAP_PRIVATE is specified.
      if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
        // We can't emulate MAP_SHARED when the file is not backed by the
        // buffer we're mapping to (e.g. the HEAP buffer).
        allocated = false;
        ptr = contents.byteOffset;
      } else {
        allocated = true;
        ptr = mmapAlloc(length);
        if (!ptr) {
          throw new FS.ErrnoError(48);
        }
        if (contents) {
          // Try to avoid unnecessary slices.
          if (position > 0 || position + length < contents.length) {
            if (contents.subarray) {
              contents = contents.subarray(position, position + length);
            } else {
              contents = Array.prototype.slice.call(contents, position, position + length);
            }
          }
          HEAP8.set(contents, ptr);
        }
      }
      return {
        ptr,
        allocated
      };
    },
    msync(stream, buffer, offset, length, mmapFlags) {
      MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
      // should we check if bytesWritten and length are the same?
      return 0;
    }
  }
};

var FS_modeStringToFlags = str => {
  if (typeof str != "string") return str;
  var flagModes = {
    "r": 0,
    "r+": 2,
    "w": 512 | 64 | 1,
    "w+": 512 | 64 | 2,
    "a": 1024 | 64 | 1,
    "a+": 1024 | 64 | 2
  };
  var flags = flagModes[str];
  if (typeof flags == "undefined") {
    throw new Error(`Unknown file open mode: ${str}`);
  }
  return flags;
};

var FS_fileDataToTypedArray = data => {
  if (typeof data == "string") {
    data = intArrayFromString(data, true);
  }
  if (!data.subarray) {
    data = new Uint8Array(data);
  }
  return data;
};

var FS_getMode = (canRead, canWrite) => {
  var mode = 0;
  if (canRead) mode |= 292 | 73;
  if (canWrite) mode |= 146;
  return mode;
};

var asyncLoad = async url => {
  var arrayBuffer = await readAsync(url);
  return new Uint8Array(arrayBuffer);
};

var FS_createDataFile = (...args) => FS.createDataFile(...args);

var getUniqueRunDependency = id => id;

var dependenciesPromise = null;

var resolveRunDependencies = async () => dependenciesPromise;

var runDependencies = 0;

var removeRunDependency = id => {
  runDependencies--;
  Module["monitorRunDependencies"]?.(runDependencies);
  if (!runDependencies) {
    dependenciesPromise.resolve();
  }
};

var addRunDependency = id => {
  if (!runDependencies) {
    var resolve;
    dependenciesPromise = new Promise(r => resolve = r);
    dependenciesPromise.resolve = resolve;
  }
  runDependencies++;
  Module["monitorRunDependencies"]?.(runDependencies);
};

var preloadPlugins = [];

var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
  // Ensure plugins are ready.
  if (typeof Browser != "undefined") Browser.init();
  for (var plugin of preloadPlugins) {
    if (plugin["canHandle"](fullname)) {
      return plugin["handle"](byteArray, fullname);
    }
  }
  // If no plugin handled this file then return the original/unmodified
  // byteArray.
  return byteArray;
};

var FS_preloadFile = async (parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish) => {
  // TODO we should allow people to just pass in a complete filename instead
  // of parent and name being that we just join them anyways
  var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
  var dep = getUniqueRunDependency(`cp ${fullname}`);
  // might have several active requests for the same fullname
  addRunDependency(dep);
  try {
    var byteArray = url;
    if (typeof url == "string") {
      byteArray = await asyncLoad(url);
    }
    byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
    preFinish?.();
    if (!dontCreateFile) {
      FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
    }
  } finally {
    removeRunDependency(dep);
  }
};

var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
  FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish).then(onload).catch(onerror);
};

var FS = {
  root: null,
  mounts: [],
  devices: {},
  streams: [],
  nextInode: 1,
  nameTable: null,
  currentPath: "/",
  initialized: false,
  ignorePermissions: true,
  filesystems: null,
  syncFSRequests: 0,
  ErrnoError: class {
    name="ErrnoError";
    // We set the `name` property to be able to identify `FS.ErrnoError`
    // - the `name` is a standard ECMA-262 property of error objects. Kind of good to have it anyway.
    // - when using PROXYFS, an error can come from an underlying FS
    // as different FS objects have their own FS.ErrnoError each,
    // the test `err instanceof FS.ErrnoError` won't detect an error coming from another filesystem, causing bugs.
    // we'll use the reliable test `err.name == "ErrnoError"` instead
    constructor(errno) {
      this.errno = errno;
    }
  },
  FSStream: class {
    shared={};
    get object() {
      return this.node;
    }
    set object(val) {
      this.node = val;
    }
    get isRead() {
      return (this.flags & 2097155) !== 1;
    }
    get isWrite() {
      return (this.flags & 2097155) !== 0;
    }
    get isAppend() {
      return (this.flags & 1024);
    }
    get flags() {
      return this.shared.flags;
    }
    set flags(val) {
      this.shared.flags = val;
    }
    get position() {
      return this.shared.position;
    }
    set position(val) {
      this.shared.position = val;
    }
  },
  FSNode: class {
    node_ops={};
    stream_ops={};
    readMode=292 | 73;
    writeMode=146;
    mounted=null;
    constructor(parent, name, mode, rdev) {
      if (!parent) {
        parent = this;
      }
      this.parent = parent;
      this.mount = parent.mount;
      this.id = FS.nextInode++;
      this.name = name;
      this.mode = mode;
      this.rdev = rdev;
      this.atime = this.mtime = this.ctime = Date.now();
    }
    get read() {
      return (this.mode & this.readMode) === this.readMode;
    }
    set read(val) {
      val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
    }
    get write() {
      return (this.mode & this.writeMode) === this.writeMode;
    }
    set write(val) {
      val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
    }
    get isFolder() {
      return FS.isDir(this.mode);
    }
    get isDevice() {
      return FS.isChrdev(this.mode);
    }
  },
  lookupPath(path, opts = {}) {
    if (!path) {
      throw new FS.ErrnoError(44);
    }
    opts.follow_mount ??= true;
    if (!PATH.isAbs(path)) {
      path = FS.cwd() + "/" + path;
    }
    // limit max consecutive symlinks to SYMLOOP_MAX.
    linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
      // split the absolute path
      var parts = path.split("/").filter(p => !!p);
      // start at the root
      var current = FS.root;
      var current_path = "/";
      for (var i = 0; i < parts.length; i++) {
        var islast = (i === parts.length - 1);
        if (islast && opts.parent) {
          // stop resolving
          break;
        }
        if (parts[i] === ".") {
          continue;
        }
        if (parts[i] === "..") {
          current_path = PATH.dirname(current_path);
          if (FS.isRoot(current)) {
            path = current_path + "/" + parts.slice(i + 1).join("/");
            // We're making progress here, don't let many consecutive ..'s
            // lead to ELOOP
            nlinks--;
            continue linkloop;
          } else {
            current = current.parent;
          }
          continue;
        }
        current_path = PATH.join2(current_path, parts[i]);
        try {
          current = FS.lookupNode(current, parts[i]);
        } catch (e) {
          // if noent_okay is true, suppress a ENOENT in the last component
          // and return an object with an undefined node. This is needed for
          // resolving symlinks in the path when creating a file.
          if ((e?.errno === 44) && islast && opts.noent_okay) {
            return {
              path: current_path
            };
          }
          throw e;
        }
        // jump to the mount's root node if this is a mountpoint
        if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
          current = current.mounted.root;
        }
        // by default, lookupPath will not follow a symlink if it is the final path component.
        // setting opts.follow = true will override this behavior.
        if (FS.isLink(current.mode) && (!islast || opts.follow)) {
          if (!current.node_ops.readlink) {
            throw new FS.ErrnoError(52);
          }
          var link = current.node_ops.readlink(current);
          if (!PATH.isAbs(link)) {
            link = PATH.dirname(current_path) + "/" + link;
          }
          path = link + "/" + parts.slice(i + 1).join("/");
          continue linkloop;
        }
      }
      return {
        path: current_path,
        node: current
      };
    }
    throw new FS.ErrnoError(32);
  },
  getPath(node) {
    var path;
    while (true) {
      if (FS.isRoot(node)) {
        var mount = node.mount.mountpoint;
        if (!path) return mount;
        return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path;
      }
      path = path ? `${node.name}/${path}` : node.name;
      node = node.parent;
    }
  },
  hashName(parentid, name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
    }
    return ((parentid + hash) >>> 0) % FS.nameTable.length;
  },
  hashAddNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    node.name_next = FS.nameTable[hash];
    FS.nameTable[hash] = node;
  },
  hashRemoveNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    if (FS.nameTable[hash] === node) {
      FS.nameTable[hash] = node.name_next;
    } else {
      var current = FS.nameTable[hash];
      while (current) {
        if (current.name_next === node) {
          current.name_next = node.name_next;
          break;
        }
        current = current.name_next;
      }
    }
  },
  lookupNode(parent, name) {
    var errCode = FS.mayLookup(parent);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    var hash = FS.hashName(parent.id, name);
    for (var node = FS.nameTable[hash]; node; node = node.name_next) {
      var nodeName = node.name;
      if (node.parent.id === parent.id && nodeName === name) {
        return node;
      }
    }
    // if we failed to find it in the cache, call into the VFS
    return FS.lookup(parent, name);
  },
  createNode(parent, name, mode, rdev) {
    var node = new FS.FSNode(parent, name, mode, rdev);
    FS.hashAddNode(node);
    return node;
  },
  destroyNode(node) {
    FS.hashRemoveNode(node);
  },
  isRoot(node) {
    return node === node.parent;
  },
  isMountpoint(node) {
    return !!node.mounted;
  },
  isFile(mode) {
    return (mode & 61440) === 32768;
  },
  isDir(mode) {
    return (mode & 61440) === 16384;
  },
  isLink(mode) {
    return (mode & 61440) === 40960;
  },
  isChrdev(mode) {
    return (mode & 61440) === 8192;
  },
  isBlkdev(mode) {
    return (mode & 61440) === 24576;
  },
  isFIFO(mode) {
    return (mode & 61440) === 4096;
  },
  isSocket(mode) {
    return (mode & 49152) === 49152;
  },
  flagsToPermissionString(flag) {
    var perms = [ "r", "w", "rw" ][flag & 3];
    if ((flag & 512)) {
      perms += "w";
    }
    return perms;
  },
  nodePermissions(node, perms) {
    if (FS.ignorePermissions) {
      return 0;
    }
    // return 0 if any user, group or owner bits are set.
    if (perms.includes("r") && !(node.mode & 292)) {
      return 2;
    }
    if (perms.includes("w") && !(node.mode & 146)) {
      return 2;
    }
    if (perms.includes("x") && !(node.mode & 73)) {
      return 2;
    }
    return 0;
  },
  mayLookup(dir) {
    if (!FS.isDir(dir.mode)) return 54;
    var errCode = FS.nodePermissions(dir, "x");
    if (errCode) return errCode;
    if (!dir.node_ops.lookup) return 2;
    return 0;
  },
  mayCreate(dir, name) {
    if (!FS.isDir(dir.mode)) {
      return 54;
    }
    try {
      var node = FS.lookupNode(dir, name);
      return 20;
    } catch (e) {}
    return FS.nodePermissions(dir, "wx");
  },
  mayDelete(dir, name, isdir) {
    var node;
    try {
      node = FS.lookupNode(dir, name);
    } catch (e) {
      return e.errno;
    }
    var errCode = FS.nodePermissions(dir, "wx");
    if (errCode) {
      return errCode;
    }
    if (isdir) {
      if (!FS.isDir(node.mode)) {
        return 54;
      }
      if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
        return 10;
      }
    } else if (FS.isDir(node.mode)) {
      return 31;
    }
    return 0;
  },
  mayOpen(node, flags) {
    if (!node) {
      return 44;
    }
    if (FS.isLink(node.mode)) {
      return 32;
    }
    var mode = FS.flagsToPermissionString(flags);
    if (FS.isDir(node.mode)) {
      // opening for write
      // TODO: check for O_SEARCH? (== search for dir only)
      if (mode !== "r" || (flags & (512 | 64))) {
        return 31;
      }
    }
    return FS.nodePermissions(node, mode);
  },
  checkOpExists(op, err) {
    if (!op) {
      throw new FS.ErrnoError(err);
    }
    return op;
  },
  MAX_OPEN_FDS: 4096,
  nextfd() {
    for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
      if (!FS.streams[fd]) {
        return fd;
      }
    }
    throw new FS.ErrnoError(33);
  },
  getStreamChecked(fd) {
    var stream = FS.getStream(fd);
    if (!stream) {
      throw new FS.ErrnoError(8);
    }
    return stream;
  },
  getStream: fd => FS.streams[fd],
  createStream(stream, fd = -1) {
    // clone it, so we can return an instance of FSStream
    stream = Object.assign(new FS.FSStream, stream);
    if (fd == -1) {
      fd = FS.nextfd();
    }
    stream.fd = fd;
    FS.streams[fd] = stream;
    return stream;
  },
  closeStream(fd) {
    FS.streams[fd] = null;
  },
  dupStream(origStream, fd = -1) {
    var stream = FS.createStream(origStream, fd);
    stream.stream_ops?.dup?.(stream);
    return stream;
  },
  doSetAttr(stream, node, attr) {
    var setattr = stream?.stream_ops.setattr;
    var arg = setattr ? stream : node;
    setattr ??= node.node_ops.setattr;
    FS.checkOpExists(setattr, 63);
    try {
      setattr(arg, attr);
    } catch (e) {
      if (e instanceof RangeError) {
        throw new FS.ErrnoError(22);
      }
      throw e;
    }
  },
  chrdev_stream_ops: {
    open(stream) {
      var device = FS.getDevice(stream.node.rdev);
      // override node's stream ops with the device's
      stream.stream_ops = device.stream_ops;
      // forward the open call
      stream.stream_ops.open?.(stream);
    },
    llseek() {
      throw new FS.ErrnoError(70);
    }
  },
  major: dev => ((dev) >> 8),
  minor: dev => ((dev) & 255),
  makedev: (ma, mi) => ((ma) << 8 | (mi)),
  registerDevice(dev, ops) {
    FS.devices[dev] = {
      stream_ops: ops
    };
  },
  getDevice: dev => FS.devices[dev],
  getMounts(mount) {
    var mounts = [];
    var check = [ mount ];
    while (check.length) {
      var m = check.pop();
      mounts.push(m);
      check.push(...m.mounts);
    }
    return mounts;
  },
  syncfs(populate, callback) {
    if (typeof populate == "function") {
      callback = populate;
      populate = false;
    }
    FS.syncFSRequests++;
    if (FS.syncFSRequests > 1) {
      err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
    }
    var mounts = FS.getMounts(FS.root.mount);
    var completed = 0;
    function doCallback(errCode) {
      FS.syncFSRequests--;
      return callback(errCode);
    }
    function done(errCode) {
      if (errCode) {
        if (!done.errored) {
          done.errored = true;
          return doCallback(errCode);
        }
        return;
      }
      if (++completed >= mounts.length) {
        doCallback(null);
      }
    }
    // sync all mounts
    for (var mount of mounts) {
      if (mount.type.syncfs) {
        mount.type.syncfs(mount, populate, done);
      } else {
        done(null);
      }
    }
  },
  mount(type, opts, mountpoint) {
    var root = mountpoint === "/";
    var pseudo = !mountpoint;
    var node;
    if (root && FS.root) {
      throw new FS.ErrnoError(10);
    } else if (!root && !pseudo) {
      var lookup = FS.lookupPath(mountpoint, {
        follow_mount: false
      });
      mountpoint = lookup.path;
      // use the absolute path
      node = lookup.node;
      if (FS.isMountpoint(node)) {
        throw new FS.ErrnoError(10);
      }
      if (!FS.isDir(node.mode)) {
        throw new FS.ErrnoError(54);
      }
    }
    var mount = {
      type,
      opts,
      mountpoint,
      mounts: []
    };
    // create a root node for the fs
    var mountRoot = type.mount(mount);
    mountRoot.mount = mount;
    mount.root = mountRoot;
    if (root) {
      FS.root = mountRoot;
    } else if (node) {
      // set as a mountpoint
      node.mounted = mount;
      // add the new mount to the current mount's children
      if (node.mount) {
        node.mount.mounts.push(mount);
      }
    }
    return mountRoot;
  },
  unmount(mountpoint) {
    var lookup = FS.lookupPath(mountpoint, {
      follow_mount: false
    });
    if (!FS.isMountpoint(lookup.node)) {
      throw new FS.ErrnoError(28);
    }
    // destroy the nodes for this mount, and all its child mounts
    var node = lookup.node;
    var mount = node.mounted;
    var mounts = FS.getMounts(mount);
    for (var [hash, current] of Object.entries(FS.nameTable)) {
      while (current) {
        var next = current.name_next;
        if (mounts.includes(current.mount)) {
          FS.destroyNode(current);
        }
        current = next;
      }
    }
    // no longer a mountpoint
    node.mounted = null;
    // remove this mount from the child mounts
    var idx = node.mount.mounts.indexOf(mount);
    node.mount.mounts.splice(idx, 1);
  },
  lookup(parent, name) {
    return parent.node_ops.lookup(parent, name);
  },
  mknod(path, mode, dev) {
    var lookup = FS.lookupPath(path, {
      parent: true
    });
    var parent = lookup.node;
    var name = PATH.basename(path);
    if (!name) {
      throw new FS.ErrnoError(28);
    }
    if (name === "." || name === "..") {
      throw new FS.ErrnoError(20);
    }
    var errCode = FS.mayCreate(parent, name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.mknod) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.mknod(parent, name, mode, dev);
  },
  statfs(path) {
    return FS.statfsNode(FS.lookupPath(path, {
      follow: true
    }).node);
  },
  statfsStream(stream) {
    // We keep a separate statfsStream function because noderawfs overrides
    // it. In noderawfs, stream.node is sometimes null. Instead, we need to
    // look at stream.path.
    return FS.statfsNode(stream.node);
  },
  statfsNode(node) {
    // NOTE: None of the defaults here are true. We're just returning safe and
    //       sane values. Currently nodefs and rawfs replace these defaults,
    //       other file systems leave them alone.
    var rtn = {
      bsize: 4096,
      frsize: 4096,
      blocks: 1e6,
      bfree: 5e5,
      bavail: 5e5,
      files: FS.nextInode,
      ffree: FS.nextInode - 1,
      fsid: 42,
      flags: 2,
      namelen: 255
    };
    if (node.node_ops.statfs) {
      Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
    }
    return rtn;
  },
  create(path, mode = 438) {
    mode &= 4095;
    mode |= 32768;
    return FS.mknod(path, mode, 0);
  },
  mkdir(path, mode = 511) {
    mode &= 511 | 512;
    mode |= 16384;
    return FS.mknod(path, mode, 0);
  },
  mkdirTree(path, mode) {
    var dirs = path.split("/");
    var d = "";
    for (var dir of dirs) {
      if (!dir) continue;
      if (d || PATH.isAbs(path)) d += "/";
      d += dir;
      try {
        FS.mkdir(d, mode);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
    }
  },
  mkdev(path, mode, dev) {
    if (typeof dev == "undefined") {
      dev = mode;
      mode = 438;
    }
    mode |= 8192;
    return FS.mknod(path, mode, dev);
  },
  symlink(oldpath, newpath) {
    if (!PATH_FS.resolve(oldpath)) {
      throw new FS.ErrnoError(44);
    }
    var lookup = FS.lookupPath(newpath, {
      parent: true
    });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var newname = PATH.basename(newpath);
    var errCode = FS.mayCreate(parent, newname);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.symlink) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.symlink(parent, newname, oldpath);
  },
  rename(old_path, new_path) {
    var old_dirname = PATH.dirname(old_path);
    var new_dirname = PATH.dirname(new_path);
    var old_name = PATH.basename(old_path);
    var new_name = PATH.basename(new_path);
    // parents must exist
    var lookup, old_dir, new_dir;
    // let the errors from non existent directories percolate up
    lookup = FS.lookupPath(old_path, {
      parent: true
    });
    old_dir = lookup.node;
    lookup = FS.lookupPath(new_path, {
      parent: true
    });
    new_dir = lookup.node;
    if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
    // need to be part of the same mount
    if (old_dir.mount !== new_dir.mount) {
      throw new FS.ErrnoError(75);
    }
    // source must exist
    var old_node = FS.lookupNode(old_dir, old_name);
    // old path should not be an ancestor of the new path
    var relative = PATH_FS.relative(old_path, new_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(28);
    }
    // new path should not be an ancestor of the old path
    relative = PATH_FS.relative(new_path, old_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(55);
    }
    // see if the new path already exists
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {}
    // early out if nothing needs to change
    if (old_node === new_node) {
      return;
    }
    // we'll need to delete the old entry
    var isdir = FS.isDir(old_node.mode);
    var errCode = FS.mayDelete(old_dir, old_name, isdir);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    // need delete permissions if we'll be overwriting.
    // need create permissions if new doesn't already exist.
    errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!old_dir.node_ops.rename) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
      throw new FS.ErrnoError(10);
    }
    // if we are going to change the parent, check write permissions
    if (new_dir !== old_dir) {
      errCode = FS.nodePermissions(old_dir, "w");
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    // remove the node from the lookup hash
    FS.hashRemoveNode(old_node);
    // do the underlying fs rename
    try {
      old_dir.node_ops.rename(old_node, new_dir, new_name);
      // update old node (we do this here to avoid each backend
      // needing to)
      old_node.parent = new_dir;
    } catch (e) {
      throw e;
    } finally {
      // add the node back to the hash (in case node_ops.rename
      // changed its name)
      FS.hashAddNode(old_node);
    }
  },
  rmdir(path) {
    var lookup = FS.lookupPath(path, {
      parent: true
    });
    var parent = lookup.node;
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, true);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.rmdir) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.rmdir(parent, name);
    FS.destroyNode(node);
  },
  readdir(path) {
    var lookup = FS.lookupPath(path, {
      follow: true
    });
    var node = lookup.node;
    var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
    return readdir(node);
  },
  unlink(path) {
    var lookup = FS.lookupPath(path, {
      parent: true
    });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, false);
    if (errCode) {
      // According to POSIX, we should map EISDIR to EPERM, but
      // we instead do what Linux does (and we must, as we use
      // the musl linux libc).
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.unlink) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.unlink(parent, name);
    FS.destroyNode(node);
  },
  readlink(path) {
    var lookup = FS.lookupPath(path);
    var link = lookup.node;
    if (!link) {
      throw new FS.ErrnoError(44);
    }
    if (!link.node_ops.readlink) {
      throw new FS.ErrnoError(28);
    }
    return link.node_ops.readlink(link);
  },
  stat(path, dontFollow) {
    var lookup = FS.lookupPath(path, {
      follow: !dontFollow
    });
    var node = lookup.node;
    var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
    return getattr(node);
  },
  fstat(fd) {
    var stream = FS.getStreamChecked(fd);
    var node = stream.node;
    var getattr = stream.stream_ops.getattr;
    var arg = getattr ? stream : node;
    getattr ??= node.node_ops.getattr;
    FS.checkOpExists(getattr, 63);
    return getattr(arg);
  },
  lstat(path) {
    return FS.stat(path, true);
  },
  doChmod(stream, node, mode, dontFollow) {
    FS.doSetAttr(stream, node, {
      mode: (mode & 4095) | (node.mode & ~4095),
      ctime: Date.now(),
      dontFollow
    });
  },
  chmod(path, mode, dontFollow) {
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, {
        follow: !dontFollow
      });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doChmod(null, node, mode, dontFollow);
  },
  lchmod(path, mode) {
    FS.chmod(path, mode, true);
  },
  fchmod(fd, mode) {
    var stream = FS.getStreamChecked(fd);
    FS.doChmod(stream, stream.node, mode, false);
  },
  doChown(stream, node, dontFollow) {
    FS.doSetAttr(stream, node, {
      timestamp: Date.now(),
      dontFollow
    });
  },
  chown(path, uid, gid, dontFollow) {
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, {
        follow: !dontFollow
      });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doChown(null, node, dontFollow);
  },
  lchown(path, uid, gid) {
    FS.chown(path, uid, gid, true);
  },
  fchown(fd, uid, gid) {
    var stream = FS.getStreamChecked(fd);
    FS.doChown(stream, stream.node, false);
  },
  doTruncate(stream, node, len) {
    if (FS.isDir(node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!FS.isFile(node.mode)) {
      throw new FS.ErrnoError(28);
    }
    var errCode = FS.nodePermissions(node, "w");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.doSetAttr(stream, node, {
      size: len,
      timestamp: Date.now()
    });
  },
  truncate(path, len) {
    if (len < 0) {
      throw new FS.ErrnoError(28);
    }
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, {
        follow: true
      });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doTruncate(null, node, len);
  },
  ftruncate(fd, len) {
    var stream = FS.getStreamChecked(fd);
    if (len < 0 || (stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(28);
    }
    FS.doTruncate(stream, stream.node, len);
  },
  utime(path, atime, mtime) {
    var lookup = FS.lookupPath(path, {
      follow: true
    });
    var node = lookup.node;
    var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
    setattr(node, {
      atime,
      mtime
    });
  },
  open(path, flags, mode = 438) {
    if (path === "") {
      throw new FS.ErrnoError(44);
    }
    flags = FS_modeStringToFlags(flags);
    if ((flags & 64)) {
      mode = (mode & 4095) | 32768;
    } else {
      mode = 0;
    }
    var node;
    var isDirPath;
    if (typeof path == "object") {
      node = path;
    } else {
      isDirPath = path.endsWith("/");
      // noent_okay makes it so that if the final component of the path
      // doesn't exist, lookupPath returns `node: undefined`. `path` will be
      // updated to point to the target of all symlinks.
      var lookup = FS.lookupPath(path, {
        follow: !(flags & 131072),
        noent_okay: true
      });
      node = lookup.node;
      path = lookup.path;
    }
    // perhaps we need to create the node
    var created = false;
    if ((flags & 64)) {
      if (node) {
        // if O_CREAT and O_EXCL are set, error out if the node already exists
        if ((flags & 128)) {
          throw new FS.ErrnoError(20);
        }
      } else if (isDirPath) {
        throw new FS.ErrnoError(31);
      } else {
        // node doesn't exist, try to create it
        // Ignore the permission bits here to ensure we can `open` this new
        // file below. We use chmod below to apply the permissions once the
        // file is open.
        node = FS.mknod(path, mode | 511, 0);
        created = true;
      }
    }
    if (!node) {
      throw new FS.ErrnoError(44);
    }
    // can't truncate a device
    if (FS.isChrdev(node.mode)) {
      flags &= ~512;
    }
    // if asked only for a directory, then this must be one
    if ((flags & 65536) && !FS.isDir(node.mode)) {
      throw new FS.ErrnoError(54);
    }
    // check permissions, if this is not a file we just created now (it is ok to
    // create and write to a file with read-only permissions; it is read-only
    // for later use)
    if (!created) {
      var errCode = FS.mayOpen(node, flags);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    // do truncation if necessary
    if ((flags & 512) && !created) {
      FS.truncate(node, 0);
    }
    // we've already handled these, don't pass down to the underlying vfs
    flags &= ~(128 | 512 | 131072);
    // register the stream with the filesystem
    var stream = FS.createStream({
      node,
      path: FS.getPath(node),
      // we want the absolute path to the node
      flags,
      seekable: true,
      position: 0,
      stream_ops: node.stream_ops,
      // used by the file family libc calls (fopen, fwrite, ferror, etc.)
      ungotten: [],
      error: false
    });
    // call the new stream's open function
    if (stream.stream_ops.open) {
      stream.stream_ops.open(stream);
    }
    if (created) {
      FS.chmod(node, mode & 511);
    }
    return stream;
  },
  close(stream) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (stream.getdents) stream.getdents = null;
    // free readdir state
    try {
      if (stream.stream_ops.close) {
        stream.stream_ops.close(stream);
      }
    } catch (e) {
      throw e;
    } finally {
      FS.closeStream(stream.fd);
    }
    stream.fd = null;
  },
  isClosed(stream) {
    return stream.fd === null;
  },
  llseek(stream, offset, whence) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (!stream.seekable || !stream.stream_ops.llseek) {
      throw new FS.ErrnoError(70);
    }
    if (whence != 0 && whence != 1 && whence != 2) {
      throw new FS.ErrnoError(28);
    }
    stream.position = stream.stream_ops.llseek(stream, offset, whence);
    stream.ungotten = [];
    return stream.position;
  },
  read(stream, buffer, offset, length, position) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.read) {
      throw new FS.ErrnoError(28);
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
    if (!seeking) stream.position += bytesRead;
    return bytesRead;
  },
  write(stream, buffer, offset, length, position, canOwn) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.write) {
      throw new FS.ErrnoError(28);
    }
    if (stream.seekable && stream.flags & 1024) {
      // seek to the end before writing in append mode
      FS.llseek(stream, 0, 2);
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
    if (!seeking) stream.position += bytesWritten;
    return bytesWritten;
  },
  mmap(stream, length, position, prot, flags) {
    // User requests writing to file (prot & PROT_WRITE != 0).
    // Checking if we have permissions to write to the file unless
    // MAP_PRIVATE flag is set. According to POSIX spec it is possible
    // to write to file opened in read-only mode with MAP_PRIVATE flag,
    // as all modifications will be visible only in the memory of
    // the current process.
    if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
      throw new FS.ErrnoError(2);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(2);
    }
    if (!stream.stream_ops.mmap) {
      throw new FS.ErrnoError(43);
    }
    if (!length) {
      throw new FS.ErrnoError(28);
    }
    return stream.stream_ops.mmap(stream, length, position, prot, flags);
  },
  msync(stream, buffer, offset, length, mmapFlags) {
    if (!stream.stream_ops.msync) {
      return 0;
    }
    return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
  },
  ioctl(stream, cmd, arg) {
    if (!stream.stream_ops.ioctl) {
      throw new FS.ErrnoError(59);
    }
    return stream.stream_ops.ioctl(stream, cmd, arg);
  },
  readFile(path, opts = {}) {
    opts.flags = opts.flags ?? 0;
    opts.encoding = opts.encoding ?? "binary";
    if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
      abort(`Invalid encoding type "${opts.encoding}"`);
    }
    var stream = FS.open(path, opts.flags);
    var stat = FS.stat(path);
    var length = stat.size;
    var buf = new Uint8Array(length);
    FS.read(stream, buf, 0, length, 0);
    if (opts.encoding === "utf8") {
      buf = UTF8ArrayToString(buf);
    }
    FS.close(stream);
    return buf;
  },
  writeFile(path, data, opts = {}) {
    opts.flags = opts.flags ?? 577;
    var stream = FS.open(path, opts.flags, opts.mode);
    data = FS_fileDataToTypedArray(data);
    FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
    FS.close(stream);
  },
  cwd: () => FS.currentPath,
  chdir(path) {
    var lookup = FS.lookupPath(path, {
      follow: true
    });
    if (lookup.node === null) {
      throw new FS.ErrnoError(44);
    }
    if (!FS.isDir(lookup.node.mode)) {
      throw new FS.ErrnoError(54);
    }
    var errCode = FS.nodePermissions(lookup.node, "x");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.currentPath = lookup.path;
  },
  createDefaultDirectories() {
    FS.mkdir("/tmp");
    FS.mkdir("/home");
    FS.mkdir("/home/web_user");
  },
  createDefaultDevices() {
    // create /dev
    FS.mkdir("/dev");
    // setup /dev/null
    FS.registerDevice(FS.makedev(1, 3), {
      read: () => 0,
      write: (stream, buffer, offset, length, pos) => length,
      llseek: () => 0
    });
    FS.mkdev("/dev/null", FS.makedev(1, 3));
    // setup /dev/tty and /dev/tty1
    // stderr needs to print output using err() rather than out()
    // so we register a second tty just for it.
    TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
    TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
    FS.mkdev("/dev/tty", FS.makedev(5, 0));
    FS.mkdev("/dev/tty1", FS.makedev(6, 0));
    // setup /dev/[u]random
    // use a buffer to avoid overhead of individual crypto calls per byte
    var randomBuffer = new Uint8Array(1024), randomLeft = 0;
    var randomByte = () => {
      if (randomLeft === 0) {
        randomFill(randomBuffer);
        randomLeft = randomBuffer.byteLength;
      }
      return randomBuffer[--randomLeft];
    };
    FS.createDevice("/dev", "random", randomByte);
    FS.createDevice("/dev", "urandom", randomByte);
    // we're not going to emulate the actual shm device,
    // just create the tmp dirs that reside in it commonly
    FS.mkdir("/dev/shm");
    FS.mkdir("/dev/shm/tmp");
  },
  createSpecialDirectories() {
    // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the
    // name of the stream for fd 6 (see test_unistd_ttyname)
    FS.mkdir("/proc");
    var proc_self = FS.mkdir("/proc/self");
    FS.mkdir("/proc/self/fd");
    FS.mount({
      mount() {
        var node = FS.createNode(proc_self, "fd", 16895, 73);
        node.stream_ops = {
          llseek: MEMFS.stream_ops.llseek
        };
        node.node_ops = {
          lookup(parent, name) {
            var fd = +name;
            var stream = FS.getStreamChecked(fd);
            var ret = {
              parent: null,
              mount: {
                mountpoint: "fake"
              },
              node_ops: {
                readlink: () => stream.path
              },
              id: fd + 1
            };
            ret.parent = ret;
            // make it look like a simple root node
            return ret;
          },
          readdir() {
            return Array.from(FS.streams.entries()).filter(([k, v]) => v).map(([k, v]) => k.toString());
          }
        };
        return node;
      }
    }, {}, "/proc/self/fd");
  },
  createStandardStreams(input, output, error) {
    // TODO deprecate the old functionality of a single
    // input / output callback and that utilizes FS.createDevice
    // and instead require a unique set of stream ops
    // by default, we symlink the standard streams to the
    // default tty devices. however, if the standard streams
    // have been overwritten we create a unique device for
    // them instead.
    if (input) {
      FS.createDevice("/dev", "stdin", input);
    } else {
      FS.symlink("/dev/tty", "/dev/stdin");
    }
    if (output) {
      FS.createDevice("/dev", "stdout", null, output);
    } else {
      FS.symlink("/dev/tty", "/dev/stdout");
    }
    if (error) {
      FS.createDevice("/dev", "stderr", null, error);
    } else {
      FS.symlink("/dev/tty1", "/dev/stderr");
    }
    // open default streams for the stdin, stdout and stderr devices
    var stdin = FS.open("/dev/stdin", 0);
    var stdout = FS.open("/dev/stdout", 1);
    var stderr = FS.open("/dev/stderr", 1);
  },
  staticInit() {
    FS.nameTable = new Array(4096);
    FS.mount(MEMFS, {}, "/");
    FS.createDefaultDirectories();
    FS.createDefaultDevices();
    FS.createSpecialDirectories();
    FS.filesystems = {
      "MEMFS": MEMFS
    };
  },
  init(input, output, error) {
    FS.initialized = true;
    // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
    input ??= Module["stdin"];
    output ??= Module["stdout"];
    error ??= Module["stderr"];
    FS.createStandardStreams(input, output, error);
  },
  quit() {
    FS.initialized = false;
    // force-flush all streams, so we get musl std streams printed out
    // close all of our streams
    for (var stream of FS.streams) {
      if (stream) {
        FS.close(stream);
      }
    }
  },
  findObject(path, dontResolveLastLink) {
    var ret = FS.analyzePath(path, dontResolveLastLink);
    if (!ret.exists) {
      return null;
    }
    return ret.object;
  },
  analyzePath(path, dontResolveLastLink) {
    // operate from within the context of the symlink's target
    try {
      var lookup = FS.lookupPath(path, {
        follow: !dontResolveLastLink
      });
      path = lookup.path;
    } catch (e) {}
    var ret = {
      isRoot: false,
      exists: false,
      error: 0,
      name: null,
      path: null,
      object: null,
      parentExists: false,
      parentPath: null,
      parentObject: null
    };
    try {
      var lookup = FS.lookupPath(path, {
        parent: true
      });
      ret.parentExists = true;
      ret.parentPath = lookup.path;
      ret.parentObject = lookup.node;
      ret.name = PATH.basename(path);
      lookup = FS.lookupPath(path, {
        follow: !dontResolveLastLink
      });
      ret.exists = true;
      ret.path = lookup.path;
      ret.object = lookup.node;
      ret.name = lookup.node.name;
      ret.isRoot = lookup.path === "/";
    } catch (e) {
      ret.error = e.errno;
    }
    return ret;
  },
  createPath(parent, path, canRead, canWrite) {
    parent = typeof parent == "string" ? parent : FS.getPath(parent);
    var parts = path.split("/").reverse();
    while (parts.length) {
      var part = parts.pop();
      if (!part) continue;
      var current = PATH.join2(parent, part);
      try {
        FS.mkdir(current);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
      parent = current;
    }
    return current;
  },
  createFile(parent, name, properties, canRead, canWrite) {
    var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
    var mode = FS_getMode(canRead, canWrite);
    return FS.create(path, mode);
  },
  createDataFile(parent, name, data, canRead, canWrite, canOwn) {
    var path = name;
    if (parent) {
      parent = typeof parent == "string" ? parent : FS.getPath(parent);
      path = name ? PATH.join2(parent, name) : parent;
    }
    var mode = FS_getMode(canRead, canWrite);
    var node = FS.create(path, mode);
    if (data) {
      data = FS_fileDataToTypedArray(data);
      // make sure we can write to the file
      FS.chmod(node, mode | 146);
      var stream = FS.open(node, 577);
      FS.write(stream, data, 0, data.length, 0, canOwn);
      FS.close(stream);
      FS.chmod(node, mode);
    }
  },
  createDevice(parent, name, input, output) {
    var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
    var mode = FS_getMode(!!input, !!output);
    FS.createDevice.major ??= 64;
    var dev = FS.makedev(FS.createDevice.major++, 0);
    // Create a fake device that a set of stream ops to emulate
    // the old behavior.
    FS.registerDevice(dev, {
      open(stream) {
        stream.seekable = false;
      },
      close(stream) {
        // flush any pending line data
        if (output?.buffer?.length) {
          output(10);
        }
      },
      read(stream, buffer, offset, length, pos) {
        var bytesRead = 0;
        for (var i = 0; i < length; i++) {
          var result;
          try {
            result = input();
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (result === undefined && bytesRead === 0) {
            throw new FS.ErrnoError(6);
          }
          if (result === null || result === undefined) break;
          bytesRead++;
          buffer[offset + i] = result;
        }
        if (bytesRead) {
          stream.node.atime = Date.now();
        }
        return bytesRead;
      },
      write(stream, buffer, offset, length, pos) {
        for (var i = 0; i < length; i++) {
          try {
            output(buffer[offset + i]);
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
        if (length) {
          stream.node.mtime = stream.node.ctime = Date.now();
        }
        return i;
      }
    });
    return FS.mkdev(path, mode, dev);
  },
  forceLoadFile(obj) {
    if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
    if (globalThis.XMLHttpRequest) {
      abort("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
    } else {
      // Command-line.
      try {
        obj.contents = readBinary(obj.url);
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
    }
  },
  createLazyFile(parent, name, url, canRead, canWrite) {
    // Lazy chunked Uint8Array (implements get and length from Uint8Array).
    // Actual getting is abstracted away for eventual reuse.
    class LazyUint8Array {
      lengthKnown=false;
      chunks=[];
      // Loaded chunks. Index is the chunk number
      get(idx) {
        if (idx > this.length - 1 || idx < 0) {
          return undefined;
        }
        var chunkOffset = idx % this.chunkSize;
        var chunkNum = (idx / this.chunkSize) | 0;
        return this.getter(chunkNum)[chunkOffset];
      }
      setDataGetter(getter) {
        this.getter = getter;
      }
      cacheLength() {
        // Find length
        var xhr = new XMLHttpRequest;
        xhr.open("HEAD", url, false);
        xhr.send(null);
        if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort("Couldn't load " + url + ". Status: " + xhr.status);
        var datalength = Number(xhr.getResponseHeader("Content-length"));
        var header;
        var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
        var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
        var chunkSize = 1024 * 1024;
        // Chunk size in bytes
        if (!hasByteServing) chunkSize = datalength;
        // Function to get a range from the remote URL.
        var doXHR = (from, to) => {
          if (from > to) abort(`invalid range (${from}, ${to}) or no bytes requested!`);
          if (to > datalength - 1) abort(`only ${datalength} bytes available! programmer error!`);
          // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
          var xhr = new XMLHttpRequest;
          xhr.open("GET", url, false);
          if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
          // Some hints to the browser that we want binary data.
          xhr.responseType = "arraybuffer";
          if (xhr.overrideMimeType) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
          }
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort("Couldn't load " + url + ". Status: " + xhr.status);
          if (xhr.response !== undefined) {
            return new Uint8Array(/** @type{Array<number>} */ (xhr.response || []));
          }
          return intArrayFromString(xhr.responseText ?? "", true);
        };
        var lazyArray = this;
        lazyArray.setDataGetter(chunkNum => {
          var start = chunkNum * chunkSize;
          var end = (chunkNum + 1) * chunkSize - 1;
          // including this byte
          end = Math.min(end, datalength - 1);
          // if datalength-1 is selected, this is the last block
          if (typeof lazyArray.chunks[chunkNum] == "undefined") {
            lazyArray.chunks[chunkNum] = doXHR(start, end);
          }
          if (typeof lazyArray.chunks[chunkNum] == "undefined") abort("doXHR failed!");
          return lazyArray.chunks[chunkNum];
        });
        if (usesGzip || !datalength) {
          // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
          chunkSize = datalength = 1;
          // this will force getter(0)/doXHR do download the whole file
          datalength = this.getter(0).length;
          chunkSize = datalength;
          out("LazyFiles on gzip forces download of the whole file when length is accessed");
        }
        this._length = datalength;
        this._chunkSize = chunkSize;
        this.lengthKnown = true;
      }
      get length() {
        if (!this.lengthKnown) {
          this.cacheLength();
        }
        return this._length;
      }
      get chunkSize() {
        if (!this.lengthKnown) {
          this.cacheLength();
        }
        return this._chunkSize;
      }
    }
    if (globalThis.XMLHttpRequest) {
      if (!ENVIRONMENT_IS_WORKER) abort("Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc");
      var lazyArray = new LazyUint8Array;
      var properties = {
        isDevice: false,
        contents: lazyArray
      };
    } else {
      var properties = {
        isDevice: false,
        url
      };
    }
    var node = FS.createFile(parent, name, properties, canRead, canWrite);
    // This is a total hack, but I want to get this lazy file code out of the
    // core of MEMFS. If we want to keep this lazy file concept I feel it should
    // be its own thin LAZYFS proxying calls to MEMFS.
    if (properties.contents) {
      node.contents = properties.contents;
    } else if (properties.url) {
      node.contents = null;
      node.url = properties.url;
    }
    // Add a function that defers querying the file size until it is asked the first time.
    Object.defineProperties(node, {
      usedBytes: {
        get: function() {
          return this.contents.length;
        }
      }
    });
    // override each stream op with one that tries to force load the lazy file first
    var stream_ops = {};
    for (const [key, fn] of Object.entries(node.stream_ops)) {
      stream_ops[key] = (...args) => {
        FS.forceLoadFile(node);
        return fn(...args);
      };
    }
    function writeChunks(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= contents.length) return 0;
      var size = Math.min(contents.length - position, length);
      if (contents.slice) {
        // normal array
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents[position + i];
        }
      } else {
        for (var i = 0; i < size; i++) {
          // LazyUint8Array from sync binary XHR
          buffer[offset + i] = contents.get(position + i);
        }
      }
      return size;
    }
    // use a custom read function
    stream_ops.read = (stream, buffer, offset, length, position) => {
      FS.forceLoadFile(node);
      return writeChunks(stream, buffer, offset, length, position);
    };
    // use a custom mmap function
    stream_ops.mmap = (stream, length, position, prot, flags) => {
      FS.forceLoadFile(node);
      var ptr = mmapAlloc(length);
      if (!ptr) {
        throw new FS.ErrnoError(48);
      }
      writeChunks(stream, HEAP8, ptr, length, position);
      return {
        ptr,
        allocated: true
      };
    };
    node.stream_ops = stream_ops;
    return node;
  }
};

var SYSCALLS = {
  currentUmask: 18,
  calculateAt(dirfd, path, allowEmpty) {
    if (PATH.isAbs(path)) {
      return path;
    }
    // relative path
    var dir;
    if (dirfd === -100) {
      dir = FS.cwd();
    } else {
      var dirstream = SYSCALLS.getStreamFromFD(dirfd);
      dir = dirstream.path;
    }
    if (path.length == 0) {
      if (!allowEmpty) {
        throw new FS.ErrnoError(44);
      }
      return dir;
    }
    return dir + "/" + path;
  },
  writeStat(buf, stat) {
    HEAPU32[((buf) >> 2)] = stat.dev;
    HEAPU32[(((buf) + (4)) >> 2)] = stat.mode;
    HEAPU32[(((buf) + (8)) >> 2)] = stat.nlink;
    HEAPU32[(((buf) + (12)) >> 2)] = stat.uid;
    HEAPU32[(((buf) + (16)) >> 2)] = stat.gid;
    HEAPU32[(((buf) + (20)) >> 2)] = stat.rdev;
    HEAP64[(((buf) + (24)) >> 3)] = BigInt(stat.size);
    HEAP32[(((buf) + (32)) >> 2)] = 4096;
    HEAP32[(((buf) + (36)) >> 2)] = stat.blocks;
    var atime = stat.atime.getTime();
    var mtime = stat.mtime.getTime();
    var ctime = stat.ctime.getTime();
    HEAP64[(((buf) + (40)) >> 3)] = BigInt(Math.floor(atime / 1e3));
    HEAPU32[(((buf) + (48)) >> 2)] = (atime % 1e3) * 1e3 * 1e3;
    HEAP64[(((buf) + (56)) >> 3)] = BigInt(Math.floor(mtime / 1e3));
    HEAPU32[(((buf) + (64)) >> 2)] = (mtime % 1e3) * 1e3 * 1e3;
    HEAP64[(((buf) + (72)) >> 3)] = BigInt(Math.floor(ctime / 1e3));
    HEAPU32[(((buf) + (80)) >> 2)] = (ctime % 1e3) * 1e3 * 1e3;
    HEAP64[(((buf) + (88)) >> 3)] = BigInt(stat.ino);
    return 0;
  },
  writeStatFs(buf, stats) {
    HEAPU32[(((buf) + (4)) >> 2)] = stats.bsize;
    HEAPU32[(((buf) + (60)) >> 2)] = stats.bsize;
    HEAP64[(((buf) + (8)) >> 3)] = BigInt(stats.blocks);
    HEAP64[(((buf) + (16)) >> 3)] = BigInt(stats.bfree);
    HEAP64[(((buf) + (24)) >> 3)] = BigInt(stats.bavail);
    HEAP64[(((buf) + (32)) >> 3)] = BigInt(stats.files);
    HEAP64[(((buf) + (40)) >> 3)] = BigInt(stats.ffree);
    HEAPU32[(((buf) + (48)) >> 2)] = stats.fsid;
    HEAPU32[(((buf) + (64)) >> 2)] = stats.flags;
    // ST_NOSUID
    HEAPU32[(((buf) + (56)) >> 2)] = stats.namelen;
  },
  doMsync(addr, stream, len, flags, offset) {
    if (!FS.isFile(stream.node.mode)) {
      throw new FS.ErrnoError(43);
    }
    if (flags & 2) {
      // MAP_PRIVATE calls need not to be synced back to underlying fs
      return 0;
    }
    var buffer = HEAPU8.subarray(addr, addr + len);
    FS.msync(stream, buffer, offset, len, flags);
  },
  getStreamFromFD(fd) {
    var stream = FS.getStreamChecked(fd);
    return stream;
  },
  varargs: undefined,
  getStr(ptr) {
    var ret = UTF8ToString(ptr);
    return ret;
  }
};

function ___syscall_chdir(path) {
  try {
    path = SYSCALLS.getStr(path);
    FS.chdir(path);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_chmod(path, mode) {
  try {
    path = SYSCALLS.getStr(path);
    FS.chmod(path, mode);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_dup(fd) {
  try {
    var old = SYSCALLS.getStreamFromFD(fd);
    return FS.dupStream(old).fd;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_dup3(fd, newfd, flags) {
  try {
    if (fd === newfd) return -28;
    if (flags & ~524288) return -28;
    var old = SYSCALLS.getStreamFromFD(fd);
    // Check newfd is within range of valid open file descriptors.
    if (newfd < 0 || newfd >= FS.MAX_OPEN_FDS) return -8;
    var existing = FS.getStream(newfd);
    if (existing) FS.close(existing);
    var stream = FS.dupStream(old, newfd);
    if (flags & 524288) {
      stream.flags |= 524288;
    }
    return stream.fd;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_faccessat(dirfd, path, amode, flags) {
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    if (amode & ~7) {
      // need a valid mode
      return -28;
    }
    var lookup = FS.lookupPath(path, {
      follow: true
    });
    var node = lookup.node;
    if (!node) {
      return -44;
    }
    var perms = "";
    if (amode & 4) perms += "r";
    if (amode & 2) perms += "w";
    if (amode & 1) perms += "x";
    if (perms && FS.nodePermissions(node, perms)) {
      return -2;
    }
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_fchdir(fd) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.chdir(stream.path);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_fchmod(fd, mode) {
  try {
    FS.fchmod(fd, mode);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_fchmodat2(dirfd, path, mode, flags) {
  try {
    var nofollow = flags & 256;
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    FS.chmod(path, mode, nofollow);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_fchown32(fd, owner, group) {
  try {
    FS.fchown(fd, owner, group);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_fchownat(dirfd, path, owner, group, flags) {
  try {
    path = SYSCALLS.getStr(path);
    var nofollow = flags & 256;
    flags = flags & (~256);
    path = SYSCALLS.calculateAt(dirfd, path);
    (nofollow ? FS.lchown : FS.chown)(path, owner, group);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var syscallGetVarargI = () => {
  // the `+` prepended here is necessary to convince the JSCompiler that varargs is indeed a number.
  var ret = HEAP32[((+SYSCALLS.varargs) >> 2)];
  SYSCALLS.varargs += 4;
  return ret;
};

var syscallGetVarargP = syscallGetVarargI;

function ___syscall_fcntl64(fd, cmd, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    switch (cmd) {
     case 0:
      {
        var arg = syscallGetVarargI();
        if (arg < 0) {
          return -28;
        }
        while (FS.streams[arg]) {
          arg++;
        }
        var newStream;
        newStream = FS.dupStream(stream, arg);
        return newStream.fd;
      }

     case 1:
     case 2:
      return 0;

     // FD_CLOEXEC makes no sense for a single process.
      case 3:
      return stream.flags;

     case 4:
      {
        var arg = syscallGetVarargI();
        var mask = 289792;
        stream.flags = (stream.flags & ~mask) | (arg & mask);
        return 0;
      }

     case 12:
      {
        var arg = syscallGetVarargP();
        var offset = 0;
        // We're always unlocked.
        HEAP16[(((arg) + (offset)) >> 1)] = 2;
        return 0;
      }

     case 13:
     case 14:
      // Pretend that the locking is successful. These are process-level locks,
      // and Emscripten programs are a single process. If we supported linking a
      // filesystem between programs, we'd need to do more here.
      // See https://github.com/emscripten-core/emscripten/issues/23697
      return 0;
    }
    return -28;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_fstat64(fd, buf) {
  try {
    return SYSCALLS.writeStat(buf, FS.fstat(fd));
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_fstatfs64(fd, size, buf) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    SYSCALLS.writeStatFs(buf, FS.statfsStream(stream));
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var INT53_MAX = 9007199254740992;

var INT53_MIN = -9007199254740992;

var bigintToI53Checked = num => (num < INT53_MIN || num > INT53_MAX) ? NaN : Number(num);

function ___syscall_ftruncate64(fd, length) {
  length = bigintToI53Checked(length);
  try {
    if (isNaN(length)) return -22;
    FS.ftruncate(fd, length);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);

function ___syscall_getcwd(buf, size) {
  try {
    if (size === 0) return -28;
    var cwd = FS.cwd();
    var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
    if (size < cwdLengthInBytes) return -68;
    stringToUTF8(cwd, buf, size);
    return cwdLengthInBytes;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_getdents64(fd, dirp, count) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    stream.getdents ||= FS.readdir(stream.path);
    var struct_size = 280;
    var pos = 0;
    var off = FS.llseek(stream, 0, 1);
    var startIdx = Math.floor(off / struct_size);
    var endIdx = Math.min(stream.getdents.length, startIdx + Math.floor(count / struct_size));
    for (var idx = startIdx; idx < endIdx; idx++) {
      var id;
      var type;
      var name = stream.getdents[idx];
      if (name === ".") {
        id = stream.node.id;
        type = 4;
      } else if (name === "..") {
        var lookup = FS.lookupPath(stream.path, {
          parent: true
        });
        id = lookup.node.id;
        type = 4;
      } else {
        var child;
        try {
          child = FS.lookupNode(stream.node, name);
        } catch (e) {
          // If the entry is not a directory, file, or symlink, nodefs
          // lookupNode will raise EINVAL. Skip these and continue.
          if (e?.errno === 28) {
            continue;
          }
          throw e;
        }
        id = child.id;
        type = FS.isChrdev(child.mode) ? 2 : // character device.
        FS.isDir(child.mode) ? 4 : // directory
        FS.isLink(child.mode) ? 10 : // symbolic link.
        8;
      }
      HEAP64[((dirp + pos) >> 3)] = BigInt(id);
      HEAP64[(((dirp + pos) + (8)) >> 3)] = BigInt((idx + 1) * struct_size);
      HEAP16[(((dirp + pos) + (16)) >> 1)] = 280;
      HEAP8[(dirp + pos) + (18)] = type;
      stringToUTF8(name, dirp + pos + 19, 256);
      pos += struct_size;
    }
    FS.llseek(stream, idx * struct_size, 0);
    return pos;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_ioctl(fd, op, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    switch (op) {
     case 21509:
      {
        if (!stream.tty) return -59;
        return 0;
      }

     case 21505:
      {
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tcgets) {
          var termios = stream.tty.ops.ioctl_tcgets(stream);
          var argp = syscallGetVarargP();
          HEAP32[((argp) >> 2)] = termios.c_iflag || 0;
          HEAP32[(((argp) + (4)) >> 2)] = termios.c_oflag || 0;
          HEAP32[(((argp) + (8)) >> 2)] = termios.c_cflag || 0;
          HEAP32[(((argp) + (12)) >> 2)] = termios.c_lflag || 0;
          for (var i = 0; i < 32; i++) {
            HEAP8[(argp + i) + (17)] = termios.c_cc[i] || 0;
          }
          return 0;
        }
        return 0;
      }

     case 21510:
     case 21511:
     case 21512:
      {
        if (!stream.tty) return -59;
        return 0;
      }

     case 21506:
     case 21507:
     case 21508:
      {
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tcsets) {
          var argp = syscallGetVarargP();
          var c_iflag = HEAP32[((argp) >> 2)];
          var c_oflag = HEAP32[(((argp) + (4)) >> 2)];
          var c_cflag = HEAP32[(((argp) + (8)) >> 2)];
          var c_lflag = HEAP32[(((argp) + (12)) >> 2)];
          var c_cc = [];
          for (var i = 0; i < 32; i++) {
            c_cc.push(HEAP8[(argp + i) + (17)]);
          }
          return stream.tty.ops.ioctl_tcsets(stream.tty, op, {
            c_iflag,
            c_oflag,
            c_cflag,
            c_lflag,
            c_cc
          });
        }
        return 0;
      }

     case 21519:
      {
        if (!stream.tty) return -59;
        var argp = syscallGetVarargP();
        HEAP32[((argp) >> 2)] = 0;
        return 0;
      }

     case 21520:
      {
        if (!stream.tty) return -59;
        return -28;
      }

     case 21537:
     case 21531:
      {
        var argp = syscallGetVarargP();
        return FS.ioctl(stream, op, argp);
      }

     case 21523:
      {
        // TODO: in theory we should write to the winsize struct that gets
        // passed in, but for now musl doesn't read anything on it
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tiocgwinsz) {
          var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
          var argp = syscallGetVarargP();
          HEAP16[((argp) >> 1)] = winsize[0];
          HEAP16[(((argp) + (2)) >> 1)] = winsize[1];
        }
        return 0;
      }

     case 21524:
      {
        // TODO: technically, this ioctl call should change the window size.
        // but, since emscripten doesn't have any concept of a terminal window
        // yet, we'll just silently throw it away as we do TIOCGWINSZ
        if (!stream.tty) return -59;
        return 0;
      }

     case 21515:
      {
        if (!stream.tty) return -59;
        return 0;
      }

     default:
      return -28;
    }
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_lstat64(path, buf) {
  try {
    path = SYSCALLS.getStr(path);
    return SYSCALLS.writeStat(buf, FS.lstat(path));
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_mkdirat(dirfd, path, mode) {
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    mode &= ~SYSCALLS.currentUmask;
    FS.mkdir(path, mode, 0);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_mknodat(dirfd, path, mode, dev) {
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    mode &= ~SYSCALLS.currentUmask;
    // we don't want this in the JS API as it uses mknod to create all nodes.
    switch (mode & 61440) {
     case 32768:
     case 8192:
     case 24576:
     case 4096:
     case 49152:
      break;

     default:
      return -28;
    }
    FS.mknod(path, mode, dev);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_newfstatat(dirfd, path, buf, flags) {
  try {
    path = SYSCALLS.getStr(path);
    var nofollow = flags & 256;
    var allowEmpty = flags & 4096;
    flags = flags & (~6400);
    path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
    return SYSCALLS.writeStat(buf, nofollow ? FS.lstat(path) : FS.stat(path));
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_openat(dirfd, path, flags, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    var mode = varargs ? syscallGetVarargI() : 0;
    if (flags & 64) {
      mode &= ~SYSCALLS.currentUmask;
    }
    return FS.open(path, flags, mode).fd;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var PIPEFS = {
  BUCKET_BUFFER_SIZE: 8192,
  mount(mount) {
    // Do not pollute the real root directory or its child nodes with pipes
    // Looks like it is OK to create another pseudo-root node not linked to the FS.root hierarchy this way
    return FS.createNode(null, "/", 16384 | 511, 0);
  },
  createPipe() {
    var pipe = {
      buckets: [],
      // refcnt 2 because pipe has a read end and a write end. We need to be
      // able to read from the read end after write end is closed.
      refcnt: 2,
      timestamp: new Date
    };
    pipe.buckets.push({
      buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
      offset: 0,
      roffset: 0
    });
    var rName = PIPEFS.nextname();
    var wName = PIPEFS.nextname();
    var rNode = FS.createNode(PIPEFS.root, rName, 4096, 0);
    var wNode = FS.createNode(PIPEFS.root, wName, 4096, 0);
    rNode.pipe = pipe;
    wNode.pipe = pipe;
    var readableStream = FS.createStream({
      path: rName,
      node: rNode,
      flags: 0,
      seekable: false,
      stream_ops: PIPEFS.stream_ops
    });
    rNode.stream = readableStream;
    var writableStream = FS.createStream({
      path: wName,
      node: wNode,
      flags: 1,
      seekable: false,
      stream_ops: PIPEFS.stream_ops
    });
    wNode.stream = writableStream;
    return {
      readable_fd: readableStream.fd,
      writable_fd: writableStream.fd
    };
  },
  stream_ops: {
    getattr(stream) {
      var node = stream.node;
      var timestamp = node.pipe.timestamp;
      return {
        dev: 14,
        ino: node.id,
        mode: 4480,
        nlink: 1,
        uid: 0,
        gid: 0,
        rdev: 0,
        size: 0,
        atime: timestamp,
        mtime: timestamp,
        ctime: timestamp,
        blksize: 4096,
        blocks: 0
      };
    },
    poll(stream, timeout, notifyCallback) {
      var pipe = stream.node.pipe;
      if ((stream.flags & 2097155) === 1) {
        return (256 | 4);
      }
      for (var bucket of pipe.buckets) {
        if (bucket.offset - bucket.roffset > 0) {
          return (64 | 1);
        }
      }
      return 0;
    },
    dup(stream) {
      stream.node.pipe.refcnt++;
    },
    ioctl(stream, request, argp) {
      if (request == 21531) {
        var pipe = stream.node.pipe;
        var currentLength = 0;
        for (var bucket of pipe.buckets) {
          currentLength += bucket.offset - bucket.roffset;
        }
        HEAP32[((argp) >> 2)] = currentLength;
        return 0;
      }
      return 28;
    },
    fsync(stream) {
      return 28;
    },
    read(stream, buffer, offset, length, position) {
      var pipe = stream.node.pipe;
      var currentLength = 0;
      for (var bucket of pipe.buckets) {
        currentLength += bucket.offset - bucket.roffset;
      }
      var data = buffer.subarray(offset, offset + length);
      if (length <= 0) {
        return 0;
      }
      if (currentLength == 0) {
        // Behave as if the read end is always non-blocking
        throw new FS.ErrnoError(6);
      }
      var toRead = Math.min(currentLength, length);
      var totalRead = toRead;
      var toRemove = 0;
      for (var bucket of pipe.buckets) {
        var bucketSize = bucket.offset - bucket.roffset;
        if (toRead <= bucketSize) {
          var tmpSlice = bucket.buffer.subarray(bucket.roffset, bucket.offset);
          if (toRead < bucketSize) {
            tmpSlice = tmpSlice.subarray(0, toRead);
            bucket.roffset += toRead;
          } else {
            toRemove++;
          }
          data.set(tmpSlice);
          break;
        } else {
          var tmpSlice = bucket.buffer.subarray(bucket.roffset, bucket.offset);
          data.set(tmpSlice);
          data = data.subarray(tmpSlice.byteLength);
          toRead -= tmpSlice.byteLength;
          toRemove++;
        }
      }
      if (toRemove && toRemove == pipe.buckets.length) {
        // Do not generate excessive garbage in use cases such as
        // write several bytes, read everything, write several bytes, read everything...
        toRemove--;
        pipe.buckets[toRemove].offset = 0;
        pipe.buckets[toRemove].roffset = 0;
      }
      pipe.buckets.splice(0, toRemove);
      return totalRead;
    },
    write(stream, buffer, offset, length, position) {
      var pipe = stream.node.pipe;
      var data = buffer.subarray(offset, offset + length);
      var dataLen = data.byteLength;
      if (dataLen <= 0) {
        return 0;
      }
      var currBucket = null;
      if (pipe.buckets.length == 0) {
        currBucket = {
          buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
          offset: 0,
          roffset: 0
        };
        pipe.buckets.push(currBucket);
      } else {
        currBucket = pipe.buckets[pipe.buckets.length - 1];
      }
      var freeBytesInCurrBuffer = PIPEFS.BUCKET_BUFFER_SIZE - currBucket.offset;
      if (freeBytesInCurrBuffer >= dataLen) {
        currBucket.buffer.set(data, currBucket.offset);
        currBucket.offset += dataLen;
        return dataLen;
      } else if (freeBytesInCurrBuffer > 0) {
        currBucket.buffer.set(data.subarray(0, freeBytesInCurrBuffer), currBucket.offset);
        currBucket.offset += freeBytesInCurrBuffer;
        data = data.subarray(freeBytesInCurrBuffer, data.byteLength);
      }
      var numBuckets = (data.byteLength / PIPEFS.BUCKET_BUFFER_SIZE) | 0;
      var remElements = data.byteLength % PIPEFS.BUCKET_BUFFER_SIZE;
      for (var i = 0; i < numBuckets; i++) {
        var newBucket = {
          buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
          offset: PIPEFS.BUCKET_BUFFER_SIZE,
          roffset: 0
        };
        pipe.buckets.push(newBucket);
        newBucket.buffer.set(data.subarray(0, PIPEFS.BUCKET_BUFFER_SIZE));
        data = data.subarray(PIPEFS.BUCKET_BUFFER_SIZE, data.byteLength);
      }
      if (remElements > 0) {
        var newBucket = {
          buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
          offset: data.byteLength,
          roffset: 0
        };
        pipe.buckets.push(newBucket);
        newBucket.buffer.set(data);
      }
      return dataLen;
    },
    close(stream) {
      var pipe = stream.node.pipe;
      pipe.refcnt--;
      if (pipe.refcnt === 0) {
        pipe.buckets = null;
      }
    }
  },
  nextname() {
    if (!PIPEFS.nextname.current) {
      PIPEFS.nextname.current = 0;
    }
    return "pipe[" + (PIPEFS.nextname.current++) + "]";
  }
};

function ___syscall_pipe2(fdPtr, flags) {
  try {
    if (fdPtr == 0) {
      throw new FS.ErrnoError(21);
    }
    var validFlags = 524288 | 2048;
    if (flags & ~validFlags) {
      throw new FS.ErrnoError(138);
    }
    var res = PIPEFS.createPipe();
    if (flags & 2048) {
      FS.getStream(res.readable_fd).flags |= 2048;
      FS.getStream(res.writable_fd).flags |= 2048;
    }
    HEAP32[((fdPtr) >> 2)] = res.readable_fd;
    HEAP32[(((fdPtr) + (4)) >> 2)] = res.writable_fd;
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var doPoll = (fds, nfds, timeout, makeNotifyCallback) => {
  var count = 0;
  for (var i = 0; i < nfds; i++) {
    var pollfd = fds + 8 * i;
    var fd = HEAP32[((pollfd) >> 2)];
    var events = HEAP16[(((pollfd) + (4)) >> 1)];
    var flags = 32;
    var stream = FS.getStream(fd);
    if (stream) {
      if (stream.stream_ops.poll) {
        flags = timeout ? stream.stream_ops.poll(stream, timeout, makeNotifyCallback(stream, pollfd)) : stream.stream_ops.poll(stream, -1);
      } else {
        flags = 5;
      }
    }
    flags &= events | 8 | 16 | 32;
    if (flags) count++;
    HEAP16[(((pollfd) + (6)) >> 1)] = flags;
  }
  return count;
};

function ___syscall_poll(fds, nfds, timeout) {
  try {
    var count = doPoll(fds, nfds, 0, undefined);
    return count;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_poll_nonblocking(fds, nfds) {
  try {
    return doPoll(fds, nfds, 0, undefined);
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_readlinkat(dirfd, path, buf, bufsize) {
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    if (bufsize <= 0) return -28;
    var ret = FS.readlink(path);
    var len = Math.min(bufsize, lengthBytesUTF8(ret));
    var endChar = HEAP8[buf + len];
    stringToUTF8(ret, buf, bufsize + 1);
    // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
    // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
    HEAP8[buf + len] = endChar;
    return len;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_renameat(olddirfd, oldpath, newdirfd, newpath) {
  try {
    oldpath = SYSCALLS.getStr(oldpath);
    newpath = SYSCALLS.getStr(newpath);
    oldpath = SYSCALLS.calculateAt(olddirfd, oldpath);
    newpath = SYSCALLS.calculateAt(newdirfd, newpath);
    FS.rename(oldpath, newpath);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_rmdir(path) {
  try {
    path = SYSCALLS.getStr(path);
    FS.rmdir(path);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_stat64(path, buf) {
  try {
    path = SYSCALLS.getStr(path);
    return SYSCALLS.writeStat(buf, FS.stat(path));
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_symlinkat(target, dirfd, linkpath) {
  try {
    target = SYSCALLS.getStr(target);
    linkpath = SYSCALLS.getStr(linkpath);
    linkpath = SYSCALLS.calculateAt(dirfd, linkpath);
    FS.symlink(target, linkpath);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_truncate64(path, length) {
  length = bigintToI53Checked(length);
  try {
    if (isNaN(length)) return -22;
    path = SYSCALLS.getStr(path);
    FS.truncate(path, length);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_umask(mask) {
  try {
    var old = SYSCALLS.currentUmask;
    SYSCALLS.currentUmask = mask;
    return old;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_unlinkat(dirfd, path, flags) {
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    if (!flags) {
      FS.unlink(path);
    } else if (flags === 512) {
      FS.rmdir(path);
    } else {
      return -28;
    }
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var readI53FromI64 = ptr => HEAPU32[((ptr) >> 2)] + HEAP32[(((ptr) + (4)) >> 2)] * 4294967296;

function ___syscall_utimensat(dirfd, path, times, flags) {
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path, true);
    var now = Date.now(), atime, mtime;
    if (!times) {
      atime = now;
      mtime = now;
    } else {
      var seconds = readI53FromI64(times);
      var nanoseconds = HEAP32[(((times) + (8)) >> 2)];
      if (nanoseconds == 1073741823) {
        atime = now;
      } else if (nanoseconds == 1073741822) {
        atime = null;
      } else {
        atime = (seconds * 1e3) + (nanoseconds / (1e3 * 1e3));
      }
      times += 16;
      seconds = readI53FromI64(times);
      nanoseconds = HEAP32[(((times) + (8)) >> 2)];
      if (nanoseconds == 1073741823) {
        mtime = now;
      } else if (nanoseconds == 1073741822) {
        mtime = null;
      } else {
        mtime = (seconds * 1e3) + (nanoseconds / (1e3 * 1e3));
      }
    }
    // null here means UTIME_OMIT was passed. If both were set to UTIME_OMIT then
    // we can skip the call completely.
    if ((mtime ?? atime) !== null) {
      FS.utime(path, atime, mtime);
    }
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var __abort_js = () => abort("");

var runtimeKeepaliveCounter = 0;

var __emscripten_runtime_keepalive_clear = () => {
  noExitRuntime = false;
  runtimeKeepaliveCounter = 0;
};

var __emscripten_system = command => {
  // int system(const char *command);
  // http://pubs.opengroup.org/onlinepubs/000095399/functions/system.html
  // Can't call external programs.
  if (!command) return 0;
  // no shell available
  return -52;
};

var __emscripten_throw_longjmp = () => {
  throw new EmscriptenSjLj;
};

function __gmtime_js(time, tmPtr) {
  time = bigintToI53Checked(time);
  var date = new Date(time * 1e3);
  if (isNaN(date.getTime())) {
    return 1;
  }
  HEAP32[((tmPtr) >> 2)] = date.getUTCSeconds();
  HEAP32[(((tmPtr) + (4)) >> 2)] = date.getUTCMinutes();
  HEAP32[(((tmPtr) + (8)) >> 2)] = date.getUTCHours();
  HEAP32[(((tmPtr) + (12)) >> 2)] = date.getUTCDate();
  HEAP32[(((tmPtr) + (16)) >> 2)] = date.getUTCMonth();
  HEAP32[(((tmPtr) + (20)) >> 2)] = date.getUTCFullYear() - 1900;
  HEAP32[(((tmPtr) + (24)) >> 2)] = date.getUTCDay();
  var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
  var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
  HEAP32[(((tmPtr) + (28)) >> 2)] = yday;
  return 0;
}

var isLeapYear = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

var MONTH_DAYS_LEAP_CUMULATIVE = [ 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335 ];

var MONTH_DAYS_REGULAR_CUMULATIVE = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334 ];

var ydayFromDate = date => {
  var leap = isLeapYear(date.getFullYear());
  var monthDaysCumulative = (leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE);
  var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
  // -1 since it's days since Jan 1
  return yday;
};

function __localtime_js(time, tmPtr) {
  time = bigintToI53Checked(time);
  var date = new Date(time * 1e3);
  if (isNaN(date.getTime())) {
    return 1;
  }
  HEAP32[((tmPtr) >> 2)] = date.getSeconds();
  HEAP32[(((tmPtr) + (4)) >> 2)] = date.getMinutes();
  HEAP32[(((tmPtr) + (8)) >> 2)] = date.getHours();
  HEAP32[(((tmPtr) + (12)) >> 2)] = date.getDate();
  HEAP32[(((tmPtr) + (16)) >> 2)] = date.getMonth();
  HEAP32[(((tmPtr) + (20)) >> 2)] = date.getFullYear() - 1900;
  HEAP32[(((tmPtr) + (24)) >> 2)] = date.getDay();
  var yday = ydayFromDate(date) | 0;
  HEAP32[(((tmPtr) + (28)) >> 2)] = yday;
  HEAP32[(((tmPtr) + (36)) >> 2)] = -(date.getTimezoneOffset() * 60);
  // Attention: DST is in December in South, and some regions don't have DST at all.
  var start = new Date(date.getFullYear(), 0, 1);
  var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  var winterOffset = start.getTimezoneOffset();
  var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
  HEAP32[(((tmPtr) + (32)) >> 2)] = dst;
  return 0;
}

var __mktime_js = function(tmPtr) {
  var ret = (() => {
    var date = new Date(HEAP32[(((tmPtr) + (20)) >> 2)] + 1900, HEAP32[(((tmPtr) + (16)) >> 2)], HEAP32[(((tmPtr) + (12)) >> 2)], HEAP32[(((tmPtr) + (8)) >> 2)], HEAP32[(((tmPtr) + (4)) >> 2)], HEAP32[((tmPtr) >> 2)], 0);
    if (isNaN(date.getTime())) {
      return -1;
    }
    // There's an ambiguous hour when the time goes back; the tm_isdst field is
    // used to disambiguate it.  Date() basically guesses, so we fix it up if it
    // guessed wrong, or fill in tm_isdst with the guess if it's -1.
    var dst = HEAP32[(((tmPtr) + (32)) >> 2)];
    var guessedOffset = date.getTimezoneOffset();
    var start = new Date(date.getFullYear(), 0, 1);
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dstOffset = Math.min(winterOffset, summerOffset);
    // DST is in December in South
    if (dst < 0) {
      // Attention: some regions don't have DST at all.
      dst = Number(summerOffset != winterOffset && dstOffset == guessedOffset);
    } else if ((dst > 0) != (dstOffset == guessedOffset)) {
      var nonDstOffset = Math.max(winterOffset, summerOffset);
      var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
      // Don't try setMinutes(date.getMinutes() + ...) -- it's messed up.
      date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4);
      if (isNaN(date.getTime())) {
        return -1;
      }
    }
    HEAP32[(((tmPtr) + (32)) >> 2)] = dst;
    HEAP32[(((tmPtr) + (24)) >> 2)] = date.getDay();
    var yday = ydayFromDate(date) | 0;
    HEAP32[(((tmPtr) + (28)) >> 2)] = yday;
    // To match expected behavior, update fields from date
    HEAP32[((tmPtr) >> 2)] = date.getSeconds();
    HEAP32[(((tmPtr) + (4)) >> 2)] = date.getMinutes();
    HEAP32[(((tmPtr) + (8)) >> 2)] = date.getHours();
    HEAP32[(((tmPtr) + (12)) >> 2)] = date.getDate();
    HEAP32[(((tmPtr) + (16)) >> 2)] = date.getMonth();
    HEAP32[(((tmPtr) + (20)) >> 2)] = date.getYear();
    // Return time in seconds
    return date.getTime() / 1e3;
  })();
  return BigInt(ret);
};

function __mmap_js(len, prot, flags, fd, offset, allocated, addr) {
  offset = bigintToI53Checked(offset);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var res = FS.mmap(stream, len, offset, prot, flags);
    var ptr = res.ptr;
    HEAP32[((allocated) >> 2)] = res.allocated;
    HEAPU32[((addr) >> 2)] = ptr;
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function __munmap_js(addr, len, prot, flags, fd, offset) {
  offset = bigintToI53Checked(offset);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    if (prot & 2) {
      SYSCALLS.doMsync(addr, stream, len, flags, offset);
    }
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var timers = {};

var handleException = e => {
  // Certain exception types we do not treat as errors since they are used for
  // internal control flow.
  // 1. ExitStatus, which is thrown by exit()
  // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
  //    that wish to return to JS event loop.
  if (e instanceof ExitStatus || e == "unwind") {
    return EXITSTATUS;
  }
  quit_(1, e);
};

var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;

var _proc_exit = code => {
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    Module["onExit"]?.(code);
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
};

/** @param {boolean|number=} implicit */ var exitJS = (status, implicit) => {
  EXITSTATUS = status;
  _proc_exit(status);
};

var _exit = exitJS;

var maybeExit = () => {
  if (!keepRuntimeAlive()) {
    try {
      _exit(EXITSTATUS);
    } catch (e) {
      handleException(e);
    }
  }
};

var callUserCallback = func => {
  if (ABORT) {
    return;
  }
  try {
    return func();
  } catch (e) {
    handleException(e);
  } finally {
    maybeExit();
  }
};

var _emscripten_get_now = () => performance.now();

var __setitimer_js = (which, timeout_ms) => {
  // First, clear any existing timer.
  if (timers[which]) {
    clearTimeout(timers[which].id);
    delete timers[which];
  }
  // A timeout of zero simply cancels the current timeout so we have nothing
  // more to do.
  if (!timeout_ms) return 0;
  var id = setTimeout(() => {
    delete timers[which];
    callUserCallback(() => __emscripten_timeout(which, _emscripten_get_now()));
  }, timeout_ms);
  timers[which] = {
    id,
    timeout_ms
  };
  return 0;
};

var __tzset_js = (timezone, daylight, std_name, dst_name) => {
  // TODO: Use (malleable) environment variables instead of system settings.
  var currentYear = (new Date).getFullYear();
  var winter = new Date(currentYear, 0, 1);
  var summer = new Date(currentYear, 6, 1);
  var winterOffset = winter.getTimezoneOffset();
  var summerOffset = summer.getTimezoneOffset();
  // Local standard timezone offset. Local standard time is not adjusted for
  // daylight savings.  This code uses the fact that getTimezoneOffset returns
  // a greater value during Standard Time versus Daylight Saving Time (DST).
  // Thus it determines the expected output during Standard Time, and it
  // compares whether the output of the given date the same (Standard) or less
  // (DST).
  var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  // timezone is specified as seconds west of UTC ("The external variable
  // `timezone` shall be set to the difference, in seconds, between
  // Coordinated Universal Time (UTC) and local standard time."), the same
  // as returned by stdTimezoneOffset.
  // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
  HEAPU32[((timezone) >> 2)] = stdTimezoneOffset * 60;
  HEAP32[((daylight) >> 2)] = Number(winterOffset != summerOffset);
  var extractZone = timezoneOffset => {
    // Why inverse sign?
    // Read here https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
    var sign = timezoneOffset >= 0 ? "-" : "+";
    var absOffset = Math.abs(timezoneOffset);
    var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
    var minutes = String(absOffset % 60).padStart(2, "0");
    return `UTC${sign}${hours}${minutes}`;
  };
  var winterName = extractZone(winterOffset);
  var summerName = extractZone(summerOffset);
  if (summerOffset < winterOffset) {
    // Northern hemisphere
    stringToUTF8(winterName, std_name, 17);
    stringToUTF8(summerName, dst_name, 17);
  } else {
    stringToUTF8(winterName, dst_name, 17);
    stringToUTF8(summerName, std_name, 17);
  }
};

var _emscripten_date_now = () => Date.now();

var nowIsMonotonic = 1;

var checkWasiClock = clock_id => clock_id >= 0 && clock_id <= 3;

function _clock_time_get(clk_id, ignored_precision, ptime) {
  ignored_precision = bigintToI53Checked(ignored_precision);
  if (!checkWasiClock(clk_id)) {
    return 28;
  }
  var now;
  // all wasi clocks but realtime are monotonic
  if (clk_id === 0) {
    now = _emscripten_date_now();
  } else if (nowIsMonotonic) {
    now = _emscripten_get_now();
  } else {
    return 52;
  }
  // "now" is in ms, and wasi times are in ns.
  var nsec = Math.round(now * 1e3 * 1e3);
  HEAP64[((ptime) >> 3)] = BigInt(nsec);
  return 0;
}

var getHeapMax = () => // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
// full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
// for any code that deals with heap sizes, which would require special
// casing all heap size related code to treat 0 specially.
2147483648;

var _emscripten_get_heap_max = () => getHeapMax();

var growMemory = size => {
  var oldHeapSize = wasmMemory.buffer.byteLength;
  var pages = ((size - oldHeapSize + 65535) / 65536) | 0;
  try {
    // round size grow request up to wasm page size (fixed 64KB per spec)
    wasmMemory.grow(pages);
    // .grow() takes a delta compared to the previous size
    updateMemoryViews();
    return 1;
  } catch (e) {}
};

var _emscripten_resize_heap = requestedSize => {
  var oldSize = HEAPU8.length;
  // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
  requestedSize >>>= 0;
  // With multithreaded builds, races can happen (another thread might increase the size
  // in between), so return a failure, and let the caller retry.
  // Memory resize rules:
  // 1.  Always increase heap size to at least the requested size, rounded up
  //     to next page multiple.
  // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
  //     geometrically: increase the heap size according to
  //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
  //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
  // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
  //     linearly: increase the heap size by at least
  //     MEMORY_GROWTH_LINEAR_STEP bytes.
  // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
  //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
  // 4.  If we were unable to allocate as much memory, it may be due to
  //     over-eager decision to excessively reserve due to (3) above.
  //     Hence if an allocation fails, cut down on the amount of excess
  //     growth, in an attempt to succeed to perform a smaller allocation.
  // A limit is set for how much we can grow. We should not exceed that
  // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
  var maxHeapSize = getHeapMax();
  if (requestedSize > maxHeapSize) {
    return false;
  }
  // Loop through potential heap size increases. If we attempt a too eager
  // reservation that fails, cut down on the attempted size and reserve a
  // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
  for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
    var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
    // ensure geometric growth
    // but limit overreserving (default to capping at +96MB overgrowth at most)
    overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
    var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
    var replacement = growMemory(newSize);
    if (replacement) {
      return true;
    }
  }
  return false;
};

var ENV = {};

var getExecutableName = () => thisProgram;

var getEnvStrings = () => {
  if (!getEnvStrings.strings) {
    // Default values.
    var lang = (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8";
    var env = {
      "USER": "web_user",
      "LOGNAME": "web_user",
      "PATH": "/",
      "PWD": "/",
      "HOME": "/home/web_user",
      "LANG": lang,
      "_": getExecutableName()
    };
    // Apply the user-provided values, if any.
    for (var x in ENV) {
      // x is a key in ENV; if ENV[x] is undefined, that means it was
      // explicitly set to be so. We allow user code to do that to
      // force variables with default values to remain unset.
      if (ENV[x] === undefined) delete env[x]; else env[x] = ENV[x];
    }
    var strings = [];
    for (var x in env) {
      strings.push(`${x}=${env[x]}`);
    }
    getEnvStrings.strings = strings;
  }
  return getEnvStrings.strings;
};

var _environ_get = (__environ, environ_buf) => {
  var bufSize = 0;
  var envp = 0;
  for (var string of getEnvStrings()) {
    var ptr = environ_buf + bufSize;
    HEAPU32[(((__environ) + (envp)) >> 2)] = ptr;
    bufSize += stringToUTF8(string, ptr, Infinity) + 1;
    envp += 4;
  }
  return 0;
};

var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
  var strings = getEnvStrings();
  HEAPU32[((penviron_count) >> 2)] = strings.length;
  var bufSize = 0;
  for (var string of strings) {
    bufSize += lengthBytesUTF8(string) + 1;
  }
  HEAPU32[((penviron_buf_size) >> 2)] = bufSize;
  return 0;
};

function _fd_close(fd) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.close(stream);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

function _fd_fdstat_get(fd, pbuf) {
  try {
    var rightsBase = 0;
    var rightsInheriting = 0;
    var flags = 0;
    {
      var stream = SYSCALLS.getStreamFromFD(fd);
      // All character devices are terminals (other things a Linux system would
      // assume is a character device, like the mouse, we have special APIs for).
      var type = stream.tty ? 2 : FS.isDir(stream.mode) ? 3 : FS.isLink(stream.mode) ? 7 : 4;
    }
    HEAP8[pbuf] = type;
    HEAP16[(((pbuf) + (2)) >> 1)] = flags;
    HEAP64[(((pbuf) + (8)) >> 3)] = BigInt(rightsBase);
    HEAP64[(((pbuf) + (16)) >> 3)] = BigInt(rightsInheriting);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

/** @param {number=} offset */ var doReadv = (stream, iov, iovcnt, offset) => {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = HEAPU32[((iov) >> 2)];
    var len = HEAPU32[(((iov) + (4)) >> 2)];
    iov += 8;
    var curr = FS.read(stream, HEAP8, ptr, len, offset);
    if (curr < 0) return -1;
    ret += curr;
    if (curr < len) break;
    // nothing more to read
    if (typeof offset != "undefined") {
      offset += curr;
    }
  }
  return ret;
};

function _fd_read(fd, iov, iovcnt, pnum) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = doReadv(stream, iov, iovcnt);
    HEAPU32[((pnum) >> 2)] = num;
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

function _fd_seek(fd, offset, whence, newOffset) {
  offset = bigintToI53Checked(offset);
  try {
    if (isNaN(offset)) return 22;
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.llseek(stream, offset, whence);
    HEAP64[((newOffset) >> 3)] = BigInt(stream.position);
    if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
    // reset readdir state
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

function _fd_sync(fd) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var rtn = stream.stream_ops?.fsync?.(stream);
    return rtn;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

/** @param {number=} offset */ var doWritev = (stream, iov, iovcnt, offset) => {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = HEAPU32[((iov) >> 2)];
    var len = HEAPU32[(((iov) + (4)) >> 2)];
    iov += 8;
    var curr = FS.write(stream, HEAP8, ptr, len, offset);
    if (curr < 0) return -1;
    ret += curr;
    if (curr < len) {
      // No more space to write.
      break;
    }
    if (typeof offset != "undefined") {
      offset += curr;
    }
  }
  return ret;
};

function _fd_write(fd, iov, iovcnt, pnum) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = doWritev(stream, iov, iovcnt);
    HEAPU32[((pnum) >> 2)] = num;
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

var arraySum = (array, index) => {
  var sum = 0;
  for (var i = 0; i <= index; sum += array[i++]) {}
  return sum;
};

var MONTH_DAYS_LEAP = [ 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

var MONTH_DAYS_REGULAR = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

var addDays = (date, days) => {
  var newDate = new Date(date.getTime());
  while (days > 0) {
    var leap = isLeapYear(newDate.getFullYear());
    var currentMonth = newDate.getMonth();
    var daysInCurrentMonth = (leap ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[currentMonth];
    if (days > daysInCurrentMonth - newDate.getDate()) {
      // we spill over to next month
      days -= (daysInCurrentMonth - newDate.getDate() + 1);
      newDate.setDate(1);
      if (currentMonth < 11) {
        newDate.setMonth(currentMonth + 1);
      } else {
        newDate.setMonth(0);
        newDate.setFullYear(newDate.getFullYear() + 1);
      }
    } else {
      // we stay in current month
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    }
  }
  return newDate;
};

var _strptime = (buf, format, tm) => {
  // char *strptime(const char *restrict buf, const char *restrict format, struct tm *restrict tm);
  // http://pubs.opengroup.org/onlinepubs/009695399/functions/strptime.html
  var pattern = UTF8ToString(format);
  // escape special characters
  // TODO: not sure we really need to escape all of these in JS regexps
  var SPECIAL_CHARS = "\\!@#$^&*()+=-[]/{}|:<>?,.";
  for (var i = 0, ii = SPECIAL_CHARS.length; i < ii; ++i) {
    pattern = pattern.replace(new RegExp("\\" + SPECIAL_CHARS[i], "g"), "\\" + SPECIAL_CHARS[i]);
  }
  // reduce number of matchers
  var EQUIVALENT_MATCHERS = {
    "A": "%a",
    "B": "%b",
    "c": "%a %b %d %H:%M:%S %Y",
    "D": "%m\\/%d\\/%y",
    "e": "%d",
    "F": "%Y-%m-%d",
    "h": "%b",
    "R": "%H\\:%M",
    "r": "%I\\:%M\\:%S\\s%p",
    "T": "%H\\:%M\\:%S",
    "x": "%m\\/%d\\/(?:%y|%Y)",
    "X": "%H\\:%M\\:%S"
  };
  // TODO: take care of locale
  var DATE_PATTERNS = {
    /* weekday name */ "a": "(?:Sun(?:day)?)|(?:Mon(?:day)?)|(?:Tue(?:sday)?)|(?:Wed(?:nesday)?)|(?:Thu(?:rsday)?)|(?:Fri(?:day)?)|(?:Sat(?:urday)?)",
    /* month name */ "b": "(?:Jan(?:uary)?)|(?:Feb(?:ruary)?)|(?:Mar(?:ch)?)|(?:Apr(?:il)?)|May|(?:Jun(?:e)?)|(?:Jul(?:y)?)|(?:Aug(?:ust)?)|(?:Sep(?:tember)?)|(?:Oct(?:ober)?)|(?:Nov(?:ember)?)|(?:Dec(?:ember)?)",
    /* century */ "C": "\\d\\d",
    /* day of month */ "d": "0[1-9]|[1-9](?!\\d)|1\\d|2\\d|30|31",
    /* hour (24hr) */ "H": "\\d(?!\\d)|[0,1]\\d|20|21|22|23",
    /* hour (12hr) */ "I": "\\d(?!\\d)|0\\d|10|11|12",
    /* day of year */ "j": "00[1-9]|0?[1-9](?!\\d)|0?[1-9]\\d(?!\\d)|[1,2]\\d\\d|3[0-6]\\d",
    /* month */ "m": "0[1-9]|[1-9](?!\\d)|10|11|12",
    /* minutes */ "M": "0\\d|\\d(?!\\d)|[1-5]\\d",
    /* whitespace */ "n": " ",
    /* AM/PM */ "p": "AM|am|PM|pm|A\\.M\\.|a\\.m\\.|P\\.M\\.|p\\.m\\.",
    /* seconds */ "S": "0\\d|\\d(?!\\d)|[1-5]\\d|60",
    /* week number */ "U": "0\\d|\\d(?!\\d)|[1-4]\\d|50|51|52|53",
    /* week number */ "W": "0\\d|\\d(?!\\d)|[1-4]\\d|50|51|52|53",
    /* weekday number */ "w": "[0-6]",
    /* 2-digit year */ "y": "\\d\\d",
    /* 4-digit year */ "Y": "\\d\\d\\d\\d",
    /* whitespace */ "t": " ",
    /* time zone */ "z": "Z|(?:[\\+\\-]\\d\\d:?(?:\\d\\d)?)"
  };
  var MONTH_NUMBERS = {
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11
  };
  var DAY_NUMBERS_SUN_FIRST = {
    SUN: 0,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6
  };
  var DAY_NUMBERS_MON_FIRST = {
    MON: 0,
    TUE: 1,
    WED: 2,
    THU: 3,
    FRI: 4,
    SAT: 5,
    SUN: 6
  };
  var capture = [];
  var pattern_out = pattern.replace(/%(.)/g, (m, c) => EQUIVALENT_MATCHERS[c] || m).replace(/%(.)/g, (_, c) => {
    let pat = DATE_PATTERNS[c];
    if (pat) {
      capture.push(c);
      return `(${pat})`;
    } else {
      return c;
    }
  }).replace(// any number of space or tab characters match zero or more spaces
  /\s+/g, "\\s*");
  var matches = new RegExp("^" + pattern_out, "i").exec(UTF8ToString(buf));
  function initDate() {
    function fixup(value, min, max) {
      return (typeof value != "number" || isNaN(value)) ? min : (value >= min ? (value <= max ? value : max) : min);
    }
    return {
      year: fixup(HEAP32[(((tm) + (20)) >> 2)] + 1900, 1970, 9999),
      month: fixup(HEAP32[(((tm) + (16)) >> 2)], 0, 11),
      day: fixup(HEAP32[(((tm) + (12)) >> 2)], 1, 31),
      hour: fixup(HEAP32[(((tm) + (8)) >> 2)], 0, 23),
      min: fixup(HEAP32[(((tm) + (4)) >> 2)], 0, 59),
      sec: fixup(HEAP32[((tm) >> 2)], 0, 59),
      gmtoff: 0
    };
  }
  if (matches) {
    var date = initDate();
    var value;
    var getMatch = symbol => {
      var pos = capture.indexOf(symbol);
      // check if symbol appears in regexp
      if (pos >= 0) {
        // return matched value or null (falsy!) for non-matches
        return matches[pos + 1];
      }
      return;
    };
    // seconds
    if ((value = getMatch("S"))) {
      date.sec = Number(value);
    }
    // minutes
    if ((value = getMatch("M"))) {
      date.min = Number(value);
    }
    // hours
    if ((value = getMatch("H"))) {
      // 24h clock
      date.hour = Number(value);
    } else if ((value = getMatch("I"))) {
      // AM/PM clock
      var hour = Number(value);
      if ((value = getMatch("p"))) {
        hour += value.toUpperCase()[0] === "P" ? 12 : 0;
      }
      date.hour = hour;
    }
    // year
    if ((value = getMatch("Y"))) {
      // parse from four-digit year
      date.year = Number(value);
    } else if ((value = getMatch("y"))) {
      // parse from two-digit year...
      var year = Number(value);
      if ((value = getMatch("C"))) {
        // ...and century
        year += Number(value) * 100;
      } else {
        // ...and rule-of-thumb
        year += year < 69 ? 2e3 : 1900;
      }
      date.year = year;
    }
    // month
    if ((value = getMatch("m"))) {
      // parse from month number
      date.month = Number(value) - 1;
    } else if ((value = getMatch("b"))) {
      // parse from month name
      date.month = MONTH_NUMBERS[value.substring(0, 3).toUpperCase()] || 0;
    }
    // day
    if ((value = getMatch("d"))) {
      // get day of month directly
      date.day = Number(value);
    } else if ((value = getMatch("j"))) {
      // get day of month from day of year ...
      var day = Number(value);
      var leapYear = isLeapYear(date.year);
      for (var month = 0; month < 12; ++month) {
        var daysUntilMonth = arraySum(leapYear ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR, month - 1);
        if (day <= daysUntilMonth + (leapYear ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[month]) {
          date.day = day - daysUntilMonth;
        }
      }
    } else if ((value = getMatch("a"))) {
      // get day of month from weekday ...
      var weekDay = value.substring(0, 3).toUpperCase();
      if ((value = getMatch("U"))) {
        // ... and week number (Sunday being first day of week)
        // Week number of the year (Sunday as the first day of the week) as a decimal number [00,53].
        // All days in a new year preceding the first Sunday are considered to be in week 0.
        var weekDayNumber = DAY_NUMBERS_SUN_FIRST[weekDay];
        var weekNumber = Number(value);
        // January 1st
        var janFirst = new Date(date.year, 0, 1);
        var endDate;
        if (janFirst.getDay() === 0) {
          // Jan 1st is a Sunday, and, hence in the 1st CW
          endDate = addDays(janFirst, weekDayNumber + 7 * (weekNumber - 1));
        } else {
          // Jan 1st is not a Sunday, and, hence still in the 0th CW
          endDate = addDays(janFirst, 7 - janFirst.getDay() + weekDayNumber + 7 * (weekNumber - 1));
        }
        date.day = endDate.getDate();
        date.month = endDate.getMonth();
      } else if ((value = getMatch("W"))) {
        // ... and week number (Monday being first day of week)
        // Week number of the year (Monday as the first day of the week) as a decimal number [00,53].
        // All days in a new year preceding the first Monday are considered to be in week 0.
        var weekDayNumber = DAY_NUMBERS_MON_FIRST[weekDay];
        var weekNumber = Number(value);
        // January 1st
        var janFirst = new Date(date.year, 0, 1);
        var endDate;
        if (janFirst.getDay() === 1) {
          // Jan 1st is a Monday, and, hence in the 1st CW
          endDate = addDays(janFirst, weekDayNumber + 7 * (weekNumber - 1));
        } else {
          // Jan 1st is not a Monday, and, hence still in the 0th CW
          endDate = addDays(janFirst, 7 - janFirst.getDay() + 1 + weekDayNumber + 7 * (weekNumber - 1));
        }
        date.day = endDate.getDate();
        date.month = endDate.getMonth();
      }
    }
    // time zone
    if ((value = getMatch("z"))) {
      // GMT offset as either 'Z' or +-HH:MM or +-HH or +-HHMM
      if (value.toLowerCase() === "z") {
        date.gmtoff = 0;
      } else {
        var match = value.match(/^((?:\-|\+)\d\d):?(\d\d)?/);
        date.gmtoff = match[1] * 3600;
        if (match[2]) {
          date.gmtoff += date.gmtoff > 0 ? match[2] * 60 : -match[2] * 60;
        }
      }
    }
    /*
      tm_sec  int seconds after the minute  0-61*
      tm_min  int minutes after the hour  0-59
      tm_hour int hours since midnight  0-23
      tm_mday int day of the month  1-31
      tm_mon  int months since January  0-11
      tm_year int years since 1900
      tm_wday int days since Sunday 0-6
      tm_yday int days since January 1  0-365
      tm_isdst  int Daylight Saving Time flag
      tm_gmtoff long offset from GMT (seconds)
      */ var fullDate = new Date(date.year, date.month, date.day, date.hour, date.min, date.sec, 0);
    HEAP32[((tm) >> 2)] = fullDate.getSeconds();
    HEAP32[(((tm) + (4)) >> 2)] = fullDate.getMinutes();
    HEAP32[(((tm) + (8)) >> 2)] = fullDate.getHours();
    HEAP32[(((tm) + (12)) >> 2)] = fullDate.getDate();
    HEAP32[(((tm) + (16)) >> 2)] = fullDate.getMonth();
    HEAP32[(((tm) + (20)) >> 2)] = fullDate.getFullYear() - 1900;
    HEAP32[(((tm) + (24)) >> 2)] = fullDate.getDay();
    HEAP32[(((tm) + (28)) >> 2)] = arraySum(isLeapYear(fullDate.getFullYear()) ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR, fullDate.getMonth() - 1) + fullDate.getDate() - 1;
    HEAP32[(((tm) + (32)) >> 2)] = 0;
    HEAP32[(((tm) + (36)) >> 2)] = date.gmtoff;
    // we need to convert the matched sequence into an integer array to take care of UTF-8 characters > 0x7F
    // TODO: not sure that intArrayFromString handles all unicode characters correctly
    return buf + lengthBytesUTF8(matches[0]);
  }
  return 0;
};

var stackAlloc = sz => __emscripten_stack_alloc(sz);

var stringToUTF8OnStack = str => {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8(str, ret, size);
  return ret;
};

var setWasmTableEntry = (idx, func) => {
  /** @suppress {checkTypes} */ wasmTable.set(idx, func);
  // With ABORT_ON_WASM_EXCEPTIONS wasmTable.get is overridden to return wrapped
  // functions so we need to call it here to retrieve the potential wrapper correctly
  // instead of just storing 'func' directly into wasmTableMirror
  /** @suppress {checkTypes} */ wasmTableMirror[idx] = wasmTable.get(idx);
};

var freeTableIndexes = [];

var getEmptyTableSlot = () => {
  // Reuse a free index if there is one, otherwise grow.
  if (freeTableIndexes.length) {
    return freeTableIndexes.pop();
  }
  // Grow the table
  return wasmTable["grow"](1);
};

var uleb128EncodeWithLen = arr => {
  const n = arr.length;
  // Note: this LEB128 length encoding produces extra byte for n < 128,
  // but we don't care as it's only used in a temporary representation.
  return [ (n % 128) | 128, n >> 7, ...arr ];
};

var wasmTypeCodes = {
  "i": 127,
  // i32
  "p": 127,
  // i32
  "j": 126,
  // i64
  "f": 125,
  // f32
  "d": 124,
  // f64
  "e": 111
};

var generateTypePack = types => uleb128EncodeWithLen(Array.from(types, type => {
  var code = wasmTypeCodes[type];
  return code;
}));

var convertJsFunctionToWasm = (func, sig) => {
  // TODO: If the type reflection proposal ever makes progress we can use
  // it here instead of creatign a new module.
  var bytes = Uint8Array.of(0, 97, 115, 109, // magic ("\0asm")
  1, 0, 0, 0, // version: 1
  1, // Type section code
  // The module is static, with the exception of the type section, which is
  // generated based on the signature passed in.
  ...uleb128EncodeWithLen([ 1, // count: 1
  96, // param types
  ...generateTypePack(sig.slice(1)), // return types (for now only supporting [] if `void` and single [T] otherwise)
  ...generateTypePack(sig[0] === "v" ? "" : sig[0]) ]), // The rest of the module is static
  2, 7, // import section
  // (import "e" "f" (func 0 (type 0)))
  1, 1, 101, 1, 102, 0, 0, 7, 5, // export section
  // (export "f" (func 0 (type 0)))
  1, 1, 102, 0, 0);
  // We can compile this wasm module synchronously because it is very small.
  // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
  var module = new WebAssembly.Module(bytes);
  var instance = new WebAssembly.Instance(module, {
    "e": {
      "f": func
    }
  });
  var wrappedFunc = instance.exports["f"];
  return wrappedFunc;
};

var getCFunc = ident => {
  var func = Module["_" + ident];
  // closure exported function
  return func;
};

var writeArrayToMemory = (array, buffer) => {
  HEAP8.set(array, buffer);
};

/**
   * @param {string|null=} returnType
   * @param {Array=} argTypes
   * @param {Array=} args
   * @param {Object=} opts
   */ var ccall = (ident, returnType, argTypes, args, opts) => {
  // For fast lookup of conversion functions
  var toC = {
    "string": str => {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) {
        // null string
        ret = stringToUTF8OnStack(str);
      }
      return ret;
    },
    "array": arr => {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };
  function convertReturnValue(ret) {
    if (returnType === "string") {
      return UTF8ToString(ret);
    }
    if (returnType === "boolean") return Boolean(ret);
    return ret;
  }
  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func(...cArgs);
  function onDone(ret) {
    if (stack !== 0) stackRestore(stack);
    return convertReturnValue(ret);
  }
  ret = onDone(ret);
  return ret;
};

var FS_createPath = (...args) => FS.createPath(...args);

var FS_unlink = (...args) => FS.unlink(...args);

var FS_createLazyFile = (...args) => FS.createLazyFile(...args);

var FS_createDevice = (...args) => FS.createDevice(...args);

FS.createPreloadedFile = FS_createPreloadedFile;

FS.preloadFile = FS_preloadFile;

FS.staticInit();

// End JS library code
// include: postlibrary.js
// This file is included after the automatically-generated JS library code
// but before the wasm module is created.
{
  // Begin ATMODULES hooks
  if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
  if (Module["print"]) out = Module["print"];
  if (Module["printErr"]) err = Module["printErr"];
  // End ATMODULES hooks
  if (Module["arguments"]) programArgs = Module["arguments"];
  if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
  var preInit = Module["preInit"];
  if (preInit) {
    if (typeof preInit == "function") Module["preInit"] = preInit = [ preInit ];
    // Written as a loop so that preInit functions that themselves add more
    // preInit functions.  Is this actually needed?
    while (preInit.length > 0) {
      preInit.shift()();
    }
  }
}

// Begin runtime exports
Module["callMain"] = callMain;

Module["addRunDependency"] = addRunDependency;

Module["removeRunDependency"] = removeRunDependency;

Module["ccall"] = ccall;

Module["FS_preloadFile"] = FS_preloadFile;

Module["FS_unlink"] = FS_unlink;

Module["FS_createPath"] = FS_createPath;

Module["FS_createDevice"] = FS_createDevice;

Module["FS"] = FS;

Module["FS_createDataFile"] = FS_createDataFile;

Module["FS_createLazyFile"] = FS_createLazyFile;

// End runtime exports
// Begin JS library exports
// End JS library exports
// end include: postlibrary.js
function unbox_small_structs(type_ptr) {
  type_ptr = type_ptr;
  var type_id = HEAPU16[(type_ptr + 6 >> 1) + 0];
  while (type_id === 13) {
    if (HEAPU32[(type_ptr >> 2) + 0] > 16) {
      break;
    }
    var elements = HEAPU32[(type_ptr + 8 >> 2) + 0];
    var first_element = HEAPU32[(elements >> 2) + 0];
    if (first_element === 0) {
      type_id = 0;
      break;
    } else if (HEAPU32[(elements >> 2) + 1] === 0) {
      type_ptr = first_element;
      type_id = HEAPU16[(first_element + 6 >> 1) + 0];
    } else {
      break;
    }
  }
  return [ type_ptr, type_id ];
}

function ffi_call_js(cif, fn, rvalue, avalue) {
  cif = cif;
  fn = fn;
  rvalue = rvalue;
  avalue = avalue;
  var abi = HEAPU32[(cif >> 2) + 0];
  var nargs = HEAPU32[(cif >> 2) + 1];
  var nfixedargs = HEAPU32[(cif >> 2) + 6];
  var arg_types_ptr = HEAPU32[(cif >> 2) + 2];
  var flags = HEAPU32[(cif >> 2) + 5];
  var rtype_unboxed = unbox_small_structs(HEAPU32[(cif >> 2) + 3]);
  var rtype_ptr = rtype_unboxed[0];
  var rtype_id = rtype_unboxed[1];
  var orig_stack_ptr = stackSave();
  var cur_stack_ptr = orig_stack_ptr;
  var args = [];
  var ret_by_arg = (!!0);
  if (rtype_id === 15) {
    throw new Error("complex ret marshalling nyi");
  }
  if (rtype_id < 0 || rtype_id > 15) {
    throw new Error("Unexpected rtype " + rtype_id);
  }
  if (rtype_id === 4 || rtype_id === 13) {
    args.push(rvalue);
    ret_by_arg = (!!1);
  }
  for (var i = 0; i < nfixedargs; i++) {
    var arg_ptr = HEAPU32[(avalue >> 2) + i];
    var arg_unboxed = unbox_small_structs(HEAPU32[(arg_types_ptr >> 2) + i]);
    var arg_type_ptr = arg_unboxed[0];
    var arg_type_id = arg_unboxed[1];
    switch (arg_type_id) {
     case 1:
     case 10:
     case 9:
      args.push(HEAPU32[(arg_ptr >> 2) + 0]);
      break;

     case 2:
      args.push(HEAPF32[(arg_ptr >> 2) + 0]);
      break;

     case 3:
      args.push(HEAPF64[(arg_ptr >> 3) + 0]);
      break;

     case 5:
      args.push(HEAPU8[arg_ptr + 0]);
      break;

     case 6:
      args.push(HEAP8[arg_ptr + 0]);
      break;

     case 7:
      args.push(HEAPU16[(arg_ptr >> 1) + 0]);
      break;

     case 8:
      args.push(HEAP16[(arg_ptr >> 1) + 0]);
      break;

     case 11:
     case 12:
      args.push(HEAPU64[(arg_ptr >> 3) + 0]);
      break;

     case 4:
      args.push(HEAPU64[(arg_ptr >> 3) + 0]);
      args.push(HEAPU64[(arg_ptr >> 3) + 1]);
      break;

     case 13:
      var size = HEAPU32[(arg_type_ptr >> 2) + 0];
      var align = HEAPU16[(arg_type_ptr + 4 >> 1) + 0];
      ((cur_stack_ptr -= (size)), (cur_stack_ptr &= (~((align) - 1))));
      HEAP8.subarray(cur_stack_ptr, cur_stack_ptr + size).set(HEAP8.subarray(arg_ptr, arg_ptr + size));
      args.push(cur_stack_ptr);
      break;

     case 14:
      args.push(HEAPU32[(arg_ptr >> 2) + 0]);
      break;

     case 15:
      throw new Error("complex marshalling nyi");

     default:
      throw new Error("Unexpected type " + arg_type_id);
    }
  }
  if (flags & 1) {
    var struct_arg_info = [];
    for (var i = nargs - 1; i >= nfixedargs; i--) {
      var arg_ptr = HEAPU32[(avalue >> 2) + i];
      var arg_unboxed = unbox_small_structs(HEAPU32[(arg_types_ptr >> 2) + i]);
      var arg_type_ptr = arg_unboxed[0];
      var arg_type_id = arg_unboxed[1];
      switch (arg_type_id) {
       case 5:
       case 6:
        ((cur_stack_ptr -= (1)), (cur_stack_ptr &= (~((1) - 1))));
        HEAPU8[cur_stack_ptr + 0] = HEAPU8[arg_ptr + 0];
        break;

       case 7:
       case 8:
        ((cur_stack_ptr -= (2)), (cur_stack_ptr &= (~((2) - 1))));
        HEAPU16[(cur_stack_ptr >> 1) + 0] = HEAPU16[(arg_ptr >> 1) + 0];
        break;

       case 1:
       case 9:
       case 10:
       case 2:
        ((cur_stack_ptr -= (4)), (cur_stack_ptr &= (~((4) - 1))));
        HEAPU32[(cur_stack_ptr >> 2) + 0] = HEAPU32[(arg_ptr >> 2) + 0];
        break;

       case 3:
       case 11:
       case 12:
        ((cur_stack_ptr -= (8)), (cur_stack_ptr &= (~((8) - 1))));
        HEAPU32[(cur_stack_ptr >> 2) + 0] = HEAPU32[(arg_ptr >> 2) + 0];
        HEAPU32[(cur_stack_ptr >> 2) + 1] = HEAPU32[(arg_ptr >> 2) + 1];
        break;

       case 4:
        ((cur_stack_ptr -= (16)), (cur_stack_ptr &= (~((8) - 1))));
        HEAPU32[(cur_stack_ptr >> 2) + 0] = HEAPU32[(arg_ptr >> 2) + 0];
        HEAPU32[(cur_stack_ptr >> 2) + 1] = HEAPU32[(arg_ptr >> 2) + 1];
        HEAPU32[(cur_stack_ptr >> 2) + 2] = HEAPU32[(arg_ptr >> 2) + 2];
        HEAPU32[(cur_stack_ptr >> 2) + 3] = HEAPU32[(arg_ptr >> 2) + 3];
        break;

       case 13:
        ((cur_stack_ptr -= (4)), (cur_stack_ptr &= (~((4) - 1))));
        struct_arg_info.push([ cur_stack_ptr, arg_ptr, HEAPU32[(arg_type_ptr >> 2) + 0], HEAPU16[(arg_type_ptr + 4 >> 1) + 0] ]);
        break;

       case 14:
        ((cur_stack_ptr -= (4)), (cur_stack_ptr &= (~((4) - 1))));
        HEAPU32[(cur_stack_ptr >> 2) + 0] = HEAPU32[(arg_ptr >> 2) + 0];
        break;

       case 15:
        throw new Error("complex arg marshalling nyi");

       default:
        throw new Error("Unexpected argtype " + arg_type_id);
      }
    }
    args.push(cur_stack_ptr);
    for (var i = 0; i < struct_arg_info.length; i++) {
      var struct_info = struct_arg_info[i];
      var arg_target = struct_info[0];
      var arg_ptr = struct_info[1];
      var size = struct_info[2];
      var align = struct_info[3];
      ((cur_stack_ptr -= (size)), (cur_stack_ptr &= (~((align) - 1))));
      HEAP8.subarray(cur_stack_ptr, cur_stack_ptr + size).set(HEAP8.subarray(arg_ptr, arg_ptr + size));
      HEAPU32[(arg_target >> 2) + 0] = cur_stack_ptr;
    }
  }
  stackRestore(cur_stack_ptr);
  stackAlloc(0);
  0;
  var result = getWasmTableEntry(fn).apply(null, args);
  stackRestore(orig_stack_ptr);
  if (ret_by_arg) {
    return;
  }
  switch (rtype_id) {
   case 0:
    break;

   case 1:
   case 9:
   case 10:
    HEAPU32[(rvalue >> 2) + 0] = result;
    break;

   case 2:
    HEAPF32[(rvalue >> 2) + 0] = result;
    break;

   case 3:
    HEAPF64[(rvalue >> 3) + 0] = result;
    break;

   case 5:
   case 6:
    HEAPU8[rvalue + 0] = result;
    break;

   case 7:
   case 8:
    HEAPU16[(rvalue >> 1) + 0] = result;
    break;

   case 11:
   case 12:
    HEAPU64[(rvalue >> 3) + 0] = result;
    break;

   case 14:
    HEAPU32[(rvalue >> 2) + 0] = result;
    break;

   case 15:
    throw new Error("complex ret marshalling nyi");

   default:
    throw new Error("Unexpected rtype " + rtype_id);
  }
}

function ffi_closure_alloc_js(size, code) {
  size = size;
  code = code;
  var closure = _malloc(size);
  var index = getEmptyTableSlot();
  HEAPU32[(code >> 2) + 0] = index;
  HEAPU32[(closure >> 2) + 0] = index;
  return closure;
}

function ffi_closure_free_js(closure) {
  closure = closure;
  var index = HEAPU32[(closure >> 2) + 0];
  freeTableIndexes.push(index);
  _free(closure);
}

function ffi_prep_closure_loc_js(closure, cif, fun, user_data, codeloc) {
  closure = closure;
  cif = cif;
  fun = fun;
  user_data = user_data;
  codeloc = codeloc;
  var abi = HEAPU32[(cif >> 2) + 0];
  var nargs = HEAPU32[(cif >> 2) + 1];
  var nfixedargs = HEAPU32[(cif >> 2) + 6];
  var arg_types_ptr = HEAPU32[(cif >> 2) + 2];
  var rtype_unboxed = unbox_small_structs(HEAPU32[(cif >> 2) + 3]);
  var rtype_ptr = rtype_unboxed[0];
  var rtype_id = rtype_unboxed[1];
  var sig;
  var ret_by_arg = (!!0);
  switch (rtype_id) {
   case 0:
    sig = "v";
    break;

   case 13:
   case 4:
    sig = "v" + "i";
    ret_by_arg = (!!1);
    break;

   case 1:
   case 5:
   case 6:
   case 7:
   case 8:
   case 9:
   case 10:
    sig = "i";
    break;

   case 2:
    sig = "f";
    break;

   case 3:
    sig = "d";
    break;

   case 11:
   case 12:
    sig = "j";
    break;

   case 14:
    sig = "i";
    break;

   case 15:
    throw new Error("complex ret marshalling nyi");

   default:
    throw new Error("Unexpected rtype " + rtype_id);
  }
  var unboxed_arg_type_id_list = [];
  var unboxed_arg_type_info_list = [];
  for (var i = 0; i < nargs; i++) {
    var arg_unboxed = unbox_small_structs(HEAPU32[(arg_types_ptr >> 2) + i]);
    var arg_type_ptr = arg_unboxed[0];
    var arg_type_id = arg_unboxed[1];
    unboxed_arg_type_id_list.push(arg_type_id);
    unboxed_arg_type_info_list.push([ HEAPU32[(arg_type_ptr >> 2) + 0], HEAPU16[(arg_type_ptr + 4 >> 1) + 0] ]);
  }
  for (var i = 0; i < nfixedargs; i++) {
    switch (unboxed_arg_type_id_list[i]) {
     case 1:
     case 5:
     case 6:
     case 7:
     case 8:
     case 9:
     case 10:
      sig += "i";
      break;

     case 2:
      sig += "f";
      break;

     case 3:
      sig += "d";
      break;

     case 4:
      sig += "jj";
      break;

     case 11:
     case 12:
      sig += "j";
      break;

     case 13:
     case 14:
      sig += "i";
      break;

     case 15:
      throw new Error("complex marshalling nyi");

     default:
      throw new Error("Unexpected argtype " + arg_type_id);
    }
  }
  if (nfixedargs < nargs) {
    sig += "i";
  }
  0;
  function trampoline() {
    var args = Array.prototype.slice.call(arguments);
    var orig_stack_ptr = stackSave();
    var cur_ptr = orig_stack_ptr;
    var ret_ptr;
    var jsarg_idx = 0;
    if (ret_by_arg) {
      ret_ptr = args[jsarg_idx++];
    } else {
      ((cur_ptr -= (8)), (cur_ptr &= (~((8) - 1))));
      ret_ptr = cur_ptr;
    }
    cur_ptr -= 4 * nargs;
    var args_ptr = cur_ptr;
    var carg_idx = 0;
    for (;carg_idx < nfixedargs; carg_idx++) {
      var cur_arg = args[jsarg_idx++];
      var arg_type_info = unboxed_arg_type_info_list[carg_idx];
      var arg_size = arg_type_info[0];
      var arg_align = arg_type_info[1];
      var arg_type_id = unboxed_arg_type_id_list[carg_idx];
      switch (arg_type_id) {
       case 5:
       case 6:
        ((cur_ptr -= (1)), (cur_ptr &= (~((4) - 1))));
        HEAPU32[(args_ptr >> 2) + carg_idx] = cur_ptr;
        HEAPU8[cur_ptr + 0] = cur_arg;
        break;

       case 7:
       case 8:
        ((cur_ptr -= (2)), (cur_ptr &= (~((4) - 1))));
        HEAPU32[(args_ptr >> 2) + carg_idx] = cur_ptr;
        HEAPU16[(cur_ptr >> 1) + 0] = cur_arg;
        break;

       case 1:
       case 9:
       case 10:
        ((cur_ptr -= (4)), (cur_ptr &= (~((4) - 1))));
        HEAPU32[(args_ptr >> 2) + carg_idx] = cur_ptr;
        HEAPU32[(cur_ptr >> 2) + 0] = cur_arg;
        break;

       case 13:
        ((cur_ptr -= (arg_size)), (cur_ptr &= (~((arg_align) - 1))));
        HEAP8.subarray(cur_ptr, cur_ptr + arg_size).set(HEAP8.subarray(cur_arg, cur_arg + arg_size));
        HEAPU32[(args_ptr >> 2) + carg_idx] = cur_ptr;
        break;

       case 2:
        ((cur_ptr -= (4)), (cur_ptr &= (~((4) - 1))));
        HEAPU32[(args_ptr >> 2) + carg_idx] = cur_ptr;
        HEAPF32[(cur_ptr >> 2) + 0] = cur_arg;
        break;

       case 3:
        ((cur_ptr -= (8)), (cur_ptr &= (~((8) - 1))));
        HEAPU32[(args_ptr >> 2) + carg_idx] = cur_ptr;
        HEAPF64[(cur_ptr >> 3) + 0] = cur_arg;
        break;

       case 11:
       case 12:
        ((cur_ptr -= (8)), (cur_ptr &= (~((8) - 1))));
        HEAPU32[(args_ptr >> 2) + carg_idx] = cur_ptr;
        HEAPU64[(cur_ptr >> 3) + 0] = cur_arg;
        break;

       case 4:
        ((cur_ptr -= (16)), (cur_ptr &= (~((8) - 1))));
        HEAPU32[(args_ptr >> 2) + carg_idx] = cur_ptr;
        HEAPU64[(cur_ptr >> 3) + 0] = cur_arg;
        cur_arg = args[jsarg_idx++];
        HEAPU64[(cur_ptr >> 3) + 1] = cur_arg;
        break;

       case 14:
        ((cur_ptr -= (4)), (cur_ptr &= (~((4) - 1))));
        HEAPU32[(args_ptr >> 2) + carg_idx] = cur_ptr;
        HEAPU32[(cur_ptr >> 2) + 0] = cur_arg;
        break;
      }
    }
    var varargs = args[args.length - 1];
    for (;carg_idx < nargs; carg_idx++) {
      var arg_type_id = unboxed_arg_type_id_list[carg_idx];
      var arg_type_info = unboxed_arg_type_info_list[carg_idx];
      var arg_size = arg_type_info[0];
      var arg_align = arg_type_info[1];
      if (arg_type_id === 13) {
        var struct_ptr = HEAPU32[(varargs >> 2) + 0];
        ((cur_ptr -= (arg_size)), (cur_ptr &= (~((arg_align) - 1))));
        HEAP8.subarray(cur_ptr, cur_ptr + arg_size).set(HEAP8.subarray(struct_ptr, struct_ptr + arg_size));
        HEAPU32[(args_ptr >> 2) + carg_idx] = cur_ptr;
      } else {
        HEAPU32[(args_ptr >> 2) + carg_idx] = varargs;
      }
      varargs += 4;
    }
    stackRestore(cur_ptr);
    stackAlloc(0);
    0;
    getWasmTableEntry(HEAPU32[(closure >> 2) + 2])(HEAPU32[(closure >> 2) + 1], ret_ptr, args_ptr, HEAPU32[(closure >> 2) + 3]);
    stackRestore(orig_stack_ptr);
    if (!ret_by_arg) {
      switch (sig[0]) {
       case "i":
        return HEAPU32[(ret_ptr >> 2) + 0];

       case "j":
        return HEAPU64[(ret_ptr >> 3) + 0];

       case "d":
        return HEAPF64[(ret_ptr >> 3) + 0];

       case "f":
        return HEAPF32[(ret_ptr >> 2) + 0];
      }
    }
  }
  try {
    var wasm_trampoline = convertJsFunctionToWasm(trampoline, sig);
  } catch (e) {
    return 1;
  }
  setWasmTableEntry(codeloc, wasm_trampoline);
  HEAPU32[(closure >> 2) + 1] = cif;
  HEAPU32[(closure >> 2) + 2] = fun;
  HEAPU32[(closure >> 2) + 3] = user_data;
  return 0;
}

// Imports from the Wasm binary.
var _scm_c_eval_string, _main, _htons, _emscripten_builtin_memalign, _ntohs, __emscripten_timeout, _setThrew, __emscripten_stack_restore, __emscripten_stack_alloc, _emscripten_stack_get_current, memory, __indirect_function_table, wasmMemory, wasmTable;

function assignWasmExports(wasmExports) {
  _scm_c_eval_string = Module["_scm_c_eval_string"] = wasmExports["scm_c_eval_string"];
  _main = Module["_main"] = wasmExports["__main_argc_argv"];
  _htons = wasmExports["htons"];
  _emscripten_builtin_memalign = wasmExports["emscripten_builtin_memalign"];
  _ntohs = wasmExports["ntohs"];
  __emscripten_timeout = wasmExports["_emscripten_timeout"];
  _setThrew = wasmExports["setThrew"];
  __emscripten_stack_restore = wasmExports["_emscripten_stack_restore"];
  __emscripten_stack_alloc = wasmExports["_emscripten_stack_alloc"];
  _emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"];
  memory = wasmMemory = wasmExports["memory"];
  __indirect_function_table = wasmTable = wasmExports["__indirect_function_table"];
}

var wasmImports = {
  /** @export */ __assert_fail: ___assert_fail,
  /** @export */ __call_sighandler: ___call_sighandler,
  /** @export */ __syscall_chdir: ___syscall_chdir,
  /** @export */ __syscall_chmod: ___syscall_chmod,
  /** @export */ __syscall_dup: ___syscall_dup,
  /** @export */ __syscall_dup3: ___syscall_dup3,
  /** @export */ __syscall_faccessat: ___syscall_faccessat,
  /** @export */ __syscall_fchdir: ___syscall_fchdir,
  /** @export */ __syscall_fchmod: ___syscall_fchmod,
  /** @export */ __syscall_fchmodat2: ___syscall_fchmodat2,
  /** @export */ __syscall_fchown32: ___syscall_fchown32,
  /** @export */ __syscall_fchownat: ___syscall_fchownat,
  /** @export */ __syscall_fcntl64: ___syscall_fcntl64,
  /** @export */ __syscall_fstat64: ___syscall_fstat64,
  /** @export */ __syscall_fstatfs64: ___syscall_fstatfs64,
  /** @export */ __syscall_ftruncate64: ___syscall_ftruncate64,
  /** @export */ __syscall_getcwd: ___syscall_getcwd,
  /** @export */ __syscall_getdents64: ___syscall_getdents64,
  /** @export */ __syscall_ioctl: ___syscall_ioctl,
  /** @export */ __syscall_lstat64: ___syscall_lstat64,
  /** @export */ __syscall_mkdirat: ___syscall_mkdirat,
  /** @export */ __syscall_mknodat: ___syscall_mknodat,
  /** @export */ __syscall_newfstatat: ___syscall_newfstatat,
  /** @export */ __syscall_openat: ___syscall_openat,
  /** @export */ __syscall_pipe2: ___syscall_pipe2,
  /** @export */ __syscall_poll: ___syscall_poll,
  /** @export */ __syscall_poll_nonblocking: ___syscall_poll_nonblocking,
  /** @export */ __syscall_readlinkat: ___syscall_readlinkat,
  /** @export */ __syscall_renameat: ___syscall_renameat,
  /** @export */ __syscall_rmdir: ___syscall_rmdir,
  /** @export */ __syscall_stat64: ___syscall_stat64,
  /** @export */ __syscall_symlinkat: ___syscall_symlinkat,
  /** @export */ __syscall_truncate64: ___syscall_truncate64,
  /** @export */ __syscall_umask: ___syscall_umask,
  /** @export */ __syscall_unlinkat: ___syscall_unlinkat,
  /** @export */ __syscall_utimensat: ___syscall_utimensat,
  /** @export */ _abort_js: __abort_js,
  /** @export */ _emscripten_runtime_keepalive_clear: __emscripten_runtime_keepalive_clear,
  /** @export */ _emscripten_system: __emscripten_system,
  /** @export */ _emscripten_throw_longjmp: __emscripten_throw_longjmp,
  /** @export */ _gmtime_js: __gmtime_js,
  /** @export */ _localtime_js: __localtime_js,
  /** @export */ _mktime_js: __mktime_js,
  /** @export */ _mmap_js: __mmap_js,
  /** @export */ _munmap_js: __munmap_js,
  /** @export */ _setitimer_js: __setitimer_js,
  /** @export */ _tzset_js: __tzset_js,
  /** @export */ clock_time_get: _clock_time_get,
  /** @export */ emscripten_date_now: _emscripten_date_now,
  /** @export */ emscripten_get_heap_max: _emscripten_get_heap_max,
  /** @export */ emscripten_get_now: _emscripten_get_now,
  /** @export */ emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */ environ_get: _environ_get,
  /** @export */ environ_sizes_get: _environ_sizes_get,
  /** @export */ exit: _exit,
  /** @export */ fd_close: _fd_close,
  /** @export */ fd_fdstat_get: _fd_fdstat_get,
  /** @export */ fd_read: _fd_read,
  /** @export */ fd_seek: _fd_seek,
  /** @export */ fd_sync: _fd_sync,
  /** @export */ fd_write: _fd_write,
  /** @export */ ffi_call_js,
  /** @export */ ffi_closure_alloc_js,
  /** @export */ ffi_closure_free_js,
  /** @export */ ffi_prep_closure_loc_js,
  /** @export */ invoke_i,
  /** @export */ invoke_ii,
  /** @export */ invoke_iii,
  /** @export */ invoke_iiii,
  /** @export */ invoke_iiiii,
  /** @export */ invoke_iiiiii,
  /** @export */ invoke_iiiiiii,
  /** @export */ invoke_iiiiiiiiii,
  /** @export */ invoke_v,
  /** @export */ invoke_vi,
  /** @export */ invoke_vii,
  /** @export */ invoke_viii,
  /** @export */ invoke_viiii,
  /** @export */ invoke_viiiiiiiii,
  /** @export */ proc_exit: _proc_exit,
  /** @export */ strptime: _strptime
};

function invoke_vii(index, a1, a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ii(index, a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vi(index, a1) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iii(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_i(index) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)();
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_v(index) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)();
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

// include: postamble.js
// === Auto-generated postamble setup entry stuff ===
function callMain(args = []) {
  var entryFunction = _main;
  args.unshift(thisProgram);
  var argc = args.length;
  var argv = stackAlloc((argc + 1) * 4);
  var argv_ptr = argv;
  for (var arg of args) {
    HEAPU32[((argv_ptr) >> 2)] = stringToUTF8OnStack(arg);
    argv_ptr += 4;
  }
  HEAPU32[((argv_ptr) >> 2)] = 0;
  try {
    var ret = entryFunction(argc, argv);
    // if we're not running an evented main loop, it's time to exit
    exitJS(ret, /* implicit = */ true);
    return ret;
  } catch (e) {
    return handleException(e);
  }
}

async function run(args = programArgs) {
  preRun();
  if (runDependencies) {
    await resolveRunDependencies();
  }
  var setStatus = Module["setStatus"];
  if (setStatus) {
    setStatus("Running...");
    // Yield to the event loop to allow the browser to paint "Running..."
    await new Promise(resolve => setTimeout(resolve, 1));
    // Then we want to clear the status text, but only after the rest of this function runs.
    setTimeout(setStatus, 1, "");
  }
  if (ABORT) return;
  initRuntime();
  // No ATMAINS hooks
  Module["onRuntimeInitialized"]?.();
  var noInitialRun = Module["noInitialRun"] || false;
  if (!noInitialRun) callMain(args);
  postRun();
}

var wasmExports;

// In modularize mode the generated code is within a factory function so we
// can use await here (since it's not top-level-await).
wasmExports = await createWasm();

await run();


    return Module;
  };
})();

// Export using a UMD style export, or ES6 exports if selected
if (typeof exports === 'object' && typeof module === 'object') {
  module.exports = createLilypond;
  // This default export looks redundant, but it allows TS to import this
  // commonjs style module.
  module.exports.default = createLilypond;
} else if (typeof define === 'function' && define['amd'])
  define([], () => createLilypond);

