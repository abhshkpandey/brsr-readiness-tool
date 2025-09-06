// Validation service for assessment responses
const esgFramework = require("../lib/esg-framework.json")
const FormulaService = require("./formulaService.js").default

class ValidationService {
  static validateSectionData(sectionKey, formData) {
    const errors = []
    const section = esgFramework.sections[sectionKey]

    if (!section) {
      errors.push({ field: "section", message: `Invalid section: ${sectionKey}` })
      return errors
    }

    // Validate each response
    for (const [questionId, value] of Object.entries(formData)) {
      const question = section.questions.find((q) => q.id === questionId)

      if (!question) {
        errors.push({ field: questionId, message: `Invalid question ID: ${questionId}` })
        continue
      }

      const validationError = this.validateResponse(questionId, value, question)
      if (validationError) {
        errors.push(validationError)
      }
    }

    // Cross-field validation
    const crossValidationErrors = this.validateCrossFields(sectionKey, formData)
    errors.push(...crossValidationErrors)

    const formulaValidationErrors = this.validateWithFormulas(sectionKey, formData)
    errors.push(...formulaValidationErrors)

    return errors
  }

  static validateResponse(questionId, value, question) {
    // Skip validation for empty optional fields
    if (!question.required && (value === undefined || value === null || value === "")) {
      return null
    }

    // Required field validation
    if (question.required && (value === undefined || value === null || value === "")) {
      return { field: questionId, message: `${question.question} is required` }
    }

    // Type-specific validation
    switch (question.type) {
      case "number":
        return this.validateNumber(questionId, value, question)
      case "text":
        return this.validateText(questionId, value, question)
      case "boolean":
        return this.validateBoolean(questionId, value, question)
      default:
        return { field: questionId, message: `Invalid question type: ${question.type}` }
    }
  }

  static validateNumber(questionId, value, question) {
    const numValue = Number.parseFloat(value)

    if (isNaN(numValue)) {
      return { field: questionId, message: `${question.question} must be a valid number` }
    }

    if (numValue < 0) {
      return { field: questionId, message: `${question.question} cannot be negative` }
    }

    if (question.min !== undefined && numValue < question.min) {
      return { field: questionId, message: `${question.question} must be at least ${question.min}` }
    }

    if (question.max !== undefined && numValue > question.max) {
      return { field: questionId, message: `${question.question} cannot exceed ${question.max}` }
    }

    // Unit-specific validation
    if (question.unit === "%" && (numValue < 0 || numValue > 100)) {
      return { field: questionId, message: `${question.question} must be between 0 and 100 percent` }
    }

    return null
  }

  static validateText(questionId, value, question) {
    if (typeof value !== "string") {
      return { field: questionId, message: `${question.question} must be text` }
    }

    if (value.length > 2000) {
      return { field: questionId, message: `${question.question} cannot exceed 2000 characters` }
    }

    if (question.required && value.trim().length < 10) {
      return { field: questionId, message: `${question.question} must be at least 10 characters` }
    }

    return null
  }

  static validateBoolean(questionId, value, question) {
    if (typeof value !== "boolean" && value !== "true" && value !== "false") {
      return { field: questionId, message: `${question.question} must be yes or no` }
    }

    return null
  }

  static validateWithFormulas(sectionKey, formData) {
    const errors = []

    try {
      switch (sectionKey) {
        case "workforce":
          errors.push(...this.validateWorkforceFormulas(formData))
          break
        case "environmental":
          errors.push(...this.validateEnvironmentalFormulas(formData))
          break
        case "safety":
          errors.push(...this.validateSafetyFormulas(formData))
          break
        case "business_conduct":
          errors.push(...this.validateGovernanceFormulas(formData))
          break
        case "business_openness":
          errors.push(...this.validateBusinessOpennessFormulas(formData))
          break
        case "related_party":
          errors.push(...this.validateRelatedPartyFormulas(formData))
          break
      }
    } catch (error) {
      console.error("Error in formula validation:", error)
    }

    return errors
  }

