"use client";

import React from "react";

type InputProps = {
  onEnter?: () => void;
};

export default function Input({ onEnter }: InputProps) {
  return (
    <input
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          onEnter?.();
        }
      }}
      className="px-6 py-3 border border-(--border-color) rounded-md bg-(--input-background) text-(--input-foreground) outline-none w-210"
      type="text"
      placeholder="Enter prompt..."
    />
  );
}