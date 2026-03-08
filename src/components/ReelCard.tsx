import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../hooks/useTheme";
import { IconLike, IconComment, IconBookmark, IconShare, IconMore, IconQuoteOpen, IconQuoteClose, IconPlus } from "./Icons";

type ReelVariant = "video" | "image" | "discussion" | "article";
type ImageAspect = "1:1" | "4:3" | "3:4";

interface ReelCardBase {
  id: string;
  variant: ReelVariant;
  username: string;
  avatarUrl?: string;
  likes: string;
  comments: string;
  saves: string;
  timestamp?: string;
  description?: string;
}

interface VideoReelCard extends ReelCardBase {
  variant: "video";
  imageUrl: string;
}

interface ImageReelCard extends ReelCardBase {
  variant: "image";
  imageUrl: string;
  imageAspect: ImageAspect;
}

interface DiscussionReelCard extends ReelCardBase {
  variant: "discussion";
  title: string;
}

interface ArticleReelCard extends ReelCardBase {
  variant: "article";
  title: string;
  body: string;
  readTime?: string;
}

export type ReelCardData =
  | VideoReelCard
  | ImageReelCard
  | DiscussionReelCard
  | ArticleReelCard;

export function ReelCard({ card }: { card: ReelCardData }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (card.variant === "video") return <VideoCardView card={card} isDark={isDark} />;
  if (card.variant === "image") return <ImageCardView card={card} isDark={isDark} />;
  if (card.variant === "discussion") return <DiscussionCardView card={card} isDark={isDark} />;
  return <ArticleCardView card={card} isDark={isDark} />;
}

/* ─── Video Card: fixed 9:16 ─── */