  static validateWorkforceFormulas(formData) {
    const errors = []

    try {
      // Validate total employees calculation using formula
      if (formData["workforce_1a"] && formData["workforce_1b"] && formData["workforce_1c"]) {
        const calculatedTotal = FormulaService.calculateFormula("formula_39", {
          male_employees: Number.parseFloat(formData["workforce_1a"]),
          female_employees: Number.parseFloat(formData["workforce_1b"]),
          other_gender_employees: Number.parseFloat(formData["workforce_1c"]),
        })

        if (
          formData["workforce_total"] &&
          Math.abs(calculatedTotal.value - Number.parseFloat(formData["workforce_total"])) > 0.01
        ) {
          errors.push({
            field: "workforce_total",
            message: `Total employees should be ${calculatedTotal.value} (sum of male, female, and other gender employees)`,
          })
        }
      }

      // Validate female employee percentage
      if (formData["workforce_1b"] && formData["workforce_total"]) {
        const femalePercentage = FormulaService.calculateFormula("formula_9", {
          female_employees: Number.parseFloat(formData["workforce_1b"]),
          total_employees: Number.parseFloat(formData["workforce_total"]),
        })

        if (femalePercentage.value > 100) {
          errors.push({
            field: "workforce_1b",
            message: "Female employees cannot exceed total employees",
          })
        }
      }

      // Validate total hours worked calculation
      if (
        formData["workforce_1a"] &&
        formData["workforce_1b"] &&
        formData["workforce_1c"] &&
        formData["workforce_3"] &&
        formData["workforce_5"]
      ) {
        const totalEmployees =
          Number.parseFloat(formData["workforce_1a"]) +
          Number.parseFloat(formData["workforce_1b"]) +
          Number.parseFloat(formData["workforce_1c"])
        const totalWorkers = Number.parseFloat(formData["workforce_2"]) || 0

        const totalHours = FormulaService.calculateFormula("formula_4", {
          total_employees: totalEmployees,
          total_workers: totalWorkers,
          hours_per_shift: Number.parseFloat(formData["workforce_3"]),
          working_days_per_year: Number.parseFloat(formData["workforce_5"]),
        })

        // Store calculated hours for other validations
        formData["_calculated_total_hours"] = totalHours.value
      }
    } catch (error) {
      console.error("Error validating workforce formulas:", error)
    }

    return errors
  }

  static validateEnvironmentalFormulas(formData) {
    const errors = []

    try {
      // Validate renewable energy percentage using formula
      if (formData["environmental_1a"] && formData["environmental_1b"]) {
        const renewablePercentage = FormulaService.calculateFormula("formula_11", {
          renewable_energy_consumption: Number.parseFloat(formData["environmental_1a"]),
          total_energy_consumption: Number.parseFloat(formData["environmental_1b"]),
        })

        if (renewablePercentage.value > 100) {
          errors.push({
            field: "environmental_1a",
            message: "Renewable energy consumption cannot exceed total energy consumption",
          })
        }

        // Check if provided percentage matches calculated
        if (
          formData["environmental_1c"] &&
          Math.abs(renewablePercentage.value - Number.parseFloat(formData["environmental_1c"])) > 5
        ) {
          errors.push({
            field: "environmental_1c",
            message: `Renewable energy percentage should be approximately ${renewablePercentage.value.toFixed(1)}%`,
          })
        }
      }

      // Validate water recycling rate using formula
      if (formData["environmental_2a"] && formData["environmental_2b"]) {
        const waterRecyclingRate = FormulaService.calculateFormula("formula_13", {
          water_recycled_reused: Number.parseFloat(formData["environmental_2a"]),
          total_water_consumption: Number.parseFloat(formData["environmental_2b"]),
        })

        if (waterRecyclingRate.value > 100) {
          errors.push({
            field: "environmental_2a",
            message: "Water recycled/reused cannot exceed total water consumption",
          })
        }
      }

      // Validate total GHG emissions calculation
      if (formData["environmental_3a"] && formData["environmental_3b"] && formData["environmental_3c"]) {
        const totalGHG = FormulaService.calculateFormula("formula_17", {
          scope_1_emissions: Number.parseFloat(formData["environmental_3a"]),
          scope_2_emissions: Number.parseFloat(formData["environmental_3b"]),
          scope_3_emissions: Number.parseFloat(formData["environmental_3c"]),
        })

        if (
          formData["environmental_3d"] &&
          Math.abs(totalGHG.value - Number.parseFloat(formData["environmental_3d"])) > totalGHG.value * 0.05
        ) {
          errors.push({
            field: "environmental_3d",
            message: `Total GHG emissions should be approximately ${totalGHG.value.toFixed(2)} tCO2e`,
          })
        }
      }

      // Validate waste recycling rates
      if (formData["environmental_4a"] && formData["environmental_4b"]) {
        const wasteRecyclingRate = FormulaService.calculateFormula("formula_14", {
          total_waste_recycled: Number.parseFloat(formData["environmental_4a"]),
          total_waste_generated: Number.parseFloat(formData["environmental_4b"]),
        })

        if (wasteRecyclingRate.value > 100) {
          errors.push({
            field: "environmental_4a",
            message: "Total waste recycled cannot exceed total waste generated",
          })
        }
      }
    } catch (error) {
      console.error("Error validating environmental formulas:", error)
    }

    return errors
  }

