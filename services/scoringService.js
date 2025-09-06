// Scoring and analytics engine for BRSR assessments
const esgFramework = require("../lib/esg-framework.json")
const FormulaService = require("./formulaService.js").default

class ScoringService {
  // Section weights for overall score calculation
  static sectionWeights = {
    environmental: 0.25, // 25% - Highest weight for environmental impact
    workforce: 0.2, // 20% - Workforce management
    safety: 0.15, // 15% - Safety performance
    business_conduct: 0.15, // 15% - Governance and conduct
    health: 0.1, // 10% - Employee health
    business: 0.1, // 10% - Business ethics
    business_openness: 0.03, // 3% - Business transparency
    related_party: 0.02, // 2% - Related party transactions
  }

  // Industry benchmarks for scoring (can be made dynamic later)
  static industryBenchmarks = {
    workforce: {
      genderDiversity: 0.3, // 30% female representation benchmark
      workingHours: 8, // 8 hours per shift benchmark
      workingDays: 250, // 250 working days benchmark
    },
    safety: {
      ltifr: 0.5, // LTIFR benchmark
      trir: 1.0, // TRIR benchmark
      fatalities: 0, // Zero fatalities target
      trainingHours: 40, // 40 hours safety training benchmark
    },
    health: {
      healthInsuranceCoverage: 1.0, // 100% coverage benchmark
      trainingHours: 40, // 40 hours training benchmark
      satisfactionScore: 8, // 8/10 satisfaction benchmark
    },
    environmental: {
      renewableEnergyShare: 0.25, // 25% renewable energy benchmark
      waterRecycling: 0.2, // 20% water recycling benchmark
      wasteRecycling: 0.6, // 60% waste recycling benchmark
    },
    business_conduct: {
      antiCorruptionTraining: 1.0, // 100% training coverage
      complaintResolution: 0.95, // 95% complaint resolution rate
    },
  }

  static getSectionMetadata(sectionKey) {
    const section = esgFramework.sections[sectionKey]
    if (!section) {
      throw new Error(`Section ${sectionKey} not found`)
    }

    return {
      title: section.title,
      totalQuestions: section.questions.length,
      requiredQuestions: section.questions.filter((q) => q.required).length,
    }
  }

  static getQuestionMetadata(questionId) {
    for (const [sectionKey, section] of Object.entries(esgFramework.sections)) {
      const question = section.questions.find((q) => q.id === questionId)
      if (question) {
        return {
          sectionKey,
          responseType: question.type,
          unit: question.unit,
          required: question.required,
          min: question.min,
          max: question.max,
        }
      }
    }
    throw new Error(`Question ${questionId} not found`)
  }

  static calculateSectionScore(sectionKey, responses) {
    const sectionMetadata = this.getSectionMetadata(sectionKey)
    const totalQuestions = sectionMetadata.totalQuestions
    const answeredQuestions = responses.length

    // Base completion score (40% weight)
    const completionScore = (answeredQuestions / totalQuestions) * 100

    // Quality score based on responses (60% weight)
    let qualityScore = 0

    switch (sectionKey) {
      case "workforce":
        qualityScore = this.calculateWorkforceQuality(responses)
        break
      case "safety":
        qualityScore = this.calculateSafetyQuality(responses)
        break
      case "health":
        qualityScore = this.calculateHealthQuality(responses)
        break
      case "environmental":
        qualityScore = this.calculateEnvironmentalQuality(responses)
        break
      case "business_conduct":
        qualityScore = this.calculateBusinessConductQuality(responses)
        break
      case "business":
        qualityScore = this.calculateBusinessQuality(responses)
        break
      case "business_openness":
        qualityScore = this.calculateBusinessOpennessQuality(responses)
        break
      case "related_party":
        qualityScore = this.calculateRelatedPartyQuality(responses)
        break
      default:
        qualityScore = completionScore // Fallback to completion score
    }

    // Final score: 40% completion + 60% quality
    const finalScore = completionScore * 0.4 + qualityScore * 0.6
    return Math.min(100, Math.max(0, finalScore))
  }

