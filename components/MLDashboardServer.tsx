"use server"

import { Suspense } from "react"
import { executeMCPOperation } from "@/lib/mcp-protocol"
import MLDashboardClient from "./MLDashboardClient"
import MLDashboardLoading from "./MLDashboardLoading"

export default async function MLDashboardServer() {
  // Fetch analysis data and stats from MCP
  const analyses = await executeMCPOperation({ type: "FETCH_ANALYSES" })
  const stats = await executeMCPOperation({ type: "GET_STATS" })

  return (
    <Suspense fallback={<MLDashboardLoading />}>
      <MLDashboardClient initialAnalyses={analyses} initialStats={stats} />
    </Suspense>
  )
}