  static validateSafetyFormulas(formData) {
    const errors = []

    try {
      // Validate LTIFR calculation
      if (formData["safety_1a"] && formData["_calculated_total_hours"]) {
        const ltifr = FormulaService.calculateFormula("formula_1", {
          number_of_ltis: Number.parseFloat(formData["safety_1a"]),
          total_hours_worked: formData["_calculated_total_hours"],
        })

        if (formData["safety_2"] && Math.abs(ltifr.value - Number.parseFloat(formData["safety_2"])) > 0.1) {
          errors.push({
            field: "safety_2",
            message: `LTIFR should be approximately ${ltifr.value.toFixed(2)} per million hours`,
          })
        }
      }

      // Validate TRIR calculation
      if (formData["safety_1b"] && formData["_calculated_total_hours"]) {
        const trir = FormulaService.calculateFormula("formula_5", {
          total_recordable_incidents: Number.parseFloat(formData["safety_1b"]),
          total_hours_worked: formData["_calculated_total_hours"],
        })

        if (formData["safety_4"] && Math.abs(trir.value - Number.parseFloat(formData["safety_4"])) > 0.1) {
          errors.push({
            field: "safety_4",
            message: `TRIR should be approximately ${trir.value.toFixed(2)} per 200,000 hours`,
          })
        }
      }

      // Validate safety training coverage
      if (formData["safety_6"] && formData["workforce_total"]) {
        const trainingCoverage = FormulaService.calculateFormula("formula_25", {
          employees_covered_safety_training: Number.parseFloat(formData["safety_6"]),
          total_employees: Number.parseFloat(formData["workforce_total"]),
        })

        if (trainingCoverage.value > 100) {
          errors.push({
            field: "safety_6",
            message: "Employees covered by safety training cannot exceed total employees",
          })
        }
      }
    } catch (error) {
      console.error("Error validating safety formulas:", error)
    }

    return errors
  }

  static validateGovernanceFormulas(formData) {
    const errors = []

    try {
      // Validate independent directors percentage
      if (formData["conduct_5a"] && formData["conduct_5b"]) {
        const independentDirectorsPercentage = FormulaService.calculateFormula("formula_21", {
          independent_directors: Number.parseFloat(formData["conduct_5a"]),
          total_board_members: Number.parseFloat(formData["conduct_5b"]),
        })

        if (independentDirectorsPercentage.value > 100) {
          errors.push({
            field: "conduct_5a",
            message: "Independent directors cannot exceed total board members",
          })
        }
      }

      // Validate ethics training coverage
      if (formData["conduct_2"] && formData["workforce_total"]) {
        const ethicsTrainingCoverage = FormulaService.calculateFormula("formula_24", {
          employees_trained_ethics: Number.parseFloat(formData["conduct_2"]),
          total_employees: Number.parseFloat(formData["workforce_total"]),
        })

        if (ethicsTrainingCoverage.value > 100) {
          errors.push({
            field: "conduct_2",
            message: "Employees trained in ethics cannot exceed total employees",
          })
        }
      }
    } catch (error) {
      console.error("Error validating governance formulas:", error)
    }

    return errors
  }

