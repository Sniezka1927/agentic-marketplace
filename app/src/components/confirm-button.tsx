"use client";

import { useState, type ReactNode } from "react";
import { Button } from "./ui";

export function ConfirmButton({
  children,
  confirmLabel = "Click again to confirm",
  disabled,
  onConfirm,
}: {
  children: ReactNode;
  confirmLabel?: string;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);
  return (
    <Button
      variant={armed ? "danger" : "secondary"}
      disabled={disabled}
      onBlur={() => setArmed(false)}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? confirmLabel : children}
    </Button>
  );
}
