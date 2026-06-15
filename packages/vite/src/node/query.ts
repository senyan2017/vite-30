import { splitFileAndPostfix } from '../shared/utils'
import { isWindows, slash } from '../shared/utils'

// ---------------------------------------------------------------------------
// Shared Vite query parameter regexes
//
// These regexes detect Vite-specific query parameters like ?url, ?raw,
// ?inline, ?direct, etc. All flag-style query regexes follow the same
// convention: they match the parameter name preceded by `?` or `&`, and
// followed by `&` or end-of-string. This avoids false positives against
// value-bearing queries (e.g. `?url=foo` does NOT match `urlRE`).
// ---------------------------------------------------------------------------

const trailingSeparatorRE = /[?&]$/

// ?url – request the asset as a URL string
export const urlRE: RegExp = /(\?|&)url(?:&|$)/

// ?raw – request the asset as a raw string
export const rawRE: RegExp = /(\?|&)raw(?:&|$)/

// ?inline – force asset inlining (data-URL / base64)
export const inlineRE: RegExp = /(\?|&)inline(?:&|$)/

// ?no-inline – explicitly prevent asset inlining
export const noInlineRE: RegExp = /(\?|&)no-inline(?:&|$)/

// ?direct – direct CSS request (browser-initiated, not JS import)
export const directRequestRE: RegExp = /(\?|&)direct=?(?:&|$)/

// ?import – marks a JS/CSS module import request
const importQueryRE = /(\?|&)import=?(?:&|$)/

// ---------------------------------------------------------------------------
// Predicate helpers
// ---------------------------------------------------------------------------

/** Returns `true` when the id contains a `?url` query parameter. */
export const hasUrlQuery = (id: string): boolean => urlRE.test(id)

/** Returns `true` when the id contains a `?raw` query parameter. */
export const hasRawQuery = (id: string): boolean => rawRE.test(id)

/** Returns `true` when the id contains a `?inline` query parameter. */
export const hasInlineQuery = (id: string): boolean => inlineRE.test(id)

/** Returns `true` when the id contains a `?no-inline` query parameter. */
export const hasNoInlineQuery = (id: string): boolean => noInlineRE.test(id)

/** Returns `true` when the id contains a `?direct` query parameter. */
export const isDirectRequest = (id: string): boolean =>
  directRequestRE.test(id)

/** Returns `true` when the url contains an `?import` query parameter. */
export const isImportRequest = (url: string): boolean => importQueryRE.test(url)

// ---------------------------------------------------------------------------
// Query removal helpers
//
// Each function strips its target query parameter and cleans up any trailing
// `?` or `&` separator left behind.
// ---------------------------------------------------------------------------

export function removeUrlQuery(url: string): string {
  return url.replace(urlRE, '$1').replace(trailingSeparatorRE, '')
}

export function removeRawQuery(url: string): string {
  return url.replace(rawRE, '$1').replace(trailingSeparatorRE, '')
}

export function removeImportQuery(url: string): string {
  return url.replace(importQueryRE, '$1').replace(trailingSeparatorRE, '')
}

export function removeDirectQuery(url: string): string {
  return url.replace(directRequestRE, '$1').replace(trailingSeparatorRE, '')
}

// ---------------------------------------------------------------------------
// Query injection
// ---------------------------------------------------------------------------

/**
 * Injects a query parameter into a URL, preserving any existing query string
 * and hash fragment.
 */
export function injectQuery(url: string, queryToInject: string): string {
  const { file, postfix } = splitFileAndPostfix(url)
  const normalizedFile = isWindows ? slash(file) : file
  return `${normalizedFile}?${queryToInject}${postfix[0] === '?' ? `&${postfix.slice(1)}` : /* hash only */ postfix}`
}

// ---------------------------------------------------------------------------
// Timestamp query
// ---------------------------------------------------------------------------

const timestampRE = /\bt=\d{13}&?\b/

/** Removes the HMR timestamp query parameter (`t=…`) from the URL. */
export function removeTimestampQuery(url: string): string {
  return url.replace(timestampRE, '').replace(trailingSeparatorRE, '')
}
