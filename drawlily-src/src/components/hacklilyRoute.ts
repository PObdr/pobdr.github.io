// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2017-present Jocelyn Stericker <jocelyn@nettek.ca>

import { redirect, useNavigate } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

import type { QueryProps } from "#/components/App";
import { useColourScheme } from "#/components/useColourScheme";
import {
  editSong,
  getDirtySongs,
  getHideUnstableNotification,
  markSongClean,
  setHideUnstableNotification,
  subscribeToLocalStorage,
} from "#/lib/localStorage";
import { parseQuery, toQueryString } from "#/lib/queryString";

/**
 * Validate + normalize the URL search params (with a hash fallback for long
 * URLs, used by ?src=) into a typed QueryProps object.
 *
 * Shared by every Hacklily route (/ and /wasm) so they interpret the URL
 * identically.
 */
export function validateHacklilySearch(
  search: Record<string, string | undefined>,
): QueryProps {
  // Also read from hash as fallback for long URLs (src param).
  const hash = window.location.hash.slice(1);
  const hashParams = hash ? parseQuery(hash) : {};

  return {
    "404": search["404"] || hashParams["404"],
    about: search.about || hashParams.about,
    edit: search.edit || hashParams.edit,
    src:
      search.src === "<url" || hashParams.src === "<url"
        ? undefined
        : search.src || hashParams.src,
  };
}

/**
 * beforeLoad hook shared by every Hacklily route.
 *
 * Tidies the garbage ?src=%3Curl URL that Google sometimes indexes. Should
 * only act on `enter`.
 */
export function hacklilyBeforeLoad({
  search,
  cause,
}: {
  search: QueryProps;
  cause: string;
}): void {
  if (cause !== "enter") {
    return;
  }

  // Google sometimes indexes/send people to ?src=%3Curl (a garbage URL).
  // validateSearch already hides the bogus src from the editor; here we also
  // tidy the URL bar.
  if (parseQuery(window.location.search).src === "<url") {
    throw redirect({ replace: true, search: { ...search } as any, to: "." });
  }
}

/**
 * Earlier versions of Hacklily kept a GitHub access token in localStorage.
 * There is no sign-in any more, so remove what is left of it.
 */
function clearLegacyLogin(): void {
  localStorage.removeItem("auth");
  sessionStorage.removeItem("csrf");
  sessionStorage.removeItem("csrfQueryParams");
}

/**
 * Assemble the non-URL props for <App> from localStorage and router context.
 * `search` (the validated URL params) is passed in because
 * `Route.useSearch()` is bound to a specific route; the hook itself stays
 * route-agnostic so / and /wasm can share it.
 */
export function useHacklilyAppProps(search: QueryProps) {
  const navigate = useNavigate();
  const colourScheme = useColourScheme();

  // Track the last hash value so we can detect hash changes (for the long-URL
  // fallback used by ?src=).
  const lastHashRef = useRef(window.location.hash);

  useEffect(() => {
    clearLegacyLogin();
  }, []);

  // Listen for hashchange events (the long-URL fallback uses hash instead of
  // search params) and re-render by navigating in place.
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      if (hash !== lastHashRef.current) {
        lastHashRef.current = hash;
        // Re-run validateSearch by navigating to the same location.
        void navigate({ replace: true, to: ".", search: {} as any });
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [navigate]);

  const setQuery = useCallback(
    <K extends keyof QueryProps>(
      updates: Pick<QueryProps, K>,
      replaceState: boolean = false,
    ): void => {
      const currentSearch = search;
      const merged: QueryProps = { ...currentSearch, ...updates };

      // Build the query string and decide whether to use hash fallback.
      const queryString = toQueryString(merged as Record<string, string>);
      const base = window.location.pathname;
      const connector = base.length + queryString.length + 1 > 1024 ? "#" : "?";

      if (connector === "#") {
        // Use hash fallback for long URLs.
        window.location.hash = queryString.length ? `#${queryString}` : "";
        // Navigate to clear search params since we're using hash now.
        void navigate({
          replace: replaceState,
          to: ".",
          search: {} as any,
        });
      } else {
        // Normal case: use search params.
        void navigate({
          replace: replaceState,
          to: ".",
          search: merged as any,
        });
      }
    },
    [navigate, search],
  );

  // Read localStorage state (same as current index.tsx).
  const dirtySongs = useSyncExternalStore(
    subscribeToLocalStorage,
    getDirtySongs,
    () => ({}),
  );
  const hideUnstableNotification = useSyncExternalStore(
    subscribeToLocalStorage,
    getHideUnstableNotification,
    () => false,
  );

  return {
    dirtySongs,
    colourScheme,
    hideUnstableNotification,
    setQuery,
    editSong,
    markSongClean,
    setHideUnstableNotification,
  };
}
