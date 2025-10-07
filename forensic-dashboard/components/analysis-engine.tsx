"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  FolderOpen,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Markdown } from "@/components/ui/markdown"

interface AnalysisResult {
  id: string
  query: string
  timestamp: string
  caseId: string
  caseName?: string
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

interface Case {
  id: string
  caseNumber: string
  caseName: string
  description?: string
  _count?: {
    devices: number
    queries: number
  }
}

export function AnalysisEngine() {
  const [query, setQuery] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState<string>("")
  const [cases, setCases] = useState<Case[]>([])
  const [isLoadingCases, setIsLoadingCases] = useState(true)
  const [isLoadingQueries, setIsLoadingQueries] = useState(false)
  const { toast } = useToast()

  // Load cases on component mount
  useEffect(() => {
    loadCases()
  }, [])

  // Load queries when a case is selected
  useEffect(() => {
    if (selectedCaseId) {
      loadQueriesForCase(selectedCaseId)
    } else {
      setResults([])
      setSelectedResult(null)
    }
  }, [selectedCaseId])

  const loadCases = async () => {
    try {
      setIsLoadingCases(true)
      const response = await apiClient.getCases()
      console.log('Cases API response:', response) // Debug log
      
      if (response.success && response.data) {
        // Handle the correct API response structure
        const casesArray = response.data.cases
        
        if (Array.isArray(casesArray)) {
          setCases(casesArray)
          // Auto-select the first case if available
          if (casesArray.length > 0 && !selectedCaseId) {
            setSelectedCaseId(casesArray[0].id)
          }
        } else {
          console.warn('Cases data is not an array:', casesArray)
          setCases([])
        }
      } else {
        console.warn('Invalid response from getCases:', response)
        setCases([])
      }
    } catch (error) {
      console.error('Error loading cases:', error)
      setCases([])
      toast({
        title: "Error",
        description: "Failed to load cases. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCases(false)
    }
  }

  const loadQueriesForCase = async (caseId: string) => {
    try {
      setIsLoadingQueries(true)
      const response = await fetch(`/api/cases/${caseId}/queries`)
      if (response.ok) {
        const queryData = await response.json()
        if (queryData.success) {
          const formattedResults: AnalysisResult[] = queryData.data.map((q: any) => ({
            id: q.id,
            query: q.queryText,
            timestamp: new Date(q.createdAt).toLocaleString(),
            caseId: q.caseId,
            caseName: cases.find(c => c.id === q.caseId)?.caseName,
            results: {
              summary: q.results?.summary || 'Analysis completed',
              findings: q.results?.findings || [],
              insights: q.results?.insights || [`Found ${q.resultCount} items`],
              connections: q.results?.connections || []
            }
          }))
          setResults(formattedResults)
        }
      }
    } catch (error) {
      console.warn("Could not load query history:", error)
      // Don't show error toast as this is not critical
    } finally {
      setIsLoadingQueries(false)
    }
  }

  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    if (!selectedCaseId) {
      toast({
        title: "No Case Selected",
        description: "Please select a case before running analysis.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)

    try {
      const response = await apiClient.executeQuery(
        query,
        selectedCaseId
      );

      if (response.success && response.data) {
        // Transform the API response to match our interface
        const flatResults = [];
        
        // Add chats
        if (response.data.results?.chats) {
          flatResults.push(...response.data.results.chats.map((chat: any) => ({
            type: "message",
            source: `${chat.platform} - ${chat.device?.deviceName || 'Device'}`,
            content: chat.message,
            timestamp: chat.timestamp,
            metadata: {
              platform: chat.platform,
              participant: chat.participantName || chat.participantNumber,
              direction: chat.direction,
              device: chat.device?.deviceName
            },
            relevance: (chat.similarityScore || 0.5) * 100
          })));
        }
        
        // Add calls
        if (response.data.results?.calls) {
          flatResults.push(...response.data.results.calls.map((call: any) => ({
            type: "call",
            source: `Call - ${call.device?.deviceName || 'Device'}`,
            content: `${call.callType} call ${call.contactName ? `with ${call.contactName}` : `to ${call.phoneNumber}`} for ${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}`,
            timestamp: call.timestamp,
            metadata: {
              callType: call.callType,
              phoneNumber: call.phoneNumber,
              contactName: call.contactName,
              duration: call.duration,
              device: call.device?.deviceName
            },
            relevance: 70
          })));
        }
        
        // Add contacts
        if (response.data.results?.contacts) {
          flatResults.push(...response.data.results.contacts.map((contact: any) => ({
            type: "contact",
            source: `Contact - ${contact.device?.deviceName || 'Device'}`,
            content: `${contact.name} - ${contact.phoneNumbers?.join(', ') || 'No phone'} ${contact.emails?.length ? `(${contact.emails.join(', ')})` : ''}`,
            timestamp: new Date().toISOString(),
            metadata: {
              name: contact.name,
              phoneNumbers: contact.phoneNumbers,
              emails: contact.emails,
              organization: contact.organization,
              device: contact.device?.deviceName
            },
            relevance: 60
          })));
        }
        
        // Add media
        if (response.data.results?.media) {
          flatResults.push(...response.data.results.media.map((media: any) => ({
            type: "media",
            source: `${media.mediaType} - ${media.device?.deviceName || 'Device'}`,
            content: `${media.fileName} (${(media.fileSize / 1024 / 1024).toFixed(2)} MB)`,
            timestamp: media.createdDate,
            metadata: {
              fileName: media.fileName,
              mediaType: media.mediaType,
              fileSize: media.fileSize,
              mimeType: media.mimeType,
              location: media.latitude && media.longitude ? `${media.latitude}, ${media.longitude}` : null,
              device: media.device?.deviceName
            },
            relevance: 50
          })));
        }

        const newResult: AnalysisResult = {
          id: response.data.queryId || Date.now().toString(),
          query,
          timestamp: new Date().toLocaleString(),
          caseId: selectedCaseId,
          caseName: cases.find(c => c.id === selectedCaseId)?.caseName,
          results: {
            summary: response.data.summary || `Analysis completed for: "${query}". Found ${flatResults.length} relevant items.`,
            findings: flatResults.map((result: any) => ({
              type: result.type || "message",
              title: result.source || "Forensic Data",
              content: result.content,
              metadata: result.metadata || { source: result.source, timestamp: result.timestamp },
              relevanceScore: result.relevance || 50,
              riskLevel: result.relevance > 80 ? "high" : result.relevance > 60 ? "medium" : "low" as "low" | "medium" | "high",
            })),
            insights: [
              `Found ${flatResults.length} relevant items`,
              `Query processed using AI analysis`,
              ...(response.data.results?.entities ? Object.entries(response.data.results.entities).map(([type, items]: [string, any]) => 
                `Detected ${Array.isArray(items) ? items.length : 'multiple'} ${type} entities`
              ) : [])
            ],
            connections: response.data.results?.connections || [],
          },
        };

        setResults(prev => [newResult, ...prev]);
        setSelectedResult(newResult);

        toast({
          title: "Analysis Complete",
          description: `Found ${flatResults.length} relevant items for your query.`,
        });

        // Reload queries to get the updated list from database
        await loadQueriesForCase(selectedCaseId);
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to execute query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setQuery("");
    }
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
      {/* Case Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Case Selection
          </CardTitle>
          <CardDescription>Choose a case to analyze its forensic data</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCaseId} onValueChange={setSelectedCaseId} disabled={isLoadingCases}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isLoadingCases ? "Loading cases..." : "Select a case"} />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(cases) && cases.length > 0 ? (
                cases.map((case_) => (
                  <SelectItem key={case_.id} value={case_.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{case_.caseName}</span>
                      <span className="text-sm text-muted-foreground">
                        {case_.caseNumber}
                        {case_._count && ` • ${case_._count.devices} devices • ${case_._count.queries} queries`}
                      </span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-cases" disabled>
                  {isLoadingCases ? "Loading cases..." : "No cases available"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* AI Query Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Analysis Engine
          </CardTitle>
          <CardDescription>
            Ask complex questions about your forensic data using natural language
            {selectedCaseId && (
              <span className="block mt-1 text-primary">
                Analyzing: {cases.find(c => c.id === selectedCaseId)?.caseName}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalysis} className="flex gap-2">
            <Input
              placeholder={
                selectedCaseId 
                  ? "e.g., Find all communications between suspects during night hours..."
                  : "Please select a case first..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
              disabled={!selectedCaseId}
            />
            <Button type="submit" disabled={isAnalyzing || !selectedCaseId}>
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
            <CardDescription>
              {selectedCaseId ? (
                isLoadingQueries ? "Loading query history..." : `${results.length} queries for this case`
              ) : "Select a case to view query history"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {!selectedCaseId ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a case to view analysis history</p>
                  </div>
                ) : isLoadingQueries ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                    <p>Loading query history...</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No queries yet</p>
                    <p className="text-sm">Run your first analysis above</p>
                  </div>
                ) : (
                  results.map((result) => (
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
                          {result.results?.findings?.length || 0} findings
                        </Badge>
                        {result.caseName && (
                          <Badge variant="outline" className="text-xs">
                            {result.caseName}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
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
                    <h4 className="font-medium mb-3">AI Analysis Summary</h4>
                    <Markdown className="text-sm">
                      {selectedResult.results?.summary || 'No summary available'}
                    </Markdown>
                  </div>

                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {selectedResult.results?.findings && selectedResult.results.findings.length > 0 ? (
                        selectedResult.results.findings.map((finding, index) => {
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
                                {finding.metadata && Object.entries(finding.metadata).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {String(value)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No findings available</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                  <div className="space-y-3">
                    {selectedResult.results?.insights && selectedResult.results.insights.length > 0 ? (
                      selectedResult.results.insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
                          <span className="text-sm">{insight}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No insights available</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="connections" className="space-y-4">
                  {selectedResult.results?.connections && selectedResult.results.connections.length > 0 ? (
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
