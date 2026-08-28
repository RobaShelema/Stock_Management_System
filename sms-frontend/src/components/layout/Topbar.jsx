import React, { useEffect, useState } from "react";
import { Menu, LogOut, Bell, Sun, Moon } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Topbar({ onMenuClick }) {
  const {
    currentUser,
    notifications,
    refresh,
    markNotificationRead,
    markAllNotificationsRead,
    logout: doLogout,
    theme,
    toggleTheme,
  } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function logout() {
    await doLogout();
    navigate("/login");
  }

  useEffect(() => {
    if (!currentUser) return undefined;
    const timer = window.setInterval(() => refresh("notifications"), 60000);
    return () => window.clearInterval(timer);
  }, [currentUser, refresh]);

  const unread = notifications.filter((notification) => !notification.readAt);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center gap-3 border-b border-navy-100 bg-white/95 px-4 shadow-sm shadow-navy-900/5 backdrop-blur">
      <button
        onClick={onMenuClick}
        className="focus-ring rounded-lg p-2 text-navy-600 hover:bg-navy-50 lg:hidden"
      >
        <Menu size={20} />
      </button>
      <div className="flex-1" />
      <div className="relative">
        <button
          onClick={() => setOpen((value) => !value)}
          title="Notifications"
          className="focus-ring relative rounded-lg p-2 text-navy-600 hover:bg-navy-50"
        >
          <Bell size={18} />
          {unread.length > 0 && (
            <span className="absolute right-1 top-1 rounded-full bg-clay-500 px-1 text-[9px] font-bold text-white">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </button>
        {open && (
          <div className="absolute right-0 top-11 z-50 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">
                Notifications
              </p>
              {unread.length > 0 && (
                <button
                  onClick={() => markAllNotificationsRead()}
                  className="text-[11px] font-medium text-navy-700 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="py-5 text-center text-xs text-slate-400">
                  No notifications
                </p>
              )}
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() =>
                    !notification.readAt &&
                    markNotificationRead(notification.id)
                  }
                  className={`block w-full rounded-md p-2 text-left ${notification.readAt ? "bg-white" : "bg-navy-50"}`}
                >
                  <p className="text-xs font-semibold text-slate-800">
                    {notification.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={toggleTheme}
        title={theme === "dim" ? "Use light theme" : "Use dim theme"}
        aria-label={theme === "dim" ? "Use light theme" : "Use dim theme"}
        className="focus-ring rounded-lg p-2 text-navy-600 hover:bg-navy-50"
      >
        {theme === "dim" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="flex items-center gap-2.5 border-l border-navy-100 pl-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-clay-500 text-xs font-semibold text-white shadow-sm">
          {currentUser?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-slate-800">
            {currentUser?.name}
          </p>
          <p className="text-xs leading-tight text-slate-400">
            {currentUser?.role}
          </p>
        </div>
        <button
          onClick={logout}
          title="Log out"
          className="focus-ring ml-1 rounded-lg p-2 text-slate-400 hover:bg-clay-50 hover:text-clay-700"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
