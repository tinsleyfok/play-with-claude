import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { FeedCard, type FeedCardData } from "../components/FeedCard";
import { useTheme } from "../hooks/useTheme";
import { tinsleyProfilePhoto } from "../utils/publicAsset";
import { AvatarImg } from "../components/AvatarImg";
import { MOCK_LEFT, MOCK_RIGHT } from "./FeedPage";

/** Shared inner row: 48px (Gist home + search). min-h-0 on children keeps inputs from blowing past this. */
const MVP_HEADER_ROW =
  "box-border m-0 flex h-[48px] max-h-[48px] min-h-[48px] min-w-0 items-center gap-2 overflow-hidden px-2";

/** items-start: pill grows downward; back + pill share top edge. */
const MVP_SEARCH_FORM_ROW =
  "box-border m-0 flex min-h-[44px] min-w-0 items-start gap-2 overflow-x-visible overflow-y-visible px-2";

const SEARCH_TEXTAREA_MAX_LINES = 4;
/** Matches textarea text-[14px] and lineHeight 1.4 */
const SEARCH_LINE_HEIGHT_PX = 14 * 1.4;
const SEARCH_TEXTAREA_MAX_HEIGHT_PX = SEARCH_LINE_HEIGHT_PX * SEARCH_TEXTAREA_MAX_LINES;

/** Figma 5716:396573 — Home Nav Bar search row */
function MvpSearchTopBar({ onBack, isDark }: { onBack: () => void; isDark: boolean }) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState("");

  const syncTextareaHeight = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    if (query.length === 0) {
      el.style.height = `${SEARCH_LINE_HEIGHT_PX}px`;
      return;
    }
    el.style.height = "auto";
    const next = Math.min(
      Math.max(el.scrollHeight, SEARCH_LINE_HEIGHT_PX),
      SEARCH_TEXTAREA_MAX_HEIGHT_PX,
    );
    el.style.height = `${next}px`;
  }, [query]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useLayoutEffect(() => {
    syncTextareaHeight();
  }, [syncTextareaHeight]);

  const fg = isDark ? "#ffffff" : "#000000";
  const pillBg = isDark ? "#1a1a1a" : "rgba(0,0,0,0.04)";
  const searchActionColor = isDark ? "#ffffff" : "#1D1D1B";
  const placeholderClass = isDark ? "placeholder:text-white/40" : "placeholder:text-[rgba(29,29,27,0.34)]";
  const iconMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(29,29,27,0.45)";
  const reduceMotion = useReducedMotion();

  const pillInner = (
    <div
      className="flex min-h-9 min-w-0 flex-1 items-center gap-1.5 rounded-[20px] py-1.5 pl-2 pr-1.5"
      style={{ background: pillBg }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="pointer-events-none shrink-0"
      >
        <path
          d="M10.9149 1.75C15.9799 1.75002 20.0848 5.85505 20.0848 10.915C20.0848 13.09 19.3302 15.0803 18.0702 16.6553L22.5164 21.1064C22.7115 21.3017 22.7116 21.6183 22.5164 21.8135L21.8133 22.5166C21.6181 22.7118 21.3016 22.7117 21.1063 22.5166L16.6551 18.0703C15.0801 19.3303 13.0899 20.085 10.9149 20.085C5.8549 20.085 1.74987 15.98 1.74985 10.915C1.74985 5.85504 5.85489 1.75 10.9149 1.75ZM10.9149 3.75C6.95989 3.75 3.74985 6.96004 3.74985 10.915C3.74987 14.875 6.9599 18.085 10.9149 18.085C14.8749 18.0849 18.0848 14.875 18.0848 10.915C18.0848 6.96005 14.8749 3.75002 10.9149 3.75Z"
          fill={iconMuted}
        />
      </svg>
      <textarea
        ref={inputRef}
        name="mvp-feed-search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        rows={1}
        maxLength={2000}
        placeholder="Search Cards and users"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            (e.currentTarget as HTMLTextAreaElement).form?.requestSubmit();
          }
        }}
        className={`mvp-search-textarea min-w-0 flex-1 resize-none overflow-y-auto border-none bg-transparent py-0 font-rethink text-[14px] leading-[1.4] outline-none ${placeholderClass}`}
        style={{
          color: fg,
          maxHeight: SEARCH_TEXTAREA_MAX_HEIGHT_PX,
          minHeight: SEARCH_LINE_HEIGHT_PX,
        }}
      />
      <button
        type="submit"
        className="flex h-7 min-h-0 shrink-0 cursor-pointer items-center rounded-full border-none bg-transparent px-2 font-rethink text-[14px] font-bold leading-tight"
        style={{ color: searchActionColor }}
      >
        Search
      </button>
    </div>
  );

  return (
    <form
      className={MVP_SEARCH_FORM_ROW}
      onSubmit={(e) => {
        e.preventDefault();
        inputRef.current?.blur();
      }}
    >
      <button
        type="button"
        className="mt-0.5 flex h-9 min-h-0 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent"
        style={{ color: fg }}
        aria-label="Back"
        onClick={onBack}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15.5303 4.46967C15.8232 4.76256 15.8232 5.23744 15.5303 5.53033L9.81066 11.25H20.25C20.6642 11.25 21 11.5858 21 12C21 12.4142 20.6642 12.75 20.25 12.75H9.81066L15.5303 18.4697C15.8232 18.7626 15.8232 19.2374 15.5303 19.5303C15.2374 19.8232 14.7626 19.8232 14.4697 19.5303L7.21967 12.2803C6.92678 11.9874 6.92678 11.5126 7.21967 11.2197L14.4697 3.96967C14.7626 3.67678 15.2374 3.67678 15.5303 3.96967Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {reduceMotion ? (
        pillInner
      ) : (
        <motion.div
          className="min-h-0 min-w-0 flex-1 overflow-visible rounded-[20px]"
          style={{ background: pillBg }}
          initial={{ x: 22, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          {pillInner}
        </motion.div>
      )}
    </form>
  );
}

function MvpGistTopBar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const fg = isDark ? "#ffffff" : "#000000";

  return (
    <div className={`${MVP_HEADER_ROW} justify-between`}>
        <button
          type="button"
          className="flex h-10 min-h-0 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent"
          aria-label="Search"
          onClick={onOpenSearch}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M10.9149 1.75C15.9799 1.75002 20.0848 5.85505 20.0848 10.915C20.0848 13.09 19.3302 15.0803 18.0702 16.6553L22.5164 21.1064C22.7115 21.3017 22.7116 21.6183 22.5164 21.8135L21.8133 22.5166C21.6181 22.7118 21.3016 22.7117 21.1063 22.5166L16.6551 18.0703C15.0801 19.3303 13.0899 20.085 10.9149 20.085C5.8549 20.085 1.74987 15.98 1.74985 10.915C1.74985 5.85504 5.85489 1.75 10.9149 1.75ZM10.9149 3.75C6.95989 3.75 3.74985 6.96004 3.74985 10.915C3.74987 14.875 6.9599 18.085 10.9149 18.085C14.8749 18.0849 18.0848 14.875 18.0848 10.915C18.0848 6.96005 14.8749 3.75002 10.9149 3.75Z"
              fill={fg}
            />
          </svg>
        </button>

        <span className="flex-1 text-center font-chapter text-[20px] font-bold tracking-tight" style={{ color: fg }}>
          Gist.
        </span>

        <button
          type="button"
          className="flex h-10 min-h-0 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent"
          aria-label="Profile"
          onClick={() => navigate("/app/mvp/profile")}
        >
          <div className="h-[28px] w-[28px] overflow-hidden rounded-full ring-1 ring-black/10 dark:ring-white/10">
            <AvatarImg src={tinsleyProfilePhoto} alt="" bgSeed="tinsleyfok" className="h-full w-full object-cover" />
          </div>
        </button>
    </div>
  );
}

