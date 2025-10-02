"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Brain,
  Search,
  MessageSquare,
  Phone,
  MapPin,
  Users,
  TrendingUp,
  FileText,
  ImageIcon,
  Clock,
  Smartphone,
} from "lucide-react"

interface AnalysisResult {
  id: string
  query: string
  timestamp: string
  results: {
    summary: string
    findings: Array<{
      type: "message" | "call" | "contact" | "location" | "media" | "app_data"
      title: string
      content: string
      metadata: Record<string, any>
      relevanceScore: number
      riskLevel: "low" | "medium" | "high"
    }>
    insights: string[]
    connections: Array<{
      from: string
      to: string
      relationship: string
      strength: number
    }>
  }
}

const mockAnalysisResults: AnalysisResult[] = [
  {
    id: "1",
    query: "Show me chat records containing crypto addresses",
    timestamp: "2024-01-15 14:30:22",
    results: {
      summary:
        "Found 23 messages containing cryptocurrency wallet addresses across WhatsApp and Telegram. High-risk patterns detected in conversations with 3 unknown contacts.",
      findings: [
        {
          type: "message",
          title: "WhatsApp - Suspicious Crypto Transaction",
          content:
            "Hey, send the payment to this wallet: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa. Make sure it's untraceable.",
          metadata: { contact: "Unknown (+1-555-0123)", timestamp: "2024-01-14 23:45:12", app: "WhatsApp" },
          relevanceScore: 95,
          riskLevel: "high",
        },
        {
          type: "message",
          title: "Telegram - Crypto Address Exchange",
          content: "New wallet address: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh. Delete this message after copying.",
          metadata: { contact: "CryptoDealer", timestamp: "2024-01-13 18:22:33", app: "Telegram" },
          relevanceScore: 88,
          riskLevel: "high",
        },
        {
          type: "message",
          title: "SMS - Bitcoin Reference",
          content: "Bitcoin transfer completed. Check your wallet balance.",
          metadata: { contact: "John Smith", timestamp: "2024-01-12 16:15:44", app: "SMS" },
          relevanceScore: 72,
          riskLevel: "medium",
        },
      ],
      insights: [
        "Multiple cryptocurrency wallet addresses detected in conversations",
        "Pattern suggests organized cryptocurrency transactions",
        "High frequency of crypto-related communications in evening hours",
        "Suspicious instruction to delete messages indicates awareness of surveillance",
      ],
      connections: [
        { from: "Unknown (+1-555-0123)", to: "CryptoDealer", relationship: "Frequent Communication", strength: 85 },
        { from: "John Smith", to: "Unknown (+1-555-0123)", relationship: "Recent Contact", strength: 60 },
      ],
    },
  },
]

export function AnalysisEngine() {
  const [query, setQuery] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<AnalysisResult[]>(mockAnalysisResults)
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(results[0])

  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsAnalyzing(true)

    // Simulate AI analysis
    setTimeout(() => {
      const newResult: AnalysisResult = {
        id: Date.now().toString(),
        query,
        timestamp: new Date().toLocaleString(),
        results: {
          summary: `AI analysis completed for: "${query}". Found relevant data across multiple sources.`,
          findings: [
            {
              type: "message",
              title: "Analysis Result",
              content: `Based on your query "${query}", the AI has identified relevant patterns in the forensic data.`,
              metadata: { source: "AI Analysis", confidence: 0.85 },
              relevanceScore: 85,
              riskLevel: "medium",
            },
          ],
          insights: [
            "AI-powered pattern recognition completed",
            "Cross-referenced data from multiple sources",
            "Temporal analysis shows activity patterns",
          ],
          connections: [],
        },
      }

      setResults((prev) => [newResult, ...prev])
      setSelectedResult(newResult)
      setIsAnalyzing(false)
      setQuery("")
    }, 3000)
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-destructive"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-green-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "message":
        return MessageSquare
      case "call":
        return Phone
      case "contact":
        return Users
      case "location":
        return MapPin
      case "media":
        return ImageIcon
      case "app_data":
        return Smartphone
      default:
        return FileText
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Query Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Analysis Engine
          </CardTitle>
          <CardDescription>Ask complex questions about your forensic data using natural language</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalysis} className="flex gap-2">
            <Input
              placeholder="e.g., Find all communications between suspects during night hours..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isAnalyzing}>
              {isAnalyzing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analysis History */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Analysis History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedResult?.id === result.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="text-sm font-medium line-clamp-2">{result.query}</div>
                    <div className="text-xs text-muted-foreground mt-1">{result.timestamp}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {result.results.findings.length} findings
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            {selectedResult && <CardDescription>Query: {selectedResult.query}</CardDescription>}
          </CardHeader>
          <CardContent>
            {selectedResult ? (
              <Tabs defaultValue="findings" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="findings">Findings</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                  <TabsTrigger value="connections">Connections</TabsTrigger>
                </TabsList>

                <TabsContent value="findings" className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-sm text-muted-foreground">{selectedResult.results.summary}</p>
                  </div>

                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {selectedResult.results.findings.map((finding, index) => {
                        const IconComponent = getTypeIcon(finding.type)
                        return (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4 text-primary" />
                                <h5 className="font-medium">{finding.title}</h5>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={getRiskColor(finding.riskLevel)}>
                                  {finding.riskLevel} risk
                                </Badge>
                                <Badge variant="secondary">{finding.relevanceScore}% match</Badge>
                              </div>
                            </div>
                            <p className="text-sm mb-3">{finding.content}</p>
                            <div className="text-xs text-muted-foreground space-y-1">
                              {Object.entries(finding.metadata).map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">{key}:</span> {String(value)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                  <div className="space-y-3">
                    {selectedResult.results.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
                        <span className="text-sm">{insight}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="connections" className="space-y-4">
                  {selectedResult.results.connections.length > 0 ? (
                    <div className="space-y-3">
                      {selectedResult.results.connections.map((connection, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-primary" />
                            <div>
                              <div className="text-sm font-medium">
                                {connection.from} ↔ {connection.to}
                              </div>
                              <div className="text-xs text-muted-foreground">{connection.relationship}</div>
                            </div>
                          </div>
                          <Badge variant="outline">{connection.strength}% strength</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No connections found in this analysis</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select an analysis from the history to view results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
