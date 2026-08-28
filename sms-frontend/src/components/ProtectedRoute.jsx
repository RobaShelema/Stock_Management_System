import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { Boxes } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { currentUser, authChecked } = useApp();

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Boxes size={28} className="animate-pulse" />
          <p className="text-sm">Restoring your session…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}
