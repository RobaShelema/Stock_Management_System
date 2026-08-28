import React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";

export default function ToastHost() {
  const { toast } = useApp();
  if (!toast) return null;
  const isWarn = toast.tone === "warn";
  return (
    <div className="fixed bottom-5 right-5 z-50 animate-fade-in">
      <div
        className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ring-1 ${
          isWarn
            ? "bg-clay-50 text-clay-700 ring-clay-200"
            : "bg-emerald-50 text-emerald-800 ring-emerald-200"
        }`}
      >
        {isWarn ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
        {toast.message}
      </div>
    </div>
  );
}
