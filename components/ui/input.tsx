"use client";

import React from "react";

type InputProps = {
  onEnter?: () => void;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
};

export default function Input({
  onEnter,
  placeholder = "Enter prompt...",
  className = "",
  value,
  onChange,
}: InputProps) {
  return (
    <input
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          onEnter?.();
        }
      }}
      className={`w-full rounded-xl border border-(--border-color) bg-(--input-background) px-6 py-3 text-(--input-foreground) outline-none ${className}`}
      type="text"
      placeholder={placeholder}
    />
  );
}
