interface HistoryEntry {
  input: string;
  output: string;
  timestamp: number;
}

export function saveHistory(input: string, output: string) {
  console.log("🔧 saveHistory called with:", { inputLength: input.length, outputLength: output.length });
  
  try {
    const existing: HistoryEntry[] = JSON.parse(localStorage.getItem("history") || "[]")
    console.log("📋 Current history entries:", existing.length);

    existing.unshift({
      input,
      output,
      timestamp: Date.now()
    })

    localStorage.setItem("history", JSON.stringify(existing))
    console.log("💾 Saved to localStorage successfully. Total entries:", existing.length);
    
    // Verify the save
    const verify = localStorage.getItem("history");
    console.log("✅ Verification - localStorage contains:", verify ? "data" : "nothing");
  } catch (error) {
    console.error("❌ Error saving history:", error);
  }
}
