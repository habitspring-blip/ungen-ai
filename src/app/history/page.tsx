"use client";

import { useEffect, useState } from "react";
import ProtectedClient from "@/components/ProtectedClient";
import Sidebar from "@/components/Sidebar";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type HistoryItem = {
  id: string;
  input_text: string;
  output_text: string;
  mode: string;
  model?: string;
  created_at: string;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [sort, setSort] = useState("newest");

  // Load history safely
  useEffect(() => {
    async function fetchHistory() {
      const res = await fetch("/api/history");
      const json = await res.json();
      setHistory(json.history || []);
      setLoading(false);
    }

    fetchHistory();
  }, []);

  async function deleteItem(id: string) {
    await fetch("/api/history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    // reload after delete
    const res = await fetch("/api/history");
    const json = await res.json();
    setHistory(json.history || []);
  }

  // Filter + Sort
  const filtered = history
    .filter((item) => {
      const text = (item.output_text + " " + item.input_text).toLowerCase();
      return text.includes(search.toLowerCase());
    })
    .filter((item) => {
      if (!modeFilter) return true;
      return item.mode === modeFilter;
    })
    .sort((a, b) => {
      if (sort === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  return (
    <ProtectedClient>
      <div
        className="
          min-h-screen 
          bg-gradient-to-br 
          from-brand-indigo-start/10 
          to-brand-pink-end/10
          flex
        "
      >
        <Sidebar />

        <div className="flex-1">
          <Container className="py-12">

            {/* Header */}
            <div className="mb-12">
              <h1
                className="
                  text-3xl font-semibold tracking-tight 
                  bg-gradient-to-r from-brand-indigo-start to-brand-pink-end 
                  text-transparent bg-clip-text
                "
              >
                History
              </h1>
              <p className="text-ink-2 text-sm mt-1">
                Your entire rewrite timeline
              </p>
            </div>

            {/* Filter Bar */}
            <Card className="p-6 mb-10">
              <div className="flex flex-col md:flex-row gap-4">

                <input
                  type="text"
                  placeholder="Search your rewrites..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="
                    w-full px-3 py-2 rounded-md text-sm 
                    bg-surface-0 border border-surface-3 
                    text-ink-0 placeholder-ink-2
                  "
                />

                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  className="
                    w-full px-3 py-2 rounded-md text-sm
                    bg-surface-0 border border-surface-3 text-ink-0
                  "
                >
                  <option value="">All Modes</option>
                  <option value="humanise">Humanise</option>
                  <option value="professional">Professional</option>
                  <option value="email">Email</option>
                  <option value="concise">Concise</option>
                  <option value="friendly">Friendly</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="formal">Formal</option>
                  <option value="simplified">Simplified</option>
                </select>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="
                    w-full px-3 py-2 rounded-md text-sm
                    bg-surface-0 border border-surface-3 text-ink-0
                  "
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>

              </div>
            </Card>

            {/* Empty State */}
            {!loading && filtered.length === 0 && (
              <Card className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <div
                    className="
                      w-24 h-24 
                      bg-gradient-to-br from-brand-indigo-start/20 to-brand-pink-end/20
                      rounded-full flex items-center justify-center 
                      text-5xl mx-auto mb-6
                    "
                  >
                    📜
                  </div>
                  <h3 className="text-xl font-semibold text-ink-0 mb-2">
                    Nothing Found
                  </h3>
                  <p className="text-ink-2 text-sm mb-6">
                    Try changing filters or create a new rewrite.
                  </p>

                  <Button
                    variant="primary"
                    onClick={() => (window.location.href = "/editor")}
                  >
                    ✏️ Start Writing
                  </Button>
                </div>
              </Card>
            )}

            {/* History Items */}
            <div className="space-y-5">
              {filtered.map((item) => (
                <Card
                  key={item.id}
                  className="
                    p-6 group transition-all 
                    hover:shadow-depth hover:-translate-y-[1px]
                  "
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3
                        className="
                          text-lg font-semibold text-ink-0
                          bg-gradient-to-r from-brand-indigo-start/70 to-brand-pink-end/70 
                          bg-clip-text text-transparent
                        "
                      >
                        {item.mode.toUpperCase()} Rewrite
                      </h3>

                      <p className="text-ink-2 text-xs mt-1">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-red-600 text-sm hover:opacity-80"
                    >
                      Delete
                    </button>
                  </div>

                  <p className="text-sm text-ink-1 mb-3 line-clamp-2">
                    {item.output_text}
                  </p>

                  <div className="flex gap-3">
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `/editor?restore=${encodeURIComponent(
                          item.output_text
                        )}`)
                      }
                    >
                      Restore
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        navigator.clipboard.writeText(item.output_text)
                      }
                    >
                      Copy
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

          </Container>
        </div>
      </div>
    </ProtectedClient>
  );
}
