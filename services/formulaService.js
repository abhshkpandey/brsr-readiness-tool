import formulasData from "../lib/esg-formulas.json"

export class FormulaService {
  constructor() {
    this.formulas = formulasData.formulas
  }

  calculateFormula(formulaId, inputs) {
    const formula = this.findFormulaById(formulaId)
    if (!formula) {
      throw new Error(`Formula with ID ${formulaId} not found`)
    }

    // Validate all required inputs are provided
    const missingInputs = formula.inputs.filter((input) => inputs[input] === undefined || inputs[input] === null)
    if (missingInputs.length > 0) {
      throw new Error(`Missing required inputs: ${missingInputs.join(", ")}`)
    }

    try {
      // Replace formula variables with actual values
      let expression = formula.formula
      formula.inputs.forEach((input) => {
        const value = Number.parseFloat(inputs[input]) || 0
        expression = expression.replace(new RegExp(input, "g"), value.toString())
      })

      // Safely evaluate the mathematical expression
      const result = this.evaluateExpression(expression)

      return {
        value: result,
        unit: formula.output_unit,
        formula: formula.name,
        inputs: inputs,
      }
    } catch (error) {
      throw new Error(`Error calculating ${formula.name}: ${error.message}`)
    }
  }

  evaluateExpression(expression) {
    // Remove any potentially dangerous characters
    const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, "")

    try {
      // Use Function constructor for safe evaluation
      return new Function("return " + sanitized)()
    } catch (error) {
      throw new Error("Invalid mathematical expression")
    }
  }

  findFormulaById(formulaId) {
    for (const category of Object.values(this.formulas)) {
      const formula = category.calculations.find((calc) => calc.id === formulaId)
      if (formula) return formula
    }
    return null
  }

  getFormulasByCategory(categoryKey) {
    return this.formulas[categoryKey]?.calculations || []
  }

  calculateWorkforceMetrics(responses) {
    const results = {}

    try {
      // Total employees calculation
      if (responses.workforce_1a && responses.workforce_1b && responses.workforce_1c) {
        results.total_employees = this.calculateFormula("formula_39", {
          male_employees: responses.workforce_1a,
          female_employees: responses.workforce_1b,
          other_gender_employees: responses.workforce_1c,
        })
      }

      // LTIFR calculation
      if (responses.safety_1a && responses.workforce_total_hours) {
        results.ltifr = this.calculateFormula("formula_1", {
          number_of_ltis: responses.safety_1a,
          total_hours_worked: responses.workforce_total_hours,
        })
      }

      // Gender diversity percentages
      if (results.total_employees && responses.workforce_1b) {
        results.female_percentage = this.calculateFormula("formula_9", {
          female_employees: responses.workforce_1b,
          total_employees: results.total_employees.value,
        })
      }
    } catch (error) {
      console.error("Error calculating workforce metrics:", error)
    }

    return results
  }

  calculateEnvironmentalMetrics(responses) {
    const results = {}

    try {
      // Renewable energy percentage
      if (responses.environmental_1a && responses.environmental_1b) {
        results.renewable_energy_pct = this.calculateFormula("formula_11", {
          renewable_energy_consumption: responses.environmental_1a,
          total_energy_consumption: responses.environmental_1b,
        })
      }

      // Water recycling rate
      if (responses.environmental_2a && responses.environmental_2b) {
        results.water_recycling_rate = this.calculateFormula("formula_13", {
          water_recycled_reused: responses.environmental_2a,
          total_water_consumption: responses.environmental_2b,
        })
      }

      // Total GHG emissions
      if (responses.environmental_3a && responses.environmental_3b && responses.environmental_3c) {
        results.total_ghg_emissions = this.calculateFormula("formula_17", {
          scope_1_emissions: responses.environmental_3a,
          scope_2_emissions: responses.environmental_3b,
          scope_3_emissions: responses.environmental_3c,
        })
      }

      // Waste recycling rate
      if (responses.environmental_4a && responses.environmental_4b) {
        results.waste_recycling_rate = this.calculateFormula("formula_14", {
          total_waste_recycled: responses.environmental_4a,
          total_waste_generated: responses.environmental_4b,
        })
      }
    } catch (error) {
      console.error("Error calculating environmental metrics:", error)
    }

    return results
  }

  calculateCompositeScores(sectionScores) {
    const results = {}

    try {
      // BRSR Readiness Score
      if (sectionScores.workforce && sectionScores.environmental && sectionScores.business_conduct) {
        results.brsr_readiness = this.calculateFormula("formula_35", {
          workforce_score: sectionScores.workforce,
          diversity_score: sectionScores.workforce, // Using workforce as proxy for diversity
          environmental_score: sectionScores.environmental,
          governance_score: sectionScores.business_conduct,
        })
      }
    } catch (error) {
      console.error("Error calculating composite scores:", error)
    }

    return results
  }

  validateCalculatedFields(responses) {
    const errors = []

    try {
      // Validate renewable energy doesn't exceed total energy
      if (responses.environmental_1a && responses.environmental_1b) {
        if (Number.parseFloat(responses.environmental_1a) > Number.parseFloat(responses.environmental_1b)) {
          errors.push("Renewable energy consumption cannot exceed total energy consumption")
        }
      }

      // Validate water recycling doesn't exceed 100%
      if (responses.environmental_2a && responses.environmental_2b) {
        const recyclingRate =
          (Number.parseFloat(responses.environmental_2a) / Number.parseFloat(responses.environmental_2b)) * 100
        if (recyclingRate > 100) {
          errors.push("Water recycling rate cannot exceed 100%")
        }
      }

      // Validate total employees calculation
      if (responses.workforce_1a && responses.workforce_1b && responses.workforce_1c) {
        const calculatedTotal =
          Number.parseFloat(responses.workforce_1a) +
          Number.parseFloat(responses.workforce_1b) +
          Number.parseFloat(responses.workforce_1c)
        if (
          responses.workforce_total &&
          Math.abs(calculatedTotal - Number.parseFloat(responses.workforce_total)) > 0.01
        ) {
          errors.push("Total employees should equal sum of male, female, and other gender employees")
        }
      }
    } catch (error) {
      console.error("Error validating calculated fields:", error)
    }

    return errors
  }

  getAllFormulas() {
    return this.formulas
  }

  getFormulaMetadata() {
    return formulasData.metadata
  }
}

export default new FormulaService()
