"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, ChevronLeft, Shirt, Watch, AlertCircle } from "lucide-react"
import type { OutfitAnalysis } from "@/lib/clothing-analysis-service"

interface RealtimeAnalysisSidebarProps {
  isOpen: boolean
  onToggle: () => void
  analysis: OutfitAnalysis | null
  isLoading: boolean
  isTabVisible: boolean
  lastUpdated: Date | null
}

export default function RealtimeAnalysisSidebar({
  isOpen,
  onToggle,
  analysis,
  isLoading,
  isTabVisible,
  lastUpdated,
}: RealtimeAnalysisSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  // Format the last updated time
  const getLastUpdatedText = () => {
    if (!lastUpdated) return "Not yet analyzed"

    const now = new Date()
    const diffSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000)

    if (diffSeconds < 5) return "Just now"
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`

    const diffMinutes = Math.floor(diffSeconds / 60)
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`
  }

  return (
    <>
      {/* Sidebar toggle button */}
      <button
        onClick={onToggle}
        className="absolute bottom-24 right-6 z-20 bg-white text-black rounded-full p-3 shadow-lg hover:bg-opacity-90 transition-all duration-300"
      >
        {isOpen ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
      </button>

      {/* Collapsible sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-0 right-0 z-10 h-full w-2/3 bg-black bg-opacity-80 backdrop-blur-md rounded-l-3xl overflow-hidden"
          >
            <div className="h-full flex flex-col p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-light">Real-time Analysis</h2>
                <button
                  onClick={onToggle}
                  className="bg-white bg-opacity-10 rounded-full p-2 hover:bg-opacity-20 transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status indicator */}
              <div className="mb-4 flex items-center justify-between bg-white bg-opacity-5 p-3 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${isTabVisible ? "bg-green-500" : "bg-yellow-500"}`}></div>
                  <span className="text-sm">
                    {isTabVisible ? "Analysis active" : "Analysis paused (tab not in focus)"}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{getLastUpdatedText()}</span>
              </div>

              {isLoading ? (
                <div className="flex-grow flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Analyzing your outfit...</p>
                </div>
              ) : !analysis ? (
                <div className="flex-grow flex items-center justify-center">
                  <p className="text-gray-400">No analysis data available yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Style Profile */}
                  <div>
                    <button
                      onClick={() => toggleSection("style")}
                      className="w-full flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-xl hover:bg-opacity-10 transition-all duration-300"
                    >
                      <h3 className="text-lg font-medium">Style Profile</h3>
                      <ChevronRight
                        className={`w-5 h-5 transition-transform duration-300 ${
                          expandedSection === "style" ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {expandedSection === "style" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-white bg-opacity-5 mt-1 rounded-xl space-y-3">
                            {Object.entries(analysis.style).map(([style, value]) => (
                              <div key={style} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm capitalize">{style}</span>
                                  <span className="text-sm">{Math.round(value * 100)}%</span>
                                </div>
                                <div className="h-2 bg-white bg-opacity-10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-white"
                                    style={{ width: `${Math.round(value * 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Clothing Items */}
                  <div>
                    <button
                      onClick={() => toggleSection("clothing")}
                      className="w-full flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-xl hover:bg-opacity-10 transition-all duration-300"
                    >
                      <div className="flex items-center">
                        <Shirt className="w-5 h-5 mr-2" />
                        <h3 className="text-lg font-medium">Clothing Items</h3>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 transition-transform duration-300 ${
                          expandedSection === "clothing" ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {expandedSection === "clothing" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-white bg-opacity-5 mt-1 rounded-xl space-y-3">
                            {analysis.clothingItems.length === 0 ? (
                              <p className="text-gray-400 text-sm">No clothing items detected</p>
                            ) : (
                              analysis.clothingItems.map((item, index) => (
                                <div key={index} className="p-2 bg-white bg-opacity-5 rounded-lg">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium capitalize">{item.type}</span>
                                    <span className="text-xs bg-white bg-opacity-10 px-2 py-0.5 rounded-full">
                                      {Math.round(item.confidence * 100)}%
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-xs text-gray-400">Color</span>
                                      <div className="flex items-center">
                                        <div
                                          className="w-3 h-3 rounded-full mr-1"
                                          style={{
                                            backgroundColor: item.color.startsWith("#") ? item.color : undefined,
                                          }}
                                        ></div>
                                        <span className="capitalize">{item.color}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-400">Pattern</span>
                                      <div className="capitalize">{item.pattern}</div>
                                    </div>
                                    {item.material && (
                                      <div>
                                        <span className="text-xs text-gray-400">Material</span>
                                        <div className="capitalize">{item.material}</div>
                                      </div>
                                    )}
                                    {item.fit && (
                                      <div>
                                        <span className="text-xs text-gray-400">Fit</span>
                                        <div className="capitalize">{item.fit}</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}

                            {/* Show a message if no bottom garment is detected */}
                            {!analysis.hasBottomGarment && (
                              <div className="flex items-center p-2 bg-yellow-500 bg-opacity-20 rounded-lg">
                                <AlertCircle className="w-4 h-4 mr-2 text-yellow-400" />
                                <p className="text-sm text-yellow-400">No bottom garment detected</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Accessories */}
                  <div>
                    <button
                      onClick={() => toggleSection("accessories")}
                      className="w-full flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-xl hover:bg-opacity-10 transition-all duration-300"
                    >
                      <div className="flex items-center">
                        <Watch className="w-5 h-5 mr-2" />
                        <h3 className="text-lg font-medium">Accessories</h3>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 transition-transform duration-300 ${
                          expandedSection === "accessories" ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {expandedSection === "accessories" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-white bg-opacity-5 mt-1 rounded-xl">
                            {analysis.accessories.length === 0 ? (
                              <p className="text-gray-400 text-sm">No accessories detected</p>
                            ) : (
                              <div className="space-y-3">
                                {analysis.accessories.map((item, index) => (
                                  <div key={index} className="p-2 bg-white bg-opacity-5 rounded-lg">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-medium capitalize">{item.type}</span>
                                      <span className="text-xs bg-white bg-opacity-10 px-2 py-0.5 rounded-full">
                                        {Math.round(item.confidence * 100)}%
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      {item.color && (
                                        <div>
                                          <span className="text-xs text-gray-400">Color</span>
                                          <div className="flex items-center">
                                            <div
                                              className="w-3 h-3 rounded-full mr-1"
                                              style={{
                                                backgroundColor: item.color.startsWith("#") ? item.color : undefined,
                                              }}
                                            ></div>
                                            <span className="capitalize">{item.color}</span>
                                          </div>
                                        </div>
                                      )}
                                      {item.position && (
                                        <div>
                                          <span className="text-xs text-gray-400">Position</span>
                                          <div className="capitalize">{item.position}</div>
                                        </div>
                                      )}
                                      {item.material && (
                                        <div>
                                          <span className="text-xs text-gray-400">Material</span>
                                          <div className="capitalize">{item.material}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Color Palette */}
                  <div>
                    <button
                      onClick={() => toggleSection("colors")}
                      className="w-full flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-xl hover:bg-opacity-10 transition-all duration-300"
                    >
                      <h3 className="text-lg font-medium">Color Palette</h3>
                      <ChevronRight
                        className={`w-5 h-5 transition-transform duration-300 ${
                          expandedSection === "colors" ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {expandedSection === "colors" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-white bg-opacity-5 mt-1 rounded-xl">
                            <div className="flex flex-wrap gap-2 justify-center">
                              {analysis.dominantColors.map((color, index) => (
                                <div key={index} className="flex flex-col items-center">
                                  <div
                                    className="w-12 h-12 rounded-md shadow-sm"
                                    style={{ backgroundColor: color }}
                                  ></div>
                                  <span className="text-xs mt-1">{color}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Occasions & Season */}
                  <div>
                    <button
                      onClick={() => toggleSection("occasions")}
                      className="w-full flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-xl hover:bg-opacity-10 transition-all duration-300"
                    >
                      <h3 className="text-lg font-medium">Occasions & Season</h3>
                      <ChevronRight
                        className={`w-5 h-5 transition-transform duration-300 ${
                          expandedSection === "occasions" ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {expandedSection === "occasions" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-white bg-opacity-5 mt-1 rounded-xl space-y-4">
                            <div>
                              <h4 className="text-sm text-gray-400 mb-2">Season</h4>
                              <div className="inline-block bg-white bg-opacity-10 px-3 py-1 rounded-full text-sm">
                                {analysis.season}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm text-gray-400 mb-2">Suitable Occasions</h4>
                              <div className="flex flex-wrap gap-2">
                                {analysis.occasions.map((occasion, index) => (
                                  <div key={index} className="bg-white bg-opacity-10 px-3 py-1 rounded-full text-sm">
                                    {occasion}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
