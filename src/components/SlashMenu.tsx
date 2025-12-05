"use client"

import { useEffect, useState } from "react"
import { COMMANDS } from "./commands"

interface SlashMenuProps {
  visible: boolean;
  position: { top: number; left: number };
  onSelect: (command: { id: string; label: string; type: string }) => void;
}

export default function SlashMenu({ visible, position, onSelect }: SlashMenuProps) {
  if (!visible) return null

  return (
    <div
      className="absolute bg-white shadow-xl rounded-xl border border-black/10 w-64 p-2 z-50"
      style={{
        top: position.top + 24,
        left: position.left
      }}
    >
      {COMMANDS.map(cmd => (
        <div
          key={cmd.id}
          className="px-3 py-2 rounded-md hover:bg-black/5 cursor-pointer text-sm"
          onClick={() => onSelect(cmd)}
        >
          {cmd.label}
        </div>
      ))}
    </div>
  )
}
