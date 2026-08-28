import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "max-w-lg",
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-950/55 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${width} animate-fade-in rounded-2xl bg-white shadow-2xl shadow-navy-950/20 ring-1 ring-navy-100`}
      >
        <div className="flex items-center justify-between border-b border-navy-50 px-5 py-4">
          <h3 className="text-base font-semibold text-navy-900">{title}</h3>
          <button
            onClick={onClose}
            className="focus-ring rounded-lg p-1 text-slate-400 hover:bg-navy-50 hover:text-navy-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-navy-50 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
