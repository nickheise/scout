"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { GitBranch } from "lucide-react";
import { SITE } from "@/lib/config";
import { cn } from "@/lib/utils";

const CACHE_KEY = "scout-star-count-v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

interface StarCache {
  count: number;
  fetchedAt: number;
}

// Astro/React SSR renders this component to static HTML at build time;
// useLayoutEffect only actually runs in the browser during hydration, so
// this guard just avoids the (harmless) "does nothing on the server"
// console warning during that build-time render.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function isPlaceholderRepo(): boolean {
  return (
    SITE.orgName.includes("placeholder") || SITE.repoName.includes("placeholder")
  );
}

function readCache(): number | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StarCache;
    if (typeof parsed.count !== "number" || typeof parsed.fetchedAt !== "number") {
      return null;
    }
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed.count;
  } catch {
    // Private-mode storage, disabled storage, or corrupt JSON — treat as a
    // cache miss and let the live fetch (if any) take over.
    return null;
  }
}

function writeCache(count: number): void {
  try {
    const entry: StarCache = { count, fetchedAt: Date.now() };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage unavailable — the fetched count still renders for this
    // pageview, it just won't be cached for the next one.
  }
}

function formatStarCount(n: number): string {
  if (n < 1000) return String(n);
  const thousands = n / 1000;
  return `${thousands.toFixed(thousands >= 10 ? 0 : 1)}k`;
}

/**
 * StarCount — GitHub link + live star count (PLAN.md §1, PRD Beat 1 secondary
 * CTA). Renders "GitHub" immediately (build-time SITE.starFallback, usually
 * null pre-launch); a client-side fetch of the public repos API then fills
 * in a real count, cached in localStorage for 6h so repeat visits don't
 * refetch. Any failure mode — blocked fetch, placeholder org (pre D-004),
 * or no fallback baked in — renders the same "GitHub, no count" state with
 * no layout shift: the count span is simply absent, not a zero-width
 * placeholder waiting to pop in.
 *
 * Icon note: lucide-react ships no GitHub brand mark (Lucide deliberately
 * excludes logos), so this uses lucide's GitBranch glyph -- a generic git
 * icon, not a GitHub wordmark/logo reproduction -- next to the "GitHub"
 * text label.
 */
export function StarCount({ className }: { className?: string }) {
  const [count, setCount] = useState<number | null>(SITE.starFallback);

  useIsomorphicLayoutEffect(() => {
    if (isPlaceholderRepo()) return;

    const cached = readCache();
    if (cached !== null) setCount(cached);
  }, []);

  useEffect(() => {
    if (isPlaceholderRepo()) return;
    if (readCache() !== null) return; // fresh cache already applied above

    let cancelled = false;

    fetch(`https://api.github.com/repos/${SITE.orgName}/${SITE.repoName}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { stargazers_count?: unknown }) => {
        if (cancelled) return;
        if (typeof data.stargazers_count === "number") {
          setCount(data.stargazers_count);
          writeCache(data.stargazers_count);
        }
      })
      .catch(() => {
        // Network error, rate limit, 404 on a not-yet-real repo, etc. Keep
        // whatever we started with (build-time fallback or null) — no
        // error state, the GitHub link works regardless.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <a
      href={SITE.githubUrl}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-ink transition-colors motion-reduce:transition-none",
        "[@media(hover:hover)_and_(pointer:fine)]:hover:text-forest-600",
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <GitBranch aria-hidden="true" className="size-[18px] shrink-0" />
      <span>GitHub</span>
      {count !== null && (
        <span className="tabular-nums text-ink-muted">
          {formatStarCount(count)}
        </span>
      )}
    </a>
  );
}

export default StarCount;