  static calculateWorkforceQuality(responses) {
    const responseMap = {}
    responses.forEach((r) => {
      responseMap[r.question_id] = Number.parseFloat(r.response_value) || 0
    })

    let score = 0
    let factors = 0

    try {
      // Calculate total employees using formula
      const totalEmployees = responseMap["workforce_1a"] + responseMap["workforce_1b"] + responseMap["workforce_1c"]

      if (totalEmployees > 0) {
        // Use formula service for female employee percentage
        const femalePercentageResult = FormulaService.calculateFormula("formula_9", {
          female_employees: responseMap["workforce_1b"] || 0,
          total_employees: totalEmployees,
        })

        const diversityScore = Math.min(100, (femalePercentageResult.value / 30) * 100) // 30% benchmark
        score += diversityScore
        factors++
      }

      // Calculate total hours worked using formula
      if (responseMap["workforce_3"] && responseMap["workforce_5"]) {
        const totalHoursResult = FormulaService.calculateFormula("formula_4", {
          total_employees: totalEmployees,
          total_workers: responseMap["workforce_2"] || 0,
          hours_per_shift: responseMap["workforce_3"],
          working_days_per_year: responseMap["workforce_5"],
        })

        // Store calculated hours for other calculations
        responseMap["total_hours_worked"] = totalHoursResult.value
      }

      // Working hours scoring (closer to 8 hours is better)
      const workingHours = responseMap["workforce_3"]
      if (workingHours) {
        const hoursScore = Math.max(
          0,
          100 - Math.abs(workingHours - this.industryBenchmarks.workforce.workingHours) * 5,
        )
        score += hoursScore
        factors++
      }

      // Working days scoring
      const workingDays = responseMap["workforce_5"]
      if (workingDays) {
        const daysScore = Math.min(100, (workingDays / this.industryBenchmarks.workforce.workingDays) * 100)
        score += daysScore
        factors++
      }
    } catch (error) {
      console.error("Error in workforce quality calculation:", error)
      // Fallback to original calculation
      const totalEmployees =
        (responseMap["workforce_1a"] || 0) + (responseMap["workforce_1b"] || 0) + (responseMap["workforce_1c"] || 0)
      if (totalEmployees > 0) {
        const femaleRatio = (responseMap["workforce_1b"] || 0) / totalEmployees
        const diversityScore = Math.min(100, (femaleRatio / this.industryBenchmarks.workforce.genderDiversity) * 100)
        score += diversityScore
        factors++
      }
    }

    return factors > 0 ? score / factors : 50
  }

  static calculateSafetyQuality(responses) {
    const responseMap = {}
    responses.forEach((r) => {
      responseMap[r.question_id] = Number.parseFloat(r.response_value) || 0
    })

    let score = 0
    let factors = 0

    try {
      // Calculate LTIFR using formula
      if (responseMap["safety_1a"] && responseMap["total_hours_worked"]) {
        const ltifrResult = FormulaService.calculateFormula("formula_1", {
          number_of_ltis: responseMap["safety_1a"],
          total_hours_worked: responseMap["total_hours_worked"],
        })

        const ltifrScore = Math.max(0, 100 - (ltifrResult.value / this.industryBenchmarks.safety.ltifr) * 50)
        score += ltifrScore
        factors++
      }

      // Calculate TRIR using formula
      if (responseMap["safety_1b"] && responseMap["total_hours_worked"]) {
        const trirResult = FormulaService.calculateFormula("formula_5", {
          total_recordable_incidents: responseMap["safety_1b"],
          total_hours_worked: responseMap["total_hours_worked"],
        })

        const trirScore = Math.max(0, 100 - (trirResult.value / this.industryBenchmarks.safety.trir) * 50)
        score += trirScore
        factors++
      }

      // Fatalities scoring (zero tolerance)
      const fatalities = responseMap["safety_3"]
      if (fatalities !== undefined) {
        const fatalityScore = fatalities === 0 ? 100 : 0
        score += fatalityScore
        factors++
      }

      // Safety training coverage using formula
      if (responseMap["safety_6"] && responseMap["workforce_total"]) {
        const trainingCoverageResult = FormulaService.calculateFormula("formula_25", {
          employees_covered_safety_training: responseMap["safety_6"],
          total_employees: responseMap["workforce_total"],
        })

        score += trainingCoverageResult.value
        factors++
      }
    } catch (error) {
      console.error("Error in safety quality calculation:", error)
      // Fallback to original calculation
      const ltifr = responseMap["safety_2"]
      if (ltifr !== undefined) {
        const ltifrScore = Math.max(0, 100 - (ltifr / this.industryBenchmarks.safety.ltifr) * 50)
        score += ltifrScore
        factors++
      }
    }

    return factors > 0 ? score / factors : 50
  }

