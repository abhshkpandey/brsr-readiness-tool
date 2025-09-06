"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ArrowLeft, ArrowRight, Save, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Question, FormData } from "@/lib/types"

interface AssessmentFormProps {
  sectionKey: string
  sectionTitle: string
  questions: Question[]
  formData: FormData
  onUpdateData: (data: Partial<FormData>) => void
  onNext: () => void
  onPrevious: () => void
  onSave: () => void
  isFirst: boolean
  isLast: boolean
  currentSection: number
  totalSections: number
}

export function AssessmentForm({
  sectionKey,
  sectionTitle,
  questions,
  formData,
  onUpdateData,
  onNext,
  onPrevious,
  onSave,
  isFirst,
  isLast,
  currentSection,
  totalSections,
}: AssessmentFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const handleInputChange = (questionId: string, value: string | number | boolean) => {
    onUpdateData({ [questionId]: value })
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors((prev) => ({ ...prev, [questionId]: undefined }))
    }
    // Clear submit status when user makes changes
    if (submitStatus !== "idle") {
      setSubmitStatus("idle")
    }
  }

  const validateSection = () => {
    const newErrors: Record<string, string> = {}

    questions.forEach((question) => {
      if (question.required) {
        const value = formData[question.id]
        if (value === undefined || value === "" || value === null) {
          newErrors[question.id] = "This field is required"
        } else if (question.type === "number") {
          const numValue = Number(value)
          if (isNaN(numValue)) {
            newErrors[question.id] = "Please enter a valid number"
          } else if (question.min !== undefined && numValue < question.min) {
            newErrors[question.id] = `Value must be at least ${question.min}`
          } else if (question.max !== undefined && numValue > question.max) {
            newErrors[question.id] = `Value must be at most ${question.max}`
          }
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submitToAPI = async (isComplete = false) => {
    try {
      const response = await fetch("/api/assess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData,
          sectionKey,
          isComplete,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Submission failed")
      }

      console.log("[v0] Assessment submitted successfully:", result)
      return result
    } catch (error) {
      console.error("[v0] Assessment submission error:", error)
      throw error
    }
  }

  const handleNext = async () => {
    if (!validateSection()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      await submitToAPI(isLast)
      setSubmitStatus("success")

      // Small delay to show success state
      setTimeout(() => {
        onNext()
      }, 500)
    } catch (error) {
      setSubmitStatus("error")
      setErrors({ general: error instanceof Error ? error.message : "Submission failed" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      await submitToAPI(false)
      onSave()
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : "Save failed" })
    } finally {
      setIsSaving(false)
    }
  }

  const completedQuestions = questions.filter((q) => {
    const value = formData[q.id]
    return value !== undefined && value !== "" && value !== null
  }).length

  const completionPercentage = (completedQuestions / questions.length) * 100

  const renderInput = (question: Question) => {
    const value = formData[question.id]
    const hasError = !!errors[question.id]

    switch (question.type) {
      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={question.id} className="text-sm font-medium">
              {question.question}
              {question.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input
                id={question.id}
                type="number"
                value={value || ""}
                onChange={(e) => handleInputChange(question.id, e.target.value ? Number(e.target.value) : "")}
                placeholder={`Enter ${question.unit}`}
                min={question.min}
                max={question.max}
                className={cn(hasError && "border-destructive")}
              />
              {question.unit && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {question.unit}
                </div>
              )}
            </div>
            {hasError && <p className="text-sm text-destructive">{errors[question.id]}</p>}
          </div>
        )

      case "text":
        return (
          <div className="space-y-2">
            <Label htmlFor={question.id} className="text-sm font-medium">
              {question.question}
              {question.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={question.id}
              value={value || ""}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              placeholder="Enter details..."
              className={cn(hasError && "border-destructive")}
              rows={3}
            />
            {hasError && <p className="text-sm text-destructive">{errors[question.id]}</p>}
          </div>
        )

      case "boolean":
        return (
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor={question.id} className="text-sm font-medium flex-1">
              {question.question}
              {question.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">No</span>
              <Switch
                id={question.id}
                checked={!!value}
                onCheckedChange={(checked) => handleInputChange(question.id, checked)}
              />
              <span className="text-sm text-muted-foreground">Yes</span>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-balance bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {sectionTitle}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Section {currentSection} of {totalSections} • {questions.length} questions
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 px-3 py-2 w-fit">
          <CheckCircle className="h-4 w-4" />
          <span className="font-semibold">
            {completedQuestions}/{questions.length} completed
          </span>
        </Badge>
      </div>

      {/* Progress */}
      <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card to-card/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Section Progress</span>
            <Badge variant="secondary" className="font-bold">
              {Math.round(completionPercentage)}%
            </Badge>
          </div>
          <Progress value={completionPercentage} className="h-3 shadow-inner" />
        </CardContent>
      </Card>

      {/* Status Messages */}
      {errors.general && (
        <Card className="border-destructive bg-destructive/5 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-semibold">{errors.general}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {submitStatus === "success" && (
        <Card className="border-primary bg-primary/5 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-semibold">
                {isLast ? "Assessment completed successfully!" : "Section saved successfully!"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card to-card/30">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Assessment Questions</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Please provide accurate information for all required fields to ensure comprehensive reporting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="p-4 md:p-6 border border-border rounded-xl bg-background/50 hover:bg-background/70 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">{renderInput(question)}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirst || isSubmitting}
          className="flex items-center gap-2 bg-transparent hover:bg-muted/50 h-12 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous Section
        </Button>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || isSubmitting}
            className="flex items-center gap-2 bg-transparent hover:bg-muted/50 h-12 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
          >
            {isSaving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving Progress..." : "Save Progress"}
          </Button>

          <Button
            onClick={handleNext}
            disabled={isSubmitting || isSaving}
            className="flex items-center gap-2 h-12 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-semibold px-6"
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : null}
            {isSubmitting
              ? isLast
                ? "Completing Assessment..."
                : "Submitting Section..."
              : isLast
                ? "Complete Assessment"
                : "Next Section"}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
