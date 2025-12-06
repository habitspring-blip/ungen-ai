"use client"

import { useState } from "react"
import { COMMANDS } from "./commands"

interface Command {
  id: string;
  label: string;
  type: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (command: Command) => void;
}

export default function CommandPalette({ open, onClose, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState("")

  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-40">
      <div className="bg-white w-[480px] rounded-2xl shadow-2xl border border-black/10 p-4">

        <input
          autoFocus
          className="w-full px-4 py-3 border border-black/10 rounded-xl outline-none text-sm mb-3"
          placeholder="Type a command..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="max-h-64 overflow-y-auto">
          {filtered.map(cmd => (
            <div
              key={cmd.id}
              className="px-3 py-2 rounded-lg hover:bg-black/5 cursor-pointer text-sm"
              onClick={() => {
                onSelect(cmd)
                onClose()
              }}
            >
              {cmd.label}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