  static calculateHealthQuality(responses) {
    const responseMap = {}
    responses.forEach((r) => {
      responseMap[r.question_id] = Number.parseFloat(r.response_value) || 0
    })

    let score = 0
    let factors = 0

    // Health insurance coverage
    const totalEmployees = responseMap["health_1"]
    const insuredEmployees = responseMap["health_2"]
    if (totalEmployees && insuredEmployees) {
      const coverageScore = Math.min(100, (insuredEmployees / totalEmployees) * 100)
      score += coverageScore
      factors++
    }

    // Training hours per employee
    const trainingHours = responseMap["health_3"]
    if (trainingHours) {
      const trainingScore = Math.min(100, (trainingHours / this.industryBenchmarks.health.trainingHours) * 100)
      score += trainingScore
      factors++
    }

    // Employee satisfaction
    const satisfactionScore = responseMap["health_4"]
    if (satisfactionScore) {
      const satisfactionPercentage = (satisfactionScore / 10) * 100
      score += satisfactionPercentage
      factors++
    }

    return factors > 0 ? score / factors : 50
  }

  static calculateEnvironmentalQuality(responses) {
    const responseMap = {}
    responses.forEach((r) => {
      responseMap[r.question_id] = Number.parseFloat(r.response_value) || 0
    })

    let score = 0
    let factors = 0

    try {
      // Calculate renewable energy percentage using formula
      if (responseMap["environmental_1a"] && responseMap["environmental_1b"]) {
        const renewableResult = FormulaService.calculateFormula("formula_11", {
          renewable_energy_consumption: responseMap["environmental_1a"],
          total_energy_consumption: responseMap["environmental_1b"],
        })

        const renewableScore = Math.min(
          100,
          (renewableResult.value / (this.industryBenchmarks.environmental.renewableEnergyShare * 100)) * 100,
        )
        score += renewableScore
        factors++
      }

      // Calculate water recycling rate using formula
      if (responseMap["environmental_2a"] && responseMap["environmental_2b"]) {
        const waterRecyclingResult = FormulaService.calculateFormula("formula_13", {
          water_recycled_reused: responseMap["environmental_2a"],
          total_water_consumption: responseMap["environmental_2b"],
        })

        const waterScore = Math.min(
          100,
          (waterRecyclingResult.value / (this.industryBenchmarks.environmental.waterRecycling * 100)) * 100,
        )
        score += waterScore
        factors++
      }

      // Calculate total GHG emissions using formula
      if (responseMap["environmental_3a"] && responseMap["environmental_3b"] && responseMap["environmental_3c"]) {
        const ghgResult = FormulaService.calculateFormula("formula_17", {
          scope_1_emissions: responseMap["environmental_3a"],
          scope_2_emissions: responseMap["environmental_3b"],
          scope_3_emissions: responseMap["environmental_3c"],
        })

        // Calculate emission intensity per employee
        if (responseMap["workforce_total"]) {
          const emissionIntensityResult = FormulaService.calculateFormula("formula_19", {
            total_ghg_emissions: ghgResult.value,
            total_employees: responseMap["workforce_total"],
          })

          const emissionScore = Math.max(0, 100 - emissionIntensityResult.value * 10) // Simplified scoring
          score += emissionScore
          factors++
        }
      }

      // Calculate waste recycling rate using formula
      if (responseMap["environmental_4a"] && responseMap["environmental_4b"]) {
        const wasteRecyclingResult = FormulaService.calculateFormula("formula_14", {
          total_waste_recycled: responseMap["environmental_4a"],
          total_waste_generated: responseMap["environmental_4b"],
        })

        const wasteScore = Math.min(
          100,
          (wasteRecyclingResult.value / (this.industryBenchmarks.environmental.wasteRecycling * 100)) * 100,
        )
        score += wasteScore
        factors++
      }
    } catch (error) {
      console.error("Error in environmental quality calculation:", error)
      // Fallback to original calculation
      const renewableShare = responseMap["env_3"]
      if (renewableShare !== undefined) {
        const renewableScore = Math.min(
          100,
          (renewableShare / (this.industryBenchmarks.environmental.renewableEnergyShare * 100)) * 100,
        )
        score += renewableScore
        factors++
      }
    }

    return factors > 0 ? score / factors : 50
  }