  static validateBusinessOpennessFormulas(formData) {
    const errors = []

    try {
      // Validate supplier ESG assessment rate
      if (formData["openness_1"] && formData["openness_2"]) {
        const supplierAssessmentRate = FormulaService.calculateFormula("formula_27", {
          suppliers_assessed_esg: Number.parseFloat(formData["openness_1"]),
          total_suppliers: Number.parseFloat(formData["openness_2"]),
        })

        if (supplierAssessmentRate.value > 100) {
          errors.push({
            field: "openness_1",
            message: "Suppliers assessed for ESG cannot exceed total suppliers",
          })
        }
      }

      // Validate trading house percentages
      if (formData["openness_3"] && formData["openness_4"]) {
        const tradingHousePercentage = FormulaService.calculateFormula("formula_29", {
          purchases_from_trading_houses: Number.parseFloat(formData["openness_3"]),
          total_purchases: Number.parseFloat(formData["openness_4"]),
        })

        if (tradingHousePercentage.value > 100) {
          errors.push({
            field: "openness_3",
            message: "Purchases from trading houses cannot exceed total purchases",
          })
        }
      }
    } catch (error) {
      console.error("Error validating business openness formulas:", error)
    }

    return errors
  }

  static validateRelatedPartyFormulas(formData) {
    const errors = []

    try {
      // Validate RPT percentages using formulas
      const rptFields = [
        { field: "rpt_4", formula: "formula_31", inputs: ["rpt_purchases", "total_purchases"] },
        { field: "rpt_5", formula: "formula_32", inputs: ["rpt_sales", "total_sales"] },
        { field: "rpt_6", formula: "formula_33", inputs: ["rpt_loans_advances", "total_loans_advances"] },
        { field: "rpt_7", formula: "formula_34", inputs: ["rpt_investments", "total_investments"] },
      ]

      rptFields.forEach(({ field, formula, inputs }) => {
        if (formData[inputs[0]] && formData[inputs[1]]) {
          const rptPercentage = FormulaService.calculateFormula(formula, {
            [inputs[0]]: Number.parseFloat(formData[inputs[0]]),
            [inputs[1]]: Number.parseFloat(formData[inputs[1]]),
          })

          if (rptPercentage.value > 100) {
            errors.push({
              field: inputs[0],
              message: `${inputs[0].replace("_", " ")} cannot exceed ${inputs[1].replace("_", " ")}`,
            })
          }
        }
      })

      // Validate total RPT as percentage of revenue
      if (formData["rpt_total"] && formData["total_revenue"]) {
        const rptRevenuePercentage = FormulaService.calculateFormula("formula_28", {
          total_rpt_value: Number.parseFloat(formData["rpt_total"]),
          total_revenue: Number.parseFloat(formData["total_revenue"]),
        })

        if (rptRevenuePercentage.value > 100) {
          errors.push({
            field: "rpt_total",
            message: "Total RPT value cannot exceed total revenue",
          })
        }
      }
    } catch (error) {
      console.error("Error validating related party formulas:", error)
    }

    return errors
  }

  static validateCrossFields(sectionKey, formData) {
    const errors = []

    switch (sectionKey) {
      case "workforce":
        errors.push(...this.validateWorkforceFields(formData))
        break
      case "environmental":
        errors.push(...this.validateEnvironmentalFields(formData))
        break
      case "business_conduct":
        errors.push(...this.validateBusinessConductFields(formData))
        break
      case "business":
        errors.push(...this.validateBusinessFields(formData))
        break
      case "related_party":
        errors.push(...this.validateRelatedPartyFields(formData))
        break
    }

    return errors
  }

  static validateWorkforceFields(formData) {
    const errors = []

    // Validate total employees calculation
    const maleEmployees = Number.parseFloat(formData["workforce_1a"]) || 0
    const femaleEmployees = Number.parseFloat(formData["workforce_1b"]) || 0
    const otherEmployees = Number.parseFloat(formData["workforce_1c"]) || 0
    const totalEmployees = maleEmployees + femaleEmployees + otherEmployees

    if (totalEmployees === 0 && (maleEmployees > 0 || femaleEmployees > 0 || otherEmployees > 0)) {
      errors.push({ field: "workforce_total", message: "Employee counts must be consistent" })
    }

    // Validate working hours
    const workingHours = Number.parseFloat(formData["workforce_3"]) || Number.parseFloat(formData["workforce_4"])
    if (workingHours && (workingHours < 6 || workingHours > 12)) {
      errors.push({ field: "working_hours", message: "Working hours should be between 6 and 12 hours per shift" })
    }

    // Validate working days
    const workingDays = Number.parseFloat(formData["workforce_5"])
    if (workingDays && (workingDays < 200 || workingDays > 365)) {
      errors.push({ field: "workforce_5", message: "Working days should be between 200 and 365 days per year" })
    }

    return errors
  }

