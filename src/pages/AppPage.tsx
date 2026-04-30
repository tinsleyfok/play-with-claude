import { useState, useRef, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { useTheme } from "../hooks/useTheme";
import { BottomMenuBar } from "../components/BottomMenuBar";
import { CreateSheet } from "../components/CreateSheet";

export function AppPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [createOpen, setCreateOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { pathname } = useLocation();
  const isSystemRoute = pathname.startsWith("/app/system");
  const isInboxRoute = pathname.includes("/inbox");
  const isMvpProfileRoute = pathname.startsWith("/app/mvp/profile");
  const appBg = isDark ? "#000000" : isInboxRoute || isMvpProfileRoute ? "#FAFAFA" : "#f2f2f2";
  const bottomNavMode =
    isSystemRoute || isMvpProfileRoute ? "none" : pathname.startsWith("/app/mvp") ? "mvp" : "v1";

  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (isMvpProfileRoute) setCreateOpen(false);
  }, [isMvpProfileRoute]);

  const handleNavigate = () => {
    setCreateOpen(false);
    contentRef.current?.scrollTo(0, 0);
  };

  const skipLink = (
    <Link
      to="/"
      className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-black/80 focus:px-3 focus:py-2 focus:text-[13px] focus:text-white focus:outline-none"
    >
      Back to folders
    </Link>
  );

  if (isSystemRoute) {
    return (
      <div className="app-shell app-shell--system">
        <div className="app-system-route-inner" style={{ background: appBg }}>
          {skipLink}
          <div ref={contentRef} className="app-content flex min-h-0 flex-1 flex-col" data-bottom-nav="none">
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-phone-wrapper">
        <img
          src={`${import.meta.env.BASE_URL}Image/Phone.png`}
          alt=""
          className="app-phone-img"
        />
        <div className="app-phone-screen" style={{ background: appBg }}>
          <div className="app-screen-inner">
            {skipLink}
            <div ref={contentRef} className="app-content" data-bottom-nav={bottomNavMode}>
              <Outlet />
            </div>
            {bottomNavMode !== "none" && (
              <BottomMenuBar onCreatePress={() => setCreateOpen(!createOpen)} onNavigate={handleNavigate} createOpen={createOpen} />
            )}
            <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}