function VideoCardView({ card }: { card: VideoReelCard; isDark: boolean }) {
  return (
    <div
      className="relative rounded-[36px] overflow-hidden w-full"
      style={{ aspectRatio: "9/16" }}
    >
      <img
        src={card.imageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "40%",
          background: "linear-gradient(to bottom, transparent, rgba(20,20,20,0.5))",
        }}
      />
      <div className="absolute right-3 bottom-[120px] flex flex-col items-center gap-4">
        <ActionIcon count={card.likes}><IconLike size={23} color="#fff" /></ActionIcon>
        <ActionIcon count={card.comments}><IconComment size={23} color="#fff" /></ActionIcon>
        <ActionIcon count={card.saves}><IconBookmark size={23} color="#fff" /></ActionIcon>
        <ActionIcon><IconShare size={23} color="#fff" /></ActionIcon>
        <ActionIcon><IconMore size={23} color="#fff" /></ActionIcon>
      </div>
      <div className="absolute bottom-0 left-0 right-14 p-4 pb-5 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Avatar url={card.avatarUrl} size={20} />
          <span className="font-rethink text-[17px] font-bold text-white leading-none">
            {card.username}
          </span>
          <FollowButton light />
        </div>
        {card.description && (
          <p className="font-rethink text-[14px] text-white/90 m-0 leading-snug line-clamp-2">
            {card.description}
            <span className="text-white/60 ml-1">more</span>
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Image Card: responsive height based on image aspect + text ─── */

function ImageCardView({ card, isDark }: { card: ImageReelCard; isDark: boolean }) {
  const aspectMap: Record<ImageAspect, string> = { "1:1": "1/1", "4:3": "4/3", "3:4": "3/4" };
  const hasCaptions = !!card.description;

  return (
    <div className="w-full">
      <div className="rounded-t-[36px] overflow-hidden">
        <img
          src={card.imageUrl}
          alt=""
          className="w-full object-cover block"
          style={{ aspectRatio: aspectMap[card.imageAspect] }}
        />
      </div>
      <InfoSection card={card} isDark={isDark} showCounts={hasCaptions} />
    </div>
  );
}

/* ─── Discussion Card: 1:1 or 4:3 based on title length ─── */

function DiscussionCardView({ card, isDark }: { card: DiscussionReelCard; isDark: boolean }) {
  const quoteAspect = card.title.length > 80 ? "3/4" : "1/1";
  const quoteFill = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)";
  const textColor = isDark ? "#ffffff" : "#000000";
  const subtleColor = isDark ? "rgba(255,255,255,0.48)" : "rgba(0,0,0,0.48)";
  const color = isDark ? "#ffffff" : "#000000";

  return (
    <div
      className="w-full rounded-[36px] overflow-hidden flex flex-col"
      style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)"}` }}
    >
      {/* Quote area - flat bottom */}
      <div
        className="relative flex items-center justify-center"
        style={{
          aspectRatio: quoteAspect,
          background: isDark ? "#2c2c2a" : "#f0ebe7",
        }}
      >
        <IconQuoteOpen size={28} color={quoteFill} className="absolute top-5 left-5" />
        <p
          className="font-rethink text-[28px] font-bold leading-snug m-0 text-center z-10 px-7"
          style={{ color: textColor }}
        >
          {card.title}
        </p>
        <IconQuoteClose size={28} color={quoteFill} className="absolute bottom-5 right-5" />
      </div>
      {/* Info inside the card */}
      <div
        className="px-5 pt-3 pb-4 flex flex-col gap-1.5"
        style={{ background: isDark ? "#1c1c1e" : "#ffffff" }}
      >
        <div className="flex items-center gap-2">
          <Avatar url={card.avatarUrl} size={32} isDark={isDark} />
          <span className="font-rethink text-[16px] font-medium" style={{ color: textColor }}>
            {card.username}
          </span>
          <FollowButton isDark={isDark} />
        </div>
        {card.description && (
          <p className="font-rethink text-[15px] m-0 leading-snug line-clamp-3" style={{ color: textColor }}>
            {card.description}
            <span style={{ color: subtleColor }}> more</span>
          </p>
        )}
        {!card.description && card.timestamp && (
          <p className="font-rethink text-[14px] m-0" style={{ color: subtleColor }}>
            {card.timestamp}
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4">
            <ActionBtn color={color} count={card.likes}><IconLike size={22} color={color} /></ActionBtn>
            <ActionBtn color={color} count={card.comments}><IconComment size={22} color={color} /></ActionBtn>
            <ActionBtn color={color} count={card.saves}><IconBookmark size={22} color={color} /></ActionBtn>
          </div>
          <div className="flex items-center gap-4">
            <ActionBtn color={color}><IconShare size={22} color={color} /></ActionBtn>
            <ActionBtn color={color}><IconMore size={22} color={color} /></ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Article Card: responsive, max 9:16 ─── */

function ArticleCardView({ card, isDark }: { card: ArticleReelCard; isDark: boolean }) {
  const textColor = isDark ? "#ffffff" : "#000000";
  const subtleColor = isDark ? "rgba(255,255,255,0.48)" : "rgba(0,0,0,0.48)";
  const color = isDark ? "#ffffff" : "#000000";
  const bodyColor = isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.75)";
  const dotDim = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";
  const dotBright = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)";

  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const pages = Math.max(1, Math.round(el.scrollWidth / el.clientWidth));
    setPageCount(pages);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const page = Math.round(el.scrollLeft / el.clientWidth);
    setActivePage(page);
  }, []);

  return (
    <div
      className="w-full rounded-[36px] overflow-hidden flex flex-col"
      style={{ background: isDark ? "#1c1c1e" : "#ffffff", aspectRatio: "9/16", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}
    >
      <div className="px-7 pt-10 pb-6 flex flex-col gap-4 flex-1 min-h-0">
        <h2
          className="font-rethink text-[30px] font-bold leading-tight m-0 flex-shrink-0"
          style={{ color: textColor }}
        >
          {card.title}
        </h2>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Avatar url={card.avatarUrl} size={34} isDark={isDark} />
          <span className="font-rethink text-[16px] font-medium" style={{ color: textColor }}>
            {card.username}
          </span>
          <FollowButton isDark={isDark} />
        </div>
        {(card.readTime || card.timestamp) && (
          <p className="font-rethink text-[15px] m-0 flex-shrink-0" style={{ color: subtleColor }}>
            {[card.readTime, card.timestamp].filter(Boolean).join(" \u00b7 ")}
          </p>
        )}
        {/* Paginated body: horizontal scroll with CSS columns */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0"
          onScroll={onScroll}
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            className="h-full"
            style={{
              columnWidth: "100%",
              columnGap: 32,
              columnFill: "auto",
            }}
          >
            <p
              className="font-charter text-[18px] leading-[1.7] m-0"
              style={{ color: bodyColor }}
            >
              {card.body}
            </p>
          </div>
        </div>
        {/* Dynamic dot indicators */}
        <div className="flex justify-center gap-1.5 py-2 flex-shrink-0">
          {Array.from({ length: pageCount }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
              style={{ background: i === activePage ? dotBright : dotDim }}
            />
          ))}
        </div>
        {/* Action bar - always pinned */}
        <div className="flex items-center justify-between flex-shrink-0 pb-1">
          <div className="flex items-center gap-4">
            <ActionBtn color={color} count={card.likes}><IconLike size={22} color={color} /></ActionBtn>
            <ActionBtn color={color} count={card.comments}><IconComment size={22} color={color} /></ActionBtn>
            <ActionBtn color={color} count={card.saves}><IconBookmark size={22} color={color} /></ActionBtn>
          </div>
          <div className="flex items-center gap-4">
            <ActionBtn color={color}><IconShare size={22} color={color} /></ActionBtn>
            <ActionBtn color={color}><IconMore size={22} color={color} /></ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared: Info Section ─── */

function InfoSection({
  card,
  isDark,
  showCounts,
  hideUserRow,
}: {
  card: ReelCardBase;
  isDark: boolean;
  showCounts?: boolean;
  hideUserRow?: boolean;
}) {
  const textColor = isDark ? "#ffffff" : "#000000";
  const subtleColor = isDark ? "rgba(255,255,255,0.48)" : "rgba(0,0,0,0.48)";
  const hasDescription = !!card.description;

  return (
    <div className="pt-3 pb-1 px-1 flex flex-col gap-1.5">
      {!hideUserRow && (
        <div className="flex items-center gap-2">
          <Avatar url={card.avatarUrl} size={32} isDark={isDark} />
          <span className="font-rethink text-[16px] font-medium" style={{ color: textColor }}>
            {card.username}
          </span>
          <FollowButton isDark={isDark} />
        </div>
      )}
      {hasDescription && (
        <p className="font-rethink text-[15px] m-0 leading-snug line-clamp-4" style={{ color: textColor }}>
          {card.description}
          <span style={{ color: subtleColor }}> more</span>
        </p>
      )}
      {!hasDescription && card.timestamp && (
        <p className="font-rethink text-[14px] m-0" style={{ color: subtleColor }}>
          {card.timestamp}
        </p>
      )}
      <ActionBar card={card} isDark={isDark} showCounts={showCounts} />
    </div>
  );
}

/* ─── Shared: Action Bar ─── */

function ActionBar({ card, isDark, showCounts }: { card: ReelCardBase; isDark: boolean; showCounts?: boolean }) {
  const color = isDark ? "#ffffff" : "#000000";
  return (
    <div className="flex items-center justify-between pt-1">
      <div className="flex items-center gap-4">
        <ActionBtn color={color} count={showCounts ? card.likes : undefined}><IconLike size={22} color={color} /></ActionBtn>
        <ActionBtn color={color} count={showCounts ? card.comments : undefined}><IconComment size={22} color={color} /></ActionBtn>
        <ActionBtn color={color} count={showCounts ? card.saves : undefined}><IconBookmark size={22} color={color} /></ActionBtn>
      </div>
      <div className="flex items-center gap-4">
        <ActionBtn color={color}><IconShare size={22} color={color} /></ActionBtn>
        <ActionBtn color={color}><IconMore size={22} color={color} /></ActionBtn>
      </div>
    </div>
  );
}

function ActionBtn({ color, count, children }: { color: string; count?: string; children: React.ReactNode }) {
  return (
    <button className="bg-transparent border-none cursor-pointer p-0 flex items-center gap-1">
      {children}
      {count && <span className="font-rethink text-[13px]" style={{ color }}>{count}</span>}
    </button>
  );
}

/* ─── Shared helpers ─── */

function Avatar({ url, size, isDark }: { url?: string; size: number; isDark?: boolean }) {
  if (url) return <img src={url} alt="" className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  return <div className="rounded-full flex-shrink-0" style={{ width: size, height: size, background: isDark ? "#333" : "#ddd" }} />;
}

function ActionIcon({ count, children }: { count?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {children}
      {count && <span className="font-rethink text-[11px] text-white">{count}</span>}
    </div>
  );
}

function FollowButton({ isDark, light }: { isDark?: boolean; light?: boolean }) {
  const bg = light ? "rgba(255,255,255,0.2)" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";
  const color = light ? "#ffffff" : isDark ? "#ffffff" : "#000000";
  return (
    <button className="w-5 h-5 rounded-full flex items-center justify-center border-none cursor-pointer ml-0.5 flex-shrink-0" style={{ background: bg }}>
      <IconPlus size={10} color={color} />
    </button>
  );
}

