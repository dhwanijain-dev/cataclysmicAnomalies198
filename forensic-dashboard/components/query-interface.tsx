"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Sparkles, Clock, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

const suggestedQueries = [
  "Show me chat records containing crypto addresses",
  "List all communications with foreign numbers",
  "Find images taken at specific locations",
  "Show call logs from the last 30 days",
  "Find deleted messages mentioning drugs",
  "Show contacts with suspicious patterns",
]

const recentQueries = [
  { query: "Find all WhatsApp messages with John Doe", timestamp: "2 minutes ago" },
  { query: "Show call records between 9 PM and 6 AM", timestamp: "15 minutes ago" },
  { query: "List contacts with multiple phone numbers", timestamp: "1 hour ago" },
]

export function QueryInterface() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    // Simulate processing and redirect to analysis page
    setTimeout(() => {
      setIsLoading(false)
      router.push("/analysis")
    }, 1500)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    // Auto-redirect to analysis page with the suggestion
    router.push("/analysis")
  }

  return (
    <div className="space-y-6">
      <Card className="border-1 border-black">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Query Interface
          </CardTitle>
          <CardDescription>Ask questions about your forensic data in natural language</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="e.g., Show me all messages containing suspicious keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isLoading ? "Analyzing..." : "Search"}
            </Button>
          </form>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Or try advanced analysis</span>
            <Button variant="outline" size="sm" onClick={() => router.push("/analysis")}>
              Open AI Analysis <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Suggested Queries</h4>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Queries
              </h4>
              <div className="space-y-2">
                {recentQueries.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => handleSuggestionClick(item.query)}
                  >
                    <span className="text-sm">{item.query}</span>
                    <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
