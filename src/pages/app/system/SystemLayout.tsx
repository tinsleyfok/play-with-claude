import { Outlet } from "react-router";

/** Layout for `/app/system/*` — outlet only so each child owns the screen. */
export function SystemLayout() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Outlet />
    </div>
  );
}
