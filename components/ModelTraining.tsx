"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { initModels, trainModel, saveModel, loadModel, CLOTHING_CATEGORIES, STYLE_ATTRIBUTES } from "@/lib/ml-service"

export default function ModelTraining() {
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("train")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedCategory, setSelectedCategory] = useState(CLOTHING_CATEGORIES[0])
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([])
  const [trainingImages, setTrainingImages] = useState<
    {
      image: HTMLImageElement
      category: string
      styleAttributes: string[]
    }[]
  >([])

  useEffect(() => {
    const loadModelData = async () => {
      try {
        await initModels()
        const loaded = await loadModel()
        setIsModelLoaded(loaded)
        setMessage(loaded ? "Model loaded from storage" : "No saved model found")
      } catch (error) {
        console.error("Error loading model:", error)
        setMessage("Error loading model")
      }
    }

    loadModelData()
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    const reader = new FileReader()

    reader.onload = async (event) => {
      if (!event.target?.result) return

      const img = new Image()
      img.src = event.target.result as string

      img.onload = () => {
        setTrainingImages((prev) => [
          ...prev,
          {
            image: img,
            category: selectedCategory,
            styleAttributes: selectedAttributes,
          },
        ])

        setMessage(`Added training image for ${selectedCategory}`)
      }
    }

    reader.readAsDataURL(file)
  }

  const handleTrain = async () => {
    if (trainingImages.length === 0) {
      setMessage("No training images added")
      return
    }

    setIsTraining(true)
    setProgress(0)
    setMessage("Training model...")

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return 95
          }
          return prev + 5
        })
      }, 200)

      await trainModel(trainingImages)

      clearInterval(interval)
      setProgress(100)
      setMessage("Model trained successfully")

      // Save the model
      await saveModel()
      setIsModelLoaded(true)
    } catch (error) {
      console.error("Error training model:", error)
      setMessage("Error training model")
    } finally {
      setIsTraining(false)
    }
  }

  const toggleAttribute = (attr: string) => {
    setSelectedAttributes((prev) => (prev.includes(attr) ? prev.filter((a) => a !== attr) : [...prev, attr]))
  }

  return (
    <Card className="w-full max-w-3xl mx-auto bg-white bg-opacity-5 border-0 text-white">
      <CardHeader>
        <CardTitle>Outfit Analysis Model Training</CardTitle>
        <CardDescription className="text-gray-400">
          Train the machine learning model to recognize clothing items and style attributes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-white bg-opacity-10">
            <TabsTrigger value="train" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Train Model
            </TabsTrigger>
            <TabsTrigger value="test" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Test Model
            </TabsTrigger>
          </TabsList>

          <TabsContent value="train" className="space-y-4">
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Select Category</h3>
                <div className="flex flex-wrap gap-2">
                  {CLOTHING_CATEGORIES.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category)}
                      className={
                        selectedCategory === category
                          ? "bg-white text-black hover:bg-white hover:bg-opacity-90"
                          : "border-white text-white hover:bg-white hover:bg-opacity-10"
                      }
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Select Style Attributes</h3>
                <div className="flex flex-wrap gap-2">
                  {STYLE_ATTRIBUTES.map((attr) => (
                    <Button
                      key={attr}
                      variant={selectedAttributes.includes(attr) ? "default" : "outline"}
                      onClick={() => toggleAttribute(attr)}
                      className={
                        selectedAttributes.includes(attr)
                          ? "bg-white text-black hover:bg-white hover:bg-opacity-90"
                          : "border-white text-white hover:bg-white hover:bg-opacity-10"
                      }
                    >
                      {attr}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Add Training Images</h3>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isTraining}
                    className="bg-white text-black hover:bg-white hover:bg-opacity-90"
                  >
                    Upload Image
                  </Button>
                  <span className="text-sm text-gray-400">{trainingImages.length} images added</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>

              {trainingImages.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Training Images</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {trainingImages.map((item, index) => (
                      <div
                        key={index}
                        className="relative border border-white border-opacity-20 rounded-md overflow-hidden"
                      >
                        <img
                          src={item.image.src || "/placeholder.svg"}
                          alt={`Training ${index}`}
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1">
                          {item.category}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isTraining && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Training progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="bg-white bg-opacity-10" />
                </div>
              )}

              {message && <div className="bg-white bg-opacity-5 p-3 rounded-md text-sm">{message}</div>}
            </div>
          </TabsContent>

          <TabsContent value="test">
            <div className="space-y-4 mt-4">
              <div className="bg-white bg-opacity-5 p-4 rounded-md">
                <h3 className="font-medium mb-2">Model Status</h3>
                <p>{isModelLoaded ? "Model is loaded and ready for testing" : "No trained model available"}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Test with Image</h3>
                <Button disabled={!isModelLoaded} className="bg-white text-black hover:bg-white hover:bg-opacity-90">
                  Upload Test Image
                </Button>
              </div>

              <div className="bg-white bg-opacity-5 p-4 rounded-md">
                <p className="text-sm text-gray-400">Testing functionality will be available after model training</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setTrainingImages([])}
          className="border-white text-white hover:bg-white hover:bg-opacity-10"
        >
          Clear Data
        </Button>
        <Button
          onClick={handleTrain}
          disabled={isTraining || trainingImages.length === 0}
          className="bg-white text-black hover:bg-white hover:bg-opacity-90"
        >
          {isTraining ? "Training..." : "Train Model"}
        </Button>
      </CardFooter>
    </Card>
  )
}
