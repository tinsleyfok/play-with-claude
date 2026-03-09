import { useMemo, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { inspirations } from "../inspirations/registry";
import type { Inspiration } from "../inspirations/types";

const themeItems = inspirations.filter((i) => i.palette);

function groupBy(items: Inspiration[]): Record<string, Inspiration[]> {
  const groups: Record<string, Inspiration[]> = {};
  for (const item of items) {
    (groups[item.group] ??= []).push(item);
  }
  return groups;
}

function PaletteCard({
  item,
  isDark,
}: {
  item: Inspiration;
  isDark: boolean;
}) {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const palette = item.palette!;
  const active = palette[mode];

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-colors ${
        isDark
          ? "bg-[#2c2c2c] shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
          : "bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)]"
      }`}
    >
      <div
        className={`relative h-96 overflow-hidden border-b ${
          isDark
            ? "border-[rgba(255,255,255,0.06)]"
            : "border-[rgba(0,0,0,0.04)]"
        }`}
      >
        <img
          src={active.screenshot}
          alt={`${item.title} ${mode} mode`}
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute top-3 right-3 flex rounded-full overflow-hidden text-[11px] font-medium shadow-sm">
          <button
            onClick={() => setMode("light")}
            className={`px-3 py-1.5 border-none cursor-pointer transition-colors ${
              mode === "light"
                ? "bg-white text-[#37352f]"
                : "bg-[rgba(0,0,0,0.5)] text-[rgba(255,255,255,0.7)] hover:text-white"
            }`}
          >
            Light
          </button>
          <button
            onClick={() => setMode("dark")}
            className={`px-3 py-1.5 border-none cursor-pointer transition-colors ${
              mode === "dark"
                ? "bg-[#2c2c2c] text-[#ebebeb]"
                : "bg-[rgba(0,0,0,0.5)] text-[rgba(255,255,255,0.7)] hover:text-white"
            }`}
          >
            Dark
          </button>
        </div>
      </div>

      <div
        className={`px-4 py-3 flex gap-2 overflow-x-auto border-b ${
          isDark
            ? "border-[rgba(255,255,255,0.06)]"
            : "border-[rgba(0,0,0,0.04)]"
        }`}
      >
        {active.colors.map((c) => (
          <div
            key={c.label}
            className="flex flex-col items-center gap-1.5 min-w-[52px]"
          >
            <div
              className="w-8 h-8 rounded-full shrink-0 border border-[rgba(128,128,128,0.2)]"
              style={{ backgroundColor: c.value }}
            />
            <span
              className={`text-[10px] font-mono leading-none ${
                isDark ? "text-[#9b9b9b]" : "text-[#787774]"
              }`}
            >
              {c.value}
            </span>
            <span
              className={`text-[9px] leading-none whitespace-nowrap ${
                isDark ? "text-[#5a5a5a]" : "text-[#b4b4b0]"
              }`}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>

      <div className="p-4">
        <h3
          className={`text-[15px] font-semibold m-0 ${
            isDark ? "text-[#ebebeb]" : "text-[#37352f]"
          }`}
        >
          {item.title}
        </h3>
        <p
          className={`text-[13px] mt-1.5 mb-0 leading-relaxed ${
            isDark ? "text-[#9b9b9b]" : "text-[#787774]"
          }`}
        >
          {item.description}
        </p>
        {item.source.startsWith("http") ? (
          <a
            href={item.source}
            target="_blank"
            rel="noopener noreferrer"
            className={`block text-[11px] mt-2 mb-0 no-underline hover:underline ${
              isDark
                ? "text-[#5a5a5a] hover:text-[#9b9b9b]"
                : "text-[#b4b4b0] hover:text-[#787774]"
            }`}
          >
            Source ↗
          </a>
        ) : (
          <p
            className={`text-[11px] mt-2 mb-0 ${
              isDark ? "text-[#5a5a5a]" : "text-[#b4b4b0]"
            }`}
          >
            {item.source}
          </p>
        )}
      </div>
    </div>
  );
}

export function ThemeInspirationPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const grouped = useMemo(() => groupBy(themeItems), []);

  if (themeItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 opacity-40 text-sm">
        No theme inspirations yet. Ask me to generate some!
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 pt-2 md:px-6">
      {Object.entries(grouped).map(([group, items]) => (
        <section key={group} className="mb-8">
          <h2
            className={`text-[13px] font-semibold uppercase tracking-wider mb-3 ${
              isDark ? "text-[#5a5a5a]" : "text-[#b4b4b0]"
            }`}
          >
            {group}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <PaletteCard key={item.id} item={item} isDark={isDark} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