function MvpFeedGrid({ left, right }: { left: FeedCardData[]; right: FeedCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-2 pb-4 pt-1">
      <div className="flex min-w-0 flex-col gap-3">
        {left.map((card) => (
          <FeedCard key={card.id} card={card} />
        ))}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        {right.map((card) => (
          <FeedCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

/** Min height when search is open (gist-era row + pb-2). No max-height so multiline pill stays inside the sticky paint box. */
const MVP_SEARCH_STICKY_MIN_HEIGHT =
  "calc(max(4px, env(safe-area-inset-top, 0px)) + 48px + 8px)";

/** MVP home — Figma 5320:370381 + search state 5716:396496 */
export function MvpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const st = location.state as { openSearch?: boolean } | undefined;
    if (st?.openSearch) {
      setSearchOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const overlayBg = isDark ? "rgba(0, 0, 0, 0.55)" : "rgba(242, 242, 242, 0.48)";

  const headerBg = isDark ? "#000000" : "#f2f2f2";

  return (
    <div className="relative min-h-full" style={{ background: headerBg }}>
      {/* Sticky z-50 draws above overlay (z-20). Min-height when search open; grows with multiline pill so bg covers the full bar. */}
      <div
        className={`sticky top-0 z-50 box-border min-w-0 px-2 pb-2 ${isDark ? "bg-black" : "bg-[#f2f2f2]"}`}
        style={{
          backgroundColor: headerBg,
          paddingTop: "max(4px, env(safe-area-inset-top, 0px))",
          ...(searchOpen
            ? {
                minHeight: MVP_SEARCH_STICKY_MIN_HEIGHT,
              }
            : {}),
        }}
      >
        {searchOpen ? (
          <MvpSearchTopBar isDark={isDark} onBack={() => setSearchOpen(false)} />
        ) : (
          <MvpGistTopBar onOpenSearch={() => setSearchOpen(true)} />
        )}
      </div>

      <div className="relative">
        {searchOpen && (
          <div
            className="pointer-events-auto absolute inset-0 z-20"
            style={{ background: overlayBg }}
            aria-hidden
          />
        )}
        <div className={searchOpen ? "relative z-10" : undefined}>
          <MvpFeedGrid left={MOCK_LEFT} right={MOCK_RIGHT} />
        </div>
      </div>
    </div>
  );
}
