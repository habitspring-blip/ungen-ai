/**
 * Tool usage tracking utility
 * Allows one free use per tool per browser before prompting for upgrade
 */

const TOOL_USAGE_KEY = 'ungen_ai_tool_usage'
const FREE_USES_PER_TOOL = 1

export interface ToolUsage {
  [toolId: string]: {
    used: number
    lastUsed: string
  }
}

/**
 * Get current tool usage from localStorage
 */
export function getToolUsage(): ToolUsage {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(TOOL_USAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error reading tool usage:', error)
    return {}
  }
}

/**
 * Save tool usage to localStorage
 */
export function saveToolUsage(usage: ToolUsage): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(TOOL_USAGE_KEY, JSON.stringify(usage))
  } catch (error) {
    console.error('Error saving tool usage:', error)
  }
}

/**
 * Check if a tool can be used (has free uses remaining)
 */
export function canUseTool(toolId: string): boolean {
  const usage = getToolUsage()
  const toolUsage = usage[toolId]

  if (!toolUsage) return true // First time using this tool

  return toolUsage.used < FREE_USES_PER_TOOL
}

/**
 * Record tool usage and return whether it was allowed
 */
export function recordToolUsage(toolId: string): boolean {
  if (!canUseTool(toolId)) {
    return false // Usage not allowed
  }

  const usage = getToolUsage()
  const now = new Date().toISOString()

  usage[toolId] = {
    used: (usage[toolId]?.used || 0) + 1,
    lastUsed: now
  }

  saveToolUsage(usage)
  return true // Usage recorded successfully
}

/**
 * Get remaining free uses for a tool
 */
export function getRemainingUses(toolId: string): number {
  const usage = getToolUsage()
  const toolUsage = usage[toolId]

  if (!toolUsage) return FREE_USES_PER_TOOL

  return Math.max(0, FREE_USES_PER_TOOL - toolUsage.used)
}

/**
 * Check if any tool has been used (for upgrade prompts)
 */
export function hasUsedAnyTool(): boolean {
  const usage = getToolUsage()
  return Object.keys(usage).length > 0
}

/**
 * Reset tool usage (for testing or admin purposes)
 */
export function resetToolUsage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOOL_USAGE_KEY)
}

/**
 * Get usage summary for all tools
 */
export function getUsageSummary(): { toolId: string; used: number; remaining: number }[] {
  const usage = getToolUsage()

  // Define all available tools
  const allTools = [
    'rewrite',
    'summarize',
    'expand',
    'seo',
    'citation',
    'plagiarism',
    'ai-detection',
    'grammar'
  ]

  return allTools.map(toolId => {
    const toolUsage = usage[toolId]
    const used = toolUsage?.used || 0
    const remaining = Math.max(0, FREE_USES_PER_TOOL - used)

    return {
      toolId,
      used,
      remaining
    }
  })
}