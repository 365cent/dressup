"use client"

import { useState } from "react"
import Image from "next/image"
import WardrobeItemDetail from "./WardrobeItemDetail"

interface WearingItem {
  item: string
  category: string
  color: string
  pattern?: string
  material?: string
  brand?: string
  luxury: boolean
  clean?: boolean
  comfortable?: boolean
  fit_style?: string
  season?: string
  opacity?: string
  color_match?: string
  trendiness?: string
  formalness?: string
  user_rating: number
  length?: string
  stretchable?: boolean
  waist_fit?: string
  shining?: boolean
}

interface PersonData {
  type: string
  gender: string
  age: string
  skin: string
  pose: string
  expression: string
  fit: string
  wearing: WearingItem[]
}


interface WardrobeProps {
  items: Array<{ image: string; scenario: string; score?: number; details: PersonData }>
  scenario: string
  score?: number
  onBack: () => void
}

export default function Wardrobe({ items, scenario, onBack }: WardrobeProps) {
  const [selectedItem, setSelectedItem] = useState<{ image: string; scenario: string; score?: number; details: PersonData } | null>(null)

  if (selectedItem) {
    return (
      <WardrobeItemDetail
        image={selectedItem.image}
        scenario={selectedItem.scenario}
        score={selectedItem.score || 0}
        details={selectedItem.details}
        onBack={() => setSelectedItem(null)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-black text-white p-8">
      <h2 className="text-3xl font-light mb-6">Your Wardrobe</h2>
      <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-grow">
        {items.map((item, index) => (
          <div
            key={index}
            className="relative cursor-pointer transform transition-transform hover:scale-105"
            onClick={() => setSelectedItem(item)}
          >
            <Image
              src={item.image || "/placeholder.svg"}
              alt={`Outfit ${index + 1}`}
              width={200}
              height={200}
              className="rounded-lg object-cover w-full h-full"
            />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 rounded-full p-2">
              <span className="text-lg font-semibold">{item.details.fit}</span>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onBack}
        className="mt-6 bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition duration-300"
      >
        Back to Camera
      </button>
    </div>
  )
}

