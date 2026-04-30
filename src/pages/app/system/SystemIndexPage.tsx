import { Link } from "react-router";
import { useTheme } from "../../../hooks/useTheme";

/** `/app/system` — hub under the System folder (open Avatar from here or the menu). */
export function SystemIndexPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#000000" : "#f2f2f2";
  const fg = isDark ? "#ffffff" : "#000000";
  const muted = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
  const card = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const border = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 pt-3 font-rethink" style={{ background: bg, color: fg }}>
      <h1 className="m-0 text-[20px] font-bold tracking-tight">System</h1>
      <p className="m-0 mt-1 max-w-[20rem] text-[13px] leading-snug" style={{ color: muted }}>
        Pages in this folder are grouped under System in the App menu.
      </p>
      <Link
        to="/app/system/avatar"
        className="mt-5 block rounded-xl px-4 py-3 text-[15px] font-semibold no-underline transition-opacity hover:opacity-90"
        style={{ background: card, color: fg, border: `1px solid ${border}` }}
      >
        Avatar →
      </Link>
    </div>
  );
}
