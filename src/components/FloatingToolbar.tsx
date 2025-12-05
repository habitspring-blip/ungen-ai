"use client"

import { useEffect, useState, useRef } from "react"

interface FloatingToolbarProps {
  onRewrite: () => void;
  onShorten: () => void;
  onTone: (tone: string) => void;
}

export default function FloatingToolbar({ onRewrite, onShorten, onTone }: FloatingToolbarProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const ref = useRef(null)

  useEffect(() => {
    function updateToolbar() {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setVisible(false)
        return
      }

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      if (!rect) return

      setCoords({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY
      })

      setVisible(true)
    }

    document.addEventListener("mouseup", updateToolbar)
    document.addEventListener("keyup", updateToolbar)

    return () => {
      document.removeEventListener("mouseup", updateToolbar)
      document.removeEventListener("keyup", updateToolbar)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white shadow-xl border border-black/10 rounded-xl px-4 py-2 flex gap-4 text-sm"
      style={{
        left: coords.x,
        top: coords.y - 12,
        transform: "translate(-50%, -100%)"
      }}
    >
      <button className="hover:opacity-70" onClick={() => onRewrite()}>
        Rewrite
      </button>

      <button className="hover:opacity-70" onClick={() => onShorten()}>
        Shorten
      </button>

      <button className="hover:opacity-70" onClick={() => onTone("professional")}>
        Professional
      </button>

      <button className="hover:opacity-70" onClick={() => onTone("friendly")}>
        Friendly
      </button>
    </div>
  )
}
