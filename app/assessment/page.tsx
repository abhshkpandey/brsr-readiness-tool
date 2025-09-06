"use client"

import { useState, useEffect } from "react"
import { AssessmentForm } from "@/components/assessment-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, CheckCircle, Clock, FileText } from "lucide-react"
import type { ESGFramework, FormData } from "@/lib/types"
import esgFramework from "@/lib/esg-framework.json"

const framework = esgFramework as ESGFramework
const sectionKeys = Object.keys(framework.sections)

export default function AssessmentPage() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [showOverview, setShowOverview] = useState(true)

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("brsr-assessment-data")
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData))
      } catch (error) {
        console.error("Failed to load saved data:", error)
      }
    }
  }, [])

  // Save data to localStorage whenever formData changes
  useEffect(() => {
    localStorage.setItem("brsr-assessment-data", JSON.stringify(formData))
  }, [formData])

  const handleUpdateData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    if (currentSectionIndex < sectionKeys.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1)
    } else {
      // Assessment complete - redirect to results
      window.location.href = "/results"
    }
  }

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1)
    }
  }

  const handleSave = () => {
    // Data is automatically saved to localStorage
    alert("Progress saved successfully!")
  }

  const handleStartAssessment = () => {
    setShowOverview(false)
  }

  const handleJumpToSection = (index: number) => {
    setCurrentSectionIndex(index)
    setShowOverview(false)
  }

  // Calculate overall progress
  const totalQuestions = framework.metadata.total_questions
  const completedQuestions = Object.keys(formData).filter((key) => {
    const value = formData[key]
    return value !== undefined && value !== "" && value !== null
  }).length
  const overallProgress = (completedQuestions / totalQuestions) * 100

  // Calculate section completion
  const sectionCompletion = sectionKeys.map((sectionKey) => {
    const section = framework.sections[sectionKey]
    const sectionQuestions = section.questions.length
    const completedInSection = section.questions.filter((q) => {
      const value = formData[q.id]
      return value !== undefined && value !== "" && value !== null
    }).length
    return {
      key: sectionKey,
      title: section.title,
      completed: completedInSection,
      total: sectionQuestions,
      percentage: (completedInSection / sectionQuestions) * 100,
    }
  })

  if (showOverview) {
    return (
      <div className="p-4 md:p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-balance bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            BRSR Assessment
          </h1>
          <p className="text-muted-foreground text-pretty text-sm md:text-base max-w-3xl leading-relaxed">
            Complete your Business Responsibility and Sustainability Reporting assessment with our comprehensive
            framework
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card to-card/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <FileText className="h-6 w-6 text-primary" />
              Assessment Overview
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              {completedQuestions} of {totalQuestions} questions completed across {framework.metadata.sections_count}{" "}
              sections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Overall Progress</span>
              <Badge variant="outline" className="font-bold text-lg px-3 py-1">
                {Math.round(overallProgress)}%
              </Badge>
            </div>
            <Progress value={overallProgress} className="h-4 shadow-inner" />

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleStartAssessment}
                className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 h-12"
              >
                {completedQuestions > 0 ? "Continue Assessment" : "Start Assessment"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              {completedQuestions > 0 && (
                <Badge variant="outline" className="flex items-center gap-2 px-4 py-2 h-12 w-fit">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">In Progress</span>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sectionCompletion.map((section, index) => (
            <Card
              key={section.key}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-border/50 bg-gradient-to-br from-card to-card/50 group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm md:text-base leading-tight group-hover:text-primary transition-colors">
                    {section.title}
                  </CardTitle>
                  {section.percentage === 100 && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />}
                </div>
                <CardDescription className="text-xs">
                  {section.total} questions • Section {index + 1}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progress</span>
                  <Badge variant="secondary" className="text-xs font-bold">
                    {section.completed}/{section.total}
                  </Badge>
                </div>
                <Progress value={section.percentage} className="h-2" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleJumpToSection(index)}
                  className="w-full bg-transparent hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-medium"
                >
                  {section.percentage > 0 ? "Continue" : "Start"} Section
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const currentSectionKey = sectionKeys[currentSectionIndex]
  const currentSection = framework.sections[currentSectionKey]

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gradient-to-br from-background to-muted/20">
      <AssessmentForm
        sectionKey={currentSectionKey}
        sectionTitle={currentSection.title}
        questions={currentSection.questions}
        formData={formData}
        onUpdateData={handleUpdateData}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSave={handleSave}
        isFirst={currentSectionIndex === 0}
        isLast={currentSectionIndex === sectionKeys.length - 1}
        currentSection={currentSectionIndex + 1}
        totalSections={sectionKeys.length}
      />
    </div>
  )
}
