import React, { useState, useCallback } from 'react'
import {
  canUseTool,
  recordToolUsage,
  getRemainingUses,
  getUsageSummary
} from '@/utils/toolUsage'

export function useToolUsage(toolId: string) {
  const [usageState, setUsageState] = useState(() => ({
    canUse: canUseTool(toolId),
    remainingUses: getRemainingUses(toolId)
  }))

  const attemptUsage = useCallback((): boolean => {
    const success = recordToolUsage(toolId)
    if (success) {
      setUsageState({
        canUse: false,
        remainingUses: Math.max(0, usageState.remainingUses - 1)
      })
    }
    return success
  }, [toolId, usageState.remainingUses])

  const refreshUsage = useCallback(() => {
    setUsageState({
      canUse: canUseTool(toolId),
      remainingUses: getRemainingUses(toolId)
    })
  }, [toolId])

  return {
    canUse: usageState.canUse,
    remainingUses: usageState.remainingUses,
    attemptUsage,
    refreshUsage
  }
}

export function useToolUsageSummary() {
  const [summary, setSummary] = useState<ReturnType<typeof getUsageSummary>>([])

  const refreshSummary = useCallback(() => {
    setSummary(getUsageSummary())
  }, [])

  // Initialize on mount
  React.useEffect(() => {
    refreshSummary()
  }, [refreshSummary])

  return {
    summary,
    refreshSummary
  }
}