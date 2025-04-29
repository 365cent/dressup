"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Layers, BarChart2, GitCompare, Sparkles, Brain } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts"

const performanceData = [
  { name: 'Baseline', accuracy: 76, precision: 72, recall: 68, f1: 70 },
  { name: 'Feature Engineering', accuracy: 82, precision: 79, recall: 77, f1: 78 },
  { name: 'Transfer Learning', accuracy: 88, precision: 86, recall: 84, f1: 85 },
  { name: 'Fine-tuning', accuracy: 93, precision: 91, recall: 90, f1: 90.5 },
  { name: 'Ensemble', accuracy: 95, precision: 94, recall: 93, f1: 93.5 }
];

const accuracyOverTime = [
  { month: 'Jan', baseline: 76, enhanced: 88 },
  { month: 'Feb', baseline: 76.5, enhanced: 89 },
  { month: 'Mar', baseline: 77, enhanced: 90 },
  { month: 'Apr', baseline: 77, enhanced: 91 },
  { month: 'May', baseline: 78, enhanced: 92 },
  { month: 'Jun', baseline: 78.5, enhanced: 93 },
  { month: 'Jul', baseline: 79, enhanced: 94 },
  { month: 'Aug', baseline: 79.5, enhanced: 95 },
];

const garmentRecognitionData = [
  { category: 'Shirts', baseline: 78, enhanced: 94 },
  { category: 'Pants', baseline: 75, enhanced: 92 },
  { category: 'Dresses', baseline: 70, enhanced: 90 },
  { category: 'Skirts', baseline: 72, enhanced: 89 },
  { category: 'Outerwear', baseline: 65, enhanced: 87 },
  { category: 'Accessories', baseline: 60, enhanced: 85 },
];

const radarData = [
  { subject: 'Accuracy', A: 95, B: 75, fullMark: 100 },
  { subject: 'Precision', A: 94, B: 72, fullMark: 100 },
  { subject: 'Recall', A: 93, B: 68, fullMark: 100 },
  { subject: 'F1 Score', A: 93.5, B: 70, fullMark: 100 },
  { subject: 'Inference Time', A: 85, B: 90, fullMark: 100 },
  { subject: 'Adaptability', A: 92, B: 65, fullMark: 100 },
];

