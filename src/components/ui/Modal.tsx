"use client";

import React from "react";

export default function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-0 shadow-depth rounded-lg p-6 w-full max-w-md">
        {children}
      </div>
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
    </div>
  );
}
