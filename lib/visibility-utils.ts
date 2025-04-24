// Utility to track document visibility and tab focus

type VisibilityCallback = (isVisible: boolean) => void
const visibilityCallbacks: VisibilityCallback[] = []

// Initialize visibility tracking
export function initVisibilityTracking() {
  // Handle visibility change events
  document.addEventListener("visibilitychange", () => {
    const isVisible = document.visibilityState === "visible"
    visibilityCallbacks.forEach((callback) => callback(isVisible))
  })
}

// Register a callback for visibility changes
export function onVisibilityChange(callback: VisibilityCallback) {
  visibilityCallbacks.push(callback)

  // Immediately call with current state
  callback(document.visibilityState === "visible")

  // Return a function to unregister the callback
  return () => {
    const index = visibilityCallbacks.indexOf(callback)
    if (index !== -1) {
      visibilityCallbacks.splice(index, 1)
    }
  }
}

// Check if the document is currently visible
export function isDocumentVisible(): boolean {
  return document.visibilityState === "visible"
}
