"use client";

import type { ReactNode } from "react";

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  message: string;
  className: string;
};

export function ConfirmSubmitButton({
  children,
  message,
  className,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      className={className}
    >
      {children}
    </button>
  );
}