  static calculateBusinessConductQuality(responses) {
    const responseMap = {}
    responses.forEach((r) => {
      if (r.response_type === "boolean") {
        responseMap[r.question_id] = r.response_value === "true"
      } else {
        responseMap[r.question_id] = Number.parseFloat(r.response_value) || 0
      }
    })

    let score = 0
    let factors = 0

    try {
      // Ethics training coverage using formula
      if (responseMap["conduct_2"] && responseMap["workforce_total"]) {
        const ethicsTrainingResult = FormulaService.calculateFormula("formula_24", {
          employees_trained_ethics: responseMap["conduct_2"],
          total_employees: responseMap["workforce_total"],
        })

        score += ethicsTrainingResult.value
        factors++
      }

      // Independent directors percentage using formula
      if (responseMap["conduct_5a"] && responseMap["conduct_5b"]) {
        const independentDirectorsResult = FormulaService.calculateFormula("formula_21", {
          independent_directors: responseMap["conduct_5a"],
          total_board_members: responseMap["conduct_5b"],
        })

        score += independentDirectorsResult.value
        factors++
      }
    } catch (error) {
      console.error("Error in business conduct quality calculation:", error)
    }

    // Code of conduct adoption
    if (responseMap["conduct_1"] !== undefined) {
      const codeScore = responseMap["conduct_1"] ? 100 : 0
      score += codeScore
      factors++
    }

    // Anti-corruption training coverage
    const trainingCoverage = responseMap["conduct_2"]
    if (trainingCoverage !== undefined) {
      const trainingScore = Math.min(100, trainingCoverage)
      score += trainingScore
      factors++
    }

    // Sexual harassment complaint resolution rate
    const harassmentFiled = responseMap["conduct_3a"] || 0
    const harassmentResolved = responseMap["conduct_3b"] || 0
    if (harassmentFiled > 0) {
      const resolutionRate = (harassmentResolved / harassmentFiled) * 100
      score += resolutionRate
      factors++
    } else if (harassmentFiled === 0) {
      score += 100 // No complaints is good
      factors++
    }

    // Whistleblower complaint resolution rate
    const whistleblowerFiled = responseMap["conduct_4a"] || 0
    const whistleblowerResolved = responseMap["conduct_4b"] || 0
    if (whistleblowerFiled > 0) {
      const resolutionRate = (whistleblowerResolved / whistleblowerFiled) * 100
      score += resolutionRate
      factors++
    } else if (whistleblowerFiled === 0) {
      score += 100 // No complaints is good
      factors++
    }

    // Grievance mechanism availability
    if (responseMap["conduct_5"] !== undefined) {
      const grievanceScore = responseMap["conduct_5"] ? 100 : 0
      score += grievanceScore
      factors++
    }

    return factors > 0 ? score / factors : 50
  }