  static validateEnvironmentalFields(formData) {
    const errors = []

    // Validate renewable energy percentage
    const totalEnergy = Number.parseFloat(formData["env_1"]) || 0
    const renewableEnergy = Number.parseFloat(formData["env_2"]) || 0
    const renewablePercent = Number.parseFloat(formData["env_3"]) || 0

    if (totalEnergy > 0 && renewableEnergy > totalEnergy) {
      errors.push({ field: "env_2", message: "Renewable energy cannot exceed total energy consumption" })
    }

    if (totalEnergy > 0 && renewablePercent > 0) {
      const calculatedPercent = (renewableEnergy / totalEnergy) * 100
      if (Math.abs(calculatedPercent - renewablePercent) > 5) {
        errors.push({ field: "env_3", message: "Renewable energy percentage should match the calculated value" })
      }
    }

    // Validate water recycling
    const totalWater = Number.parseFloat(formData["env_4"]) || 0
    const recycledWater = Number.parseFloat(formData["env_5"]) || 0
    const waterRecyclingPercent = Number.parseFloat(formData["env_6"]) || 0

    if (totalWater > 0 && recycledWater > totalWater) {
      errors.push({ field: "env_5", message: "Recycled water cannot exceed total water consumption" })
    }

    // Validate waste data
    const totalWaste = Number.parseFloat(formData["env_9"]) || 0
    const hazardousWaste = Number.parseFloat(formData["env_10"]) || 0
    const nonHazardousWaste = Number.parseFloat(formData["env_12"]) || 0

    if (hazardousWaste + nonHazardousWaste > totalWaste * 1.1) {
      // Allow 10% tolerance
      errors.push({
        field: "waste_total",
        message: "Sum of hazardous and non-hazardous waste should not exceed total waste",
      })
    }

    return errors
  }

  static validateBusinessConductFields(formData) {
    const errors = []

    // Validate complaint resolution
    const harassmentFiled = Number.parseFloat(formData["conduct_3a"]) || 0
    const harassmentResolved = Number.parseFloat(formData["conduct_3b"]) || 0
    const harassmentPending = Number.parseFloat(formData["conduct_3c"]) || 0

    if (harassmentResolved + harassmentPending > harassmentFiled) {
      errors.push({
        field: "conduct_complaints",
        message: "Resolved + Pending complaints cannot exceed filed complaints",
      })
    }

    const whistleblowerFiled = Number.parseFloat(formData["conduct_4a"]) || 0
    const whistleblowerResolved = Number.parseFloat(formData["conduct_4b"]) || 0
    const whistleblowerPending = Number.parseFloat(formData["conduct_4c"]) || 0

    if (whistleblowerResolved + whistleblowerPending > whistleblowerFiled) {
      errors.push({
        field: "whistleblower_complaints",
        message: "Resolved + Pending whistleblower complaints cannot exceed filed complaints",
      })
    }

    return errors
  }

  static validateBusinessFields(formData) {
    const errors = []

    // Validate revenue data
    const positiveRevenue = Number.parseFloat(formData["business_1"]) || 0
    const totalRevenue = Number.parseFloat(formData["business_2"]) || 0

    if (positiveRevenue > totalRevenue) {
      errors.push({ field: "business_1", message: "Positive impact revenue cannot exceed total revenue" })
    }

    // Validate supplier data
    const assessedSuppliers = Number.parseFloat(formData["business_5"]) || 0
    const totalSuppliers = Number.parseFloat(formData["business_6"]) || 0

    if (assessedSuppliers > totalSuppliers) {
      errors.push({ field: "business_5", message: "Assessed suppliers cannot exceed total suppliers" })
    }

    return errors
  }

  static validateRelatedPartyFields(formData) {
    const errors = []

    // Validate percentage fields don't exceed 100%
    const percentageFields = ["rpt_3", "rpt_4", "rpt_5", "rpt_6", "rpt_7", "rpt_8b", "rpt_9b"]

    percentageFields.forEach((field) => {
      const value = Number.parseFloat(formData[field])
      if (value && value > 100) {
        errors.push({ field: field, message: "Percentage values cannot exceed 100%" })
      }
    })

    return errors
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
}

module.exports = ValidationService
