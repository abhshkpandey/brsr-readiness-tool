export interface Question {
  id: string
  question: string
  type: "number" | "text" | "boolean"
  required: boolean
  unit: string
  min?: number
  max?: number
}

export interface Section {
  title: string
  questions: Question[]
}

export interface ESGFramework {
  sections: Record<string, Section>
  metadata: {
    version: string
    created_date: string
    description: string
    compliance_frameworks: string[]
    total_questions: number
    sections_count: number
  }
}

export interface FormData {
  [questionId: string]: string | number | boolean
}