  static calculateBusinessQuality(responses) {
    const responseMap = {}
    responses.forEach((r) => {
      responseMap[r.question_id] = Number.parseFloat(r.response_value) || 0
    })

    let score = 0
    let factors = 0

    // Positive impact revenue ratio
    const positiveRevenue = responseMap["business_1"] || 0
    const totalRevenue = responseMap["business_2"] || 1
    const impactRatio = (positiveRevenue / totalRevenue) * 100
    score += Math.min(100, impactRatio * 2) // Double weight for positive impact
    factors++

    // CEO to median employee pay ratio (lower is better for equity)
    const ceoCompensation = responseMap["business_3"]
    const medianCompensation = responseMap["business_4"]
    if (ceoCompensation && medianCompensation && medianCompensation > 0) {
      const payRatio = ceoCompensation / medianCompensation
      const equityScore = Math.max(0, 100 - (payRatio - 10) * 2) // Penalty after 10x ratio
      score += equityScore
      factors++
    }

    // Supplier ESG assessment coverage
    const assessedSuppliers = responseMap["business_5"] || 0
    const totalSuppliers = responseMap["business_6"] || 1
    const assessmentCoverage = (assessedSuppliers / totalSuppliers) * 100
    score += assessmentCoverage
    factors++

    return factors > 0 ? score / factors : 50
  }

  static calculateBusinessOpennessQuality(responses) {
    const responseMap = {}
    responses.forEach((r) => {
      responseMap[r.question_id] = Number.parseFloat(r.response_value) || 0
    })

    let score = 0
    let factors = 0

    // Trading house concentration (lower concentration is better)
    const tradingHousePercent = responseMap["openness_1"] || 0
    const concentrationScore = Math.max(0, 100 - tradingHousePercent) // Lower dependency is better
    score += concentrationScore
    factors++

    // Dealer/distributor concentration
    const dealerPercent = responseMap["openness_4"] || 0
    const dealerScore = Math.max(0, 100 - dealerPercent) // Lower dependency is better
    score += dealerScore
    factors++

    // Top 10 concentration ratios (lower is better for diversification)
    const topTradingPercent = responseMap["openness_3"] || 0
    const topDealerPercent = responseMap["openness_6"] || 0
    const diversificationScore = Math.max(0, 100 - (topTradingPercent + topDealerPercent) / 2)
    score += diversificationScore
    factors++

    return factors > 0 ? score / factors : 50
  }

  static calculateRelatedPartyQuality(responses) {
    const responseMap = {}
    responses.forEach((r) => {
      responseMap[r.question_id] = Number.parseFloat(r.response_value) || 0
    })

    let score = 0
    let factors = 0

    // Independent directors percentage (higher is better)
    const independentDirectors = responseMap["rpt_3"] || 0
    const independenceScore = Math.min(100, independentDirectors * 2) // Up to 50% gets full score
    score += independenceScore
    factors++

    // Related party transaction percentages (lower is generally better)
    const rptPurchases = responseMap["rpt_4"] || 0
    const rptSales = responseMap["rpt_5"] || 0
    const rptLoans = responseMap["rpt_6"] || 0
    const rptInvestments = responseMap["rpt_7"] || 0

    const avgRptPercent = (rptPurchases + rptSales + rptLoans + rptInvestments) / 4
    const rptScore = Math.max(0, 100 - avgRptPercent * 2) // Penalty for high RPT percentages
    score += rptScore
    factors++

    return factors > 0 ? score / factors : 50
  }

