"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  maxWidthClassName?: string;
};

export function Modal({
  open,
  onClose,
  label,
  children,
  maxWidthClassName = "max-w-3xl",
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/50 p-4 md:p-8"
      onClick={onClose}
    >
      <div
        className={`relative mx-auto w-full ${maxWidthClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}
