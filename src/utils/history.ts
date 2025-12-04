export function saveHistory(input, output) {
  const existing = JSON.parse(localStorage.getItem("history") || "[]")

  existing.unshift({
    input,
    output,
    timestamp: Date.now()
  })

  localStorage.setItem("history", JSON.stringify(existing))
}