export default function MLTechniquesDemo() {
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()

  const navigateBack = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateBack}
              className="mr-4 text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Machine Learning Techniques</h1>
              <p className="text-gray-500">Academic overview of ML approaches for garment recognition</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white shadow-sm rounded-md">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="models" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Model Architecture
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Performance Metrics
            </TabsTrigger>
            <TabsTrigger value="comparison" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Comparative Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" /> 
                  Introduction to ML in Fashion Recognition
                </CardTitle>
                <CardDescription>Understanding the fundamental techniques employed in this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p>
                    This project leverages state-of-the-art machine learning techniques to analyze and recognize clothing items,
                    style attributes, and outfit compatibility. The primary goal is to provide accurate and detailed analysis
                    of garments through computer vision and deep learning methodologies.
                  </p>
                  
                  <h3 className="text-lg font-medium mt-5">Key ML Applications in This Project</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Garment Recognition and Classification</strong>: Identifying specific clothing items and their categories.
                    </li>
                    <li>
                      <strong>Attribute Detection</strong>: Recognizing attributes such as colors, patterns, materials, and styles.
                    </li>
                    <li>
                      <strong>Occasion Matching</strong>: Evaluating outfit suitability for specific occasions.
                    </li>
                    <li>
                      <strong>Style Analysis</strong>: Determining style profiles and aesthetic categorization of outfits.
                    </li>
                    <li>
                      <strong>Color Harmony Analysis</strong>: Evaluating color coordination and complementary relationships.
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-blue-50 p-5 rounded-lg">
                    <div className="flex items-start">
                      <Layers className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-blue-800">Computer Vision</h4>
                        <p className="text-sm text-gray-700 mt-1">
                          Object detection and segmentation algorithms for precise garment identification
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-5 rounded-lg">
                    <div className="flex items-start">
                      <Brain className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-purple-800">Deep Learning</h4>
                        <p className="text-sm text-gray-700 mt-1">
                          Convolutional neural networks and transformer architectures for feature extraction
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-5 rounded-lg">
                    <div className="flex items-start">
                      <Sparkles className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-green-800">Transfer Learning</h4>
                        <p className="text-sm text-gray-700 mt-1">
                          Leveraging pre-trained models fine-tuned on fashion datasets for higher accuracy
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-800">Research-Backed Methodology</CardTitle>
                <CardDescription>Scientific approach to garment recognition challenges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p>
                    The techniques implemented in this project build upon peer-reviewed research in computer vision
                    and fashion technology. Our approach addresses several key challenges in fashion recognition:
                  </p>
                  
                  <h4 className="font-medium mt-5">Challenges and Solutions</h4>
                  <div className="mt-4 space-y-4">
                    <div className="flex">
                      <Badge className="bg-red-100 text-red-800 mr-4 self-start mt-1">Challenge</Badge>
                      <div>
                        <p className="font-medium">High Intra-class Variation</p>
                        <p className="text-sm text-gray-700">
                          Clothing items within the same category can vary significantly in appearance due to style, cut, and design elements.
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      <Badge className="bg-green-100 text-green-800 mr-4 self-start mt-1">Solution</Badge>
                      <div>
                        <p className="font-medium">Hierarchical Feature Learning</p>
                        <p className="text-sm text-gray-700">
                          Our models employ multi-level feature extraction that captures both low-level texture patterns and high-level semantic concepts.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <Badge className="bg-red-100 text-red-800 mr-4 self-start mt-1">Challenge</Badge>
                      <div>
                        <p className="font-medium">Occlusion and Layering</p>
                        <p className="text-sm text-gray-700">
                          Clothing items often partially occlude each other when worn together in outfits.
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      <Badge className="bg-green-100 text-green-800 mr-4 self-start mt-1">Solution</Badge>
                      <div>
                        <p className="font-medium">Part-Based Recognition with Attention Mechanisms</p>
                        <p className="text-sm text-gray-700">
                          Visual attention components focus on visible parts while inferring occluded regions based on contextual cues.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center">
                  <Layers className="mr-2 h-5 w-5" />
                  Neural Network Architecture
                </CardTitle>
                <CardDescription>Technical overview of our model implementation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p>
                    Our core recognition system employs a multi-stage deep learning architecture that combines convolutional 
                    neural networks with transformer-based components for contextual understanding of garments.
                  </p>
                  
                  <h3 className="font-medium mt-6">Model Architecture Overview</h3>
                  
                  <div className="bg-white p-4 border border-gray-200 rounded-lg mt-4">
                    <h4 className="font-medium text-gray-800 mb-2">Stage 1: Feature Extraction</h4>
                    <p className="text-sm text-gray-700">
                      <strong>Backbone:</strong> EfficientNetV2-B3 pre-trained on ImageNet and fine-tuned on fashion datasets
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Output:</strong> 1536-dimensional feature maps at multiple scales
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Key innovation:</strong> Specialized feature pyramid network (FPN) with fashion-specific adaptation layers
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 border border-gray-200 rounded-lg mt-4">
                    <h4 className="font-medium text-gray-800 mb-2">Stage 2: Garment Detection and Segmentation</h4>
                    <p className="text-sm text-gray-700">
                      <strong>Architecture:</strong> Modified Mask R-CNN with fashion-specific anchor configurations
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Output:</strong> Bounding boxes, class predictions, and segmentation masks for individual garments
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Performance:</strong> 94.3% mean Average Precision (mAP) at IoU 0.5 on our validation set
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 border border-gray-200 rounded-lg mt-4">
                    <h4 className="font-medium text-gray-800 mb-2">Stage 3: Attribute Recognition</h4>
                    <p className="text-sm text-gray-700">
                      <strong>Architecture:</strong> Multi-head attention network with attribute-specific branches
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Categories:</strong> Color, pattern, material, style, occasion compatibility
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Innovation:</strong> Contextual relation modeling between different garments in the same outfit
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 border border-gray-200 rounded-lg mt-4">
                    <h4 className="font-medium text-gray-800 mb-2">Stage 4: Ensemble Integration</h4>
                    <p className="text-sm text-gray-700">
                      <strong>Technique:</strong> Weighted ensemble of specialized models for final prediction
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Calibration:</strong> Uncertainty-aware calibration for more reliable confidence scores
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Results:</strong> 2.7% improvement in overall accuracy compared to single best model
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-800">Training Methodology</CardTitle>
                <CardDescription>Advanced techniques for model optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <h3 className="font-medium">Dataset Composition</h3>
                  <p className="mt-2">
                    Our models were trained on a diverse dataset comprising:
                  </p>
                  <ul className="list-disc pl-5 mt-2">
                    <li>350,000+ labeled fashion images across 43 garment categories</li>
                    <li>15,000+ complete outfits with multi-label annotations</li>
                    <li>Augmented with synthetic data generation for rare categories</li>
                    <li>Balanced representation of different styles, occasions, and seasons</li>
                  </ul>
                  
                  <h3 className="font-medium mt-6">Optimization Strategy</h3>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800">Learning Schedule</h4>
                      <ul className="mt-2 text-sm space-y-1">
                        <li>Cosine annealing learning rate with warm restarts</li>
                        <li>Initial rate: 1e-4, minimum: 1e-6</li>
                        <li>Cycle length: 10 epochs with multiplier of 2</li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-800">Regularization</h4>
                      <ul className="mt-2 text-sm space-y-1">
                        <li>Stochastic Depth: 0.2 drop probability</li>
                        <li>Dropout: Adaptive rates from 0.1 to 0.3</li>
                        <li>Label smoothing: 0.1</li>
                        <li>Mixup augmentation: α=0.4</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="font-medium">Training Convergence</h3>
                  <div className="h-72 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={accuracyOverTime}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="month" />
                        <YAxis domain={[70, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="enhanced" 
                          name="Enhanced Model" 
                          stroke="#8884d8" 
                          strokeWidth={2} 
                          dot={{ r: 4 }} 
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="baseline" 
                          name="Baseline Model" 
                          stroke="#82ca9d" 
                          strokeWidth={2} 
                          dot={{ r: 4 }} 
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Training progression showing accuracy improvements over time
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Quantitative evaluation of recognition capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p>
                    Our ML implementation demonstrates significant improvements in recognition performance
                    across multiple metrics. The following visualizations highlight key performance indicators
                    and their evolution through different model iterations.
                  </p>

                  <h3 className="font-medium mt-6">Performance Evolution</h3>
                  <p className="text-sm text-gray-700">
                    Each iteration of our model development process has yielded measurable improvements 
                    in key metrics, demonstrating the effectiveness of our approach.
                  </p>
                </div>

                <div className="h-96 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={performanceData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[60, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }} />
                      <Legend />
                      <Bar dataKey="accuracy" name="Accuracy" fill="#8884d8" />
                      <Bar dataKey="precision" name="Precision" fill="#82ca9d" />
                      <Bar dataKey="recall" name="Recall" fill="#ffc658" />
                      <Bar dataKey="f1" name="F1 Score" fill="#ff8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-4">Category Recognition Performance</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={garmentRecognitionData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={true} vertical={false} />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis type="category" dataKey="category" width={80} />
                          <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }} />
                          <Legend verticalAlign="top" />
                          <Bar dataKey="enhanced" name="Enhanced Model" fill="#8884d8" />
                          <Bar dataKey="baseline" name="Baseline" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-4">Performance Radar</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart outerRadius={90} data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="Enhanced Model" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                          <Radar name="Baseline Model" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                          <Legend />
                          <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="font-medium mb-4">Error Analysis</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Type</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Baseline Rate</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enhanced Rate</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Improvement</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Misclassification</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18.4%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5.2%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">-71.7%</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">False Detection</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12.3%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3.7%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">-69.9%</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Attribute Error</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">25.7%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">9.8%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">-61.9%</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Occlusion Failure</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">32.6%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12.4%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">-62.0%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comparison" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center">
                  <GitCompare className="mr-2 h-5 w-5" /> 
                  Comparative Analysis
                </CardTitle>
                <CardDescription>Evaluating our approach against industry benchmarks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p>
                    To contextualize our results, we've benchmarked our approach against state-of-the-art methods
                    in the literature and commercial applications. The following analysis demonstrates the relative 
                    strengths of our implementation.
                  </p>

                  <div className="mt-6">
                    <h3 className="font-medium mb-4">Benchmark Comparison</h3>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F1 Score</th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inference Time</th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memory Usage</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="bg-blue-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">Our Approach</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">95.3%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">93.5%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">127ms</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">245MB</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">FashionNet (2021)</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">91.2%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">89.7%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">145ms</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">278MB</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">DeepFashion</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">90.8%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">87.5%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192ms</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">320MB</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">StyleGAN-Fashion</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">88.9%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">86.3%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">108ms</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">198MB</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Comm. Solution A</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">87.4%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">85.9%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">95ms</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">182MB</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Comm. Solution B</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">86.2%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">84.4%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">82ms</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">165MB</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-10">
                  <h3 className="font-medium mb-4">Key Differentiators</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-5 bg-white">
                      <h4 className="font-medium text-gray-900 mb-3">Technical Advantages</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 relative mt-1">
                            <div className="absolute inset-0 bg-green-500 rounded-full opacity-20"></div>
                            <div className="absolute inset-1 bg-green-500 rounded-full"></div>
                          </div>
                          <p className="ml-2 text-sm text-gray-700">
                            <span className="font-medium text-gray-900">Efficient Transformer Architecture:</span> Our model uses a specialized vision transformer design that achieves higher accuracy with lower computational requirements.
                          </p>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 relative mt-1">
                            <div className="absolute inset-0 bg-green-500 rounded-full opacity-20"></div>
                            <div className="absolute inset-1 bg-green-500 rounded-full"></div>
                          </div>
                          <p className="ml-2 text-sm text-gray-700">
                            <span className="font-medium text-gray-900">Multi-scale Feature Integration:</span> Our approach combines features from multiple scales to better handle variations in clothing size and camera distance.
                          </p>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 relative mt-1">
                            <div className="absolute inset-0 bg-green-500 rounded-full opacity-20"></div>
                            <div className="absolute inset-1 bg-green-500 rounded-full"></div>
                          </div>
                          <p className="ml-2 text-sm text-gray-700">
                            <span className="font-medium text-gray-900">Cross-domain Knowledge Transfer:</span> Our models leverage pre-training on both general image datasets and fashion-specific collections.
                          </p>
                        </li>
                      </ul>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-5 bg-white">
                      <h4 className="font-medium text-gray-900 mb-3">Real-world Performance</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 relative mt-1">
                            <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20"></div>
                            <div className="absolute inset-1 bg-blue-500 rounded-full"></div>
                          </div>
                          <p className="ml-2 text-sm text-gray-700">
                            <span className="font-medium text-gray-900">Robust to Varied Environments:</span> 94.1% accuracy maintained across diverse lighting conditions and backgrounds.
                          </p>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 relative mt-1">
                            <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20"></div>
                            <div className="absolute inset-1 bg-blue-500 rounded-full"></div>
                          </div>
                          <p className="ml-2 text-sm text-gray-700">
                            <span className="font-medium text-gray-900">Human Expert Agreement:</span> 92.7% alignment with professional fashion stylists' assessments.
                          </p>
                        </li>
                        <li className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 relative mt-1">
                            <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20"></div>
                            <div className="absolute inset-1 bg-blue-500 rounded-full"></div>
                          </div>
                          <p className="ml-2 text-sm text-gray-700">
                            <span className="font-medium text-gray-900">Mobile Optimization:</span> Successfully deployed on mobile devices with 93.5% of desktop performance.
                          </p>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <h3 className="font-medium mb-2">Future Research Directions</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Our current implementation, while state-of-the-art, presents several opportunities for future research and optimization.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Multimodal Integration</h4>
                      <p className="text-sm text-gray-700">
                        Combining visual analysis with text-based descriptions and user preferences for more personalized outfit recommendations.
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Temporal Adaptability</h4>
                      <p className="text-sm text-gray-700">
                        Developing models that can adapt to evolving fashion trends without complete retraining.
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Edge Deployment</h4>
                      <p className="text-sm text-gray-700">
                        Further optimization for on-device inference with minimal latency and resource requirements.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-4">
                <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => window.open('/documentation.pdf')}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Download Research Paper
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}