  static calculateOverallScore(sectionScores) {
    let weightedSum = 0
    let totalWeight = 0

    sectionScores.forEach((sectionScore) => {
      const weight = this.sectionWeights[sectionScore.section_key] || 0
      if (weight > 0) {
        weightedSum += Number.parseFloat(sectionScore.score) * weight
        totalWeight += weight
      }
    })

    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  static calculateCompletionPercentage(sectionScores) {
    if (sectionScores.length === 0) return 0

    const totalCompletion = sectionScores.reduce((sum, section) => {
      return sum + Number.parseFloat(section.completion_percentage)
    }, 0)

    return totalCompletion / sectionScores.length
  }

  static generateInsights(sectionScores, responses) {
    const insights = {
      strengths: [],
      improvements: [],
      recommendations: [],
      benchmarkComparisons: {},
    }

    sectionScores.forEach((section) => {
      const score = Number.parseFloat(section.score)
      const sectionKey = section.section_key

      if (score >= 80) {
        insights.strengths.push({
          section: section.section_title,
          score: score,
          message: `Excellent performance in ${section.section_title.toLowerCase()}`,
        })
      } else if (score < 60) {
        insights.improvements.push({
          section: section.section_title,
          score: score,
          message: `Needs improvement in ${section.section_title.toLowerCase()}`,
        })

        // Add specific recommendations based on section
        const recommendations = this.getSectionRecommendations(sectionKey, score)
        insights.recommendations.push(...recommendations)
      }

      // Add benchmark comparisons
      insights.benchmarkComparisons[sectionKey] = {
        score: score,
        benchmark: 75, // Industry average benchmark
        performance: score >= 75 ? "Above Average" : score >= 60 ? "Average" : "Below Average",
      }
    })

    return insights
  }

  static getSectionRecommendations(sectionKey, score) {
    const recommendations = []
    const sectionTitle = this.getSectionMetadata(sectionKey).title

    switch (sectionKey) {
      case "workforce":
        if (score < 60) {
          recommendations.push({
            section: sectionTitle,
            priority: "High",
            action: "Improve gender diversity and optimize working hours",
            impact: "Better workforce management and compliance",
          })
        }
        break
      case "safety":
        if (score < 60) {
          recommendations.push({
            section: sectionTitle,
            priority: "Critical",
            action: "Enhance safety training programs and reduce incident rates",
            impact: "Improved workplace safety and reduced liability",
          })
        }
        break
      case "environmental":
        if (score < 60) {
          recommendations.push({
            section: sectionTitle,
            priority: "High",
            action: "Increase renewable energy adoption and waste recycling",
            impact: "Reduced environmental footprint and cost savings",
          })
        }
        break
      case "business_conduct":
        if (score < 60) {
          recommendations.push({
            section: sectionTitle,
            priority: "High",
            action: "Strengthen governance policies and complaint resolution",
            impact: "Better risk management and stakeholder trust",
          })
        }
        break
    }

    return recommendations
  }

  static calculateCompositeScores(sectionScores) {
    try {
      const scoreMap = {}
      sectionScores.forEach((section) => {
        scoreMap[section.section_key] = Number.parseFloat(section.score)
      })

      const compositeResults = {}

      // Calculate BRSR Readiness Score
      if (scoreMap.workforce && scoreMap.environmental && scoreMap.business_conduct) {
        const brsrResult = FormulaService.calculateFormula("formula_35", {
          workforce_score: scoreMap.workforce,
          diversity_score: scoreMap.workforce, // Using workforce as proxy
          environmental_score: scoreMap.environmental,
          governance_score: scoreMap.business_conduct,
        })
        compositeResults.brsr_readiness = brsrResult
      }

      // Calculate Environmental Performance Index
      if (scoreMap.environmental) {
        const envResult = FormulaService.calculateFormula("formula_36", {
          renewable_energy_pct: scoreMap.environmental * 0.8, // Normalized
          water_recycling_rate: scoreMap.environmental * 0.7,
          waste_recycling_rate: scoreMap.environmental * 0.9,
          emission_intensity_normalized: 100 - scoreMap.environmental,
        })
        compositeResults.environmental_index = envResult
      }

      return compositeResults
    } catch (error) {
      console.error("Error calculating composite scores:", error)
      return {}
    }
  }
}

module.exports = ScoringService
