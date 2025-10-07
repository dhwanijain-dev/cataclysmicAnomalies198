"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, CheckCircle, AlertCircle, X, Smartphone, HardDrive } from "lucide-react"
import { apiClient, UploadResponse } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
  error?: string
  deviceInfo?: {
    model: string
    os: string
    imei?: string
  }
  processingResults?: {
    totalChats: number
    totalCalls: number
    totalContacts: number
    totalMedia: number
  }
}

export function UploadSystem() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [caseNumber, setCaseNumber] = useState("")
  const [investigatingOfficer, setInvestigatingOfficer] = useState("")
  const [caseDescription, setCaseDescription] = useState("")
  const [priority, setPriority] = useState("")
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null)
  const [isCreatingCase, setIsCreatingCase] = useState(false)
  const { toast } = useToast()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleFiles = async (fileList: FileList) => {
    // Create case first if not exists
    let caseId = currentCaseId;
    if (!caseId && caseNumber && !isCreatingCase) {
      setIsCreatingCase(true);
      try {
        const caseResponse = await apiClient.createCase({
          caseNumber,
          caseName: `Case ${caseNumber}`,
          description: caseDescription,
        });
        
        if (caseResponse.success) {
          caseId = caseResponse.data.id;
          setCurrentCaseId(caseId);
          toast({
            title: "Case Created",
            description: `Case ${caseNumber} has been created successfully.`,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create case. Please try again.",
          variant: "destructive",
        });
        setIsCreatingCase(false);
        return;
      }
      setIsCreatingCase(false);
    }

    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading",
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...newFiles])

    // Upload files to backend
    newFiles.forEach((fileInfo) => {
      uploadFileToBackend(fileInfo, fileList[newFiles.indexOf(fileInfo)], caseId)
    })
  }

  const uploadFileToBackend = async (fileInfo: UploadedFile, file: File, caseId?: string | null) => {
    try {
      // Start upload
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id 
          ? { ...f, status: "uploading", progress: 25 }
          : f
      ));

      const response = await apiClient.uploadFile(file, caseId || undefined);

      if (response.success && response.data) {
        // Upload completed, start processing
        setFiles(prev => prev.map(f => 
          f.id === fileInfo.id 
            ? { 
                ...f, 
                status: "processing", 
                progress: 75,
                processingResults: response.data?.stats ? {
                  totalChats: response.data.stats.chats,
                  totalCalls: response.data.stats.calls,
                  totalContacts: response.data.stats.contacts,
                  totalMedia: response.data.stats.media,
                } : undefined
              }
            : f
        ));

        // Simulate processing time then complete
        setTimeout(() => {
          setFiles(prev => prev.map(f => 
            f.id === fileInfo.id 
              ? { 
                  ...f, 
                  status: "completed", 
                  progress: 100,
                  deviceInfo: {
                    model: "Device Model", // This would come from UFDR parsing
                    os: "OS Version",
                    imei: "IMEI Number",
                  }
                }
              : f
          ));

          toast({
            title: "Upload Successful",
            description: `${file.name} has been processed successfully.`,
          });
        }, 2000);
      } else {
        throw new Error(response.message || "Upload failed");
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id 
          ? { 
              ...f, 
              status: "error", 
              progress: 0,
              error: error instanceof Error ? error.message : "Unknown error"
            }
          : f
      ));

      toast({
        title: "Upload Failed",
        description: `Failed to upload ${file.name}. ${error instanceof Error ? error.message : "Please try again."}`,
        variant: "destructive",
      });
    }
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Case Information */}
      <Card className="border-1 border-black">
        <CardHeader>
          <CardTitle>Case Information</CardTitle>
          <CardDescription>Enter case details before uploading UFDR files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="case-number">Case Number</Label>
              <Input
                id="case-number"
                placeholder="e.g., CASE-2024-001"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="officer">Investigating Officer</Label>
              <Input
                id="officer"
                placeholder="e.g., Det. Johnson"
                value={investigatingOfficer}
                onChange={(e) => setInvestigatingOfficer(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Case Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Case Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the investigation..."
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="border-1 border-black">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            UFDR File Upload
          </CardTitle>
          <CardDescription>Upload Universal Forensic Data Report files for analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Drop UFDR files here</h3>
                <p className="text-sm text-muted-foreground">Supports .ufdr, .xml, .zip files up to 2GB each</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => document.getElementById("file-upload")?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose Files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".ufdr,.xml,.zip"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>Processing status of uploaded UFDR files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    {file.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : file.status === "error" ? (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">{file.name}</h4>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            file.status === "completed"
                              ? "secondary"
                              : file.status === "error"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {file.status}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {file.status !== "completed" && file.status !== "error" && (
                      <Progress value={file.progress} className="h-2" />
                    )}
                    {file.deviceInfo && file.status === "completed" && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          {file.deviceInfo.model}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {file.deviceInfo.os}
                        </span>
                        {file.deviceInfo.imei && <span>IMEI: {file.deviceInfo.imei}</span>}
                      </div>
                    )}
                    {file.processingResults && file.status === "completed" && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Chats: {file.processingResults.totalChats}</span>
                        <span>Calls: {file.processingResults.totalCalls}</span>
                        <span>Contacts: {file.processingResults.totalContacts}</span>
                        <span>Media: {file.processingResults.totalMedia}</span>
                      </div>
                    )}
                    {file.status === "error" && file.error && (
                      <div className="text-xs text-destructive">
                        Error: {file.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
