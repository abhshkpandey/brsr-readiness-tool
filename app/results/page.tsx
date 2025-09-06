"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Download, TrendingUp, Leaf, ArrowLeft, CheckCircle, AlertTriangle, BarChart3 } from "lucide-react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts"
import type { ESGFramework, FormData } from "@/lib/types"
import esgFramework from "@/lib/esg-framework.json"

const framework = esgFramework as ESGFramework

// Chart colors using our design tokens
const COLORS = {
  primary: "#15803d",
  accent: "#84cc16",
  muted: "#374151",
  card: "#f0fdf4",
  border: "#e5e7eb",
}

export default function ResultsPage() {
  const [formData, setFormData] = useState<FormData>({})
  const [isDownloading, setIsDownloading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 800))
      const savedData = localStorage.getItem("brsr-assessment-data")
      if (savedData) {
        try {
          setFormData(JSON.parse(savedData))
        } catch (error) {
          console.error("Failed to load saved data:", error)
        }
      }
      setIsLoading(false)
    }
    loadData()
  }, [])

  const calculateSectionScores = () => {
    const sectionKeys = Object.keys(framework.sections)
    return sectionKeys.map((sectionKey) => {
      const section = framework.sections[sectionKey]
      const totalQuestions = section.questions.length
      const completedQuestions = section.questions.filter((q) => {
        const value = formData[q.id]
        return value !== undefined && value !== "" && value !== null
      }).length

      const completionRate = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0

      return {
        name: section.title.replace(/&/g, "&"),
        score: Math.round(completionRate),
        completed: completedQuestions,
        total: totalQuestions,
        key: sectionKey,
      }
    })
  }

  const sectionScores = calculateSectionScores()
  const overallScore = Math.round(sectionScores.reduce((acc, section) => acc + section.score, 0) / sectionScores.length)

  const getComplianceLevel = (score: number) => {
    if (score >= 90) return { level: "Excellent", color: "text-primary", bgColor: "bg-primary/10" }
    if (score >= 75) return { level: "Good", color: "text-accent", bgColor: "bg-accent/10" }
    if (score >= 60) return { level: "Fair", color: "text-yellow-600", bgColor: "bg-yellow-100" }
    return { level: "Needs Improvement", color: "text-destructive", bgColor: "bg-destructive/10" }
  }

  const compliance = getComplianceLevel(overallScore)

  const environmentalData = [
    { name: "Energy (GJ)", current: 1250, target: 1000, improvement: -20 },
    { name: "Water (KL)", current: 850, target: 700, improvement: -18 },
    { name: "Waste (MT)", current: 45, target: 35, improvement: -22 },
    { name: "Emissions (tCO2e)", current: 320, target: 250, improvement: -22 },
  ]

  const completionData = [
    { name: "Completed", value: overallScore, fill: COLORS.primary },
    { name: "Remaining", value: 100 - overallScore, fill: COLORS.border },
  ]

  const keyMetricsData = [
    { name: "Workforce", score: sectionScores[0]?.score || 0, fill: COLORS.primary },
    { name: "Safety", score: sectionScores[1]?.score || 0, fill: COLORS.accent },
    { name: "Environment", score: sectionScores[3]?.score || 0, fill: COLORS.muted },
  ]

  const handleDownloadReport = async () => {
    setIsDownloading(true)
    try {
      console.log("[v0] Starting report download...")
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, scores: sectionScores }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Download failed")
      }

      console.log("[v0] Report generated successfully:", result)

      const blob = new Blob([`BRSR Assessment Report - Generated at ${new Date().toISOString()}`], {
        type: "application/pdf",
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `brsr-assessment-report-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] Download failed:", error)
      alert(`Download failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div>
            <h2 className="text-lg font-semibold">Loading Assessment Results</h2>
            <p className="text-muted-foreground">Please wait while we process your data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Assessment Results</h1>
          <p className="text-muted-foreground text-pretty">Your BRSR readiness assessment has been completed</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="bg-transparent">
            <Link href="/assessment">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assessment
            </Link>
          </Button>
          <Button onClick={handleDownloadReport} disabled={isDownloading} className="flex items-center gap-2">
            {isDownloading ? <LoadingSpinner size="sm" /> : <Download className="h-4 w-4" />}
            {isDownloading ? "Generating Report..." : "Download Report"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Overall BRSR Score</CardTitle>
            <CardDescription>Based on assessment completion</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary">{overallScore}</div>
            <div className="text-sm text-muted-foreground">out of 100</div>
            <Badge className={`${compliance.bgColor} ${compliance.color} border-0`}>{compliance.level}</Badge>
            <div className="pt-4">
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={completionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    {completionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Key Performance Areas
            </CardTitle>
            <CardDescription>Completion status across major ESG categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={keyMetricsData}>
                <RadialBar dataKey="score" cornerRadius={10} fill={COLORS.primary} />
                <Legend />
                <Tooltip formatter={(value) => [`${value}%`, "Completion"]} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Section-wise Performance
          </CardTitle>
          <CardDescription>Detailed breakdown of assessment completion by section</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectionScores} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value) => [`${value}%`, "Completion"]}
                labelFormatter={(label) => `Section: ${label}`}
              />
              <Bar dataKey="score" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            Environmental Impact Overview
          </CardTitle>
          <CardDescription>Simulated environmental metrics based on industry benchmarks</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={environmentalData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="current" fill={COLORS.muted} name="Current" />
              <Bar dataKey="target" fill={COLORS.accent} name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Section Analysis</CardTitle>
          <CardDescription>Complete breakdown of your assessment performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sectionScores.map((section, index) => (
            <div key={section.key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{section.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {section.completed} of {section.total} questions completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={section.score === 100 ? "default" : "secondary"}>{section.score}%</Badge>
                  {section.score === 100 ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
              <Progress value={section.score} className="h-2" />
              {index < sectionScores.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sectionScores
            .filter((section) => section.score < 100)
            .slice(0, 3)
            .map((section) => (
              <div key={section.key} className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm">{section.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete the remaining {section.total - section.completed} questions to improve your BRSR readiness
                  score.
                </p>
              </div>
            ))}
          {sectionScores.every((section) => section.score === 100) && (
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium text-primary">Excellent Work!</h4>
              <p className="text-sm text-muted-foreground mt-1">
                You have completed all sections of the BRSR assessment. Your organization is well-prepared for
                sustainability reporting.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
