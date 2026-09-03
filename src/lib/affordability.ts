/**
 * Deterministic Affordability Engine
 * Implements standard mortgage amortization and debt-to-income calculations.
 * STRICT POLICY: NO LLM ARITHMETIC. Pure deterministic mathematics.
 */

import { AffordabilityInput, AffordabilityResult } from '../types.ts';

export function calculateAffordability(input: AffordabilityInput): AffordabilityResult {
  const propertyPrice = Math.max(0, Number(input.propertyPrice) || 0);
  const downPayment = Math.max(0, Math.min(propertyPrice, Number(input.downPayment) || 0));
  const loanAmount = Math.max(0, propertyPrice - downPayment);
  const monthlyBudget = Math.max(0, Number(input.budget) || 0);
  
  const annualInterestRate = Math.max(0, Number(input.financingRate) || 6.5);
  const years = Math.max(1, Number(input.financingYears) || 30);
  const totalMonths = years * 12;
  const monthlyRate = annualInterestRate / 100 / 12;

  // Monthly Principal and Interest (Standard Amortization Formula)
  let monthlyPrincipalAndInterest = 0;
  if (loanAmount > 0) {
    if (monthlyRate === 0) {
      monthlyPrincipalAndInterest = loanAmount / totalMonths;
    } else {
      const compound = Math.pow(1 + monthlyRate, totalMonths);
      monthlyPrincipalAndInterest = loanAmount * (monthlyRate * compound) / (compound - 1);
    }
  }

  // Estimated Property Tax (default 1.2% annual of property price)
  const taxRate = input.propertyTaxRate !== undefined ? Number(input.propertyTaxRate) : 1.2;
  const monthlyTax = (propertyPrice * (taxRate / 100)) / 12;

  // Estimated Home Insurance (default 0.45% annual of property price or explicit amount)
  const monthlyInsurance = input.homeInsuranceAnnual !== undefined
    ? Number(input.homeInsuranceAnnual) / 12
    : (propertyPrice * 0.0045) / 12;

  // HOA dues
  const monthlyHoa = input.hoaMonthly !== undefined ? Number(input.hoaMonthly) : 0;

  const totalMonthlyPayment = Math.round((monthlyPrincipalAndInterest + monthlyTax + monthlyInsurance + monthlyHoa) * 100) / 100;
  const downPaymentPercent = propertyPrice > 0 ? Math.round((downPayment / propertyPrice) * 1000) / 10 : 0;
  const surplusOrDeficit = Math.round((monthlyBudget - totalMonthlyPayment) * 100) / 100;
  const isAffordable = totalMonthlyPayment <= monthlyBudget;

  // Rule of thumb max purchase price based on monthly budget (assuming 20% down, 30y fixed)
  const estimatedTaxAndInsFactor = 1 + (0.0165 / (12 * (monthlyRate || 0.005)));
  const ruleOfThumbMaxPrice = Math.round(monthlyBudget * 165);

  let explanation = '';
  if (isAffordable) {
    explanation = `Affordable: Estimated total monthly cost of $${totalMonthlyPayment.toLocaleString()} is within your monthly budget of $${monthlyBudget.toLocaleString()} (leaving $${surplusOrDeficit.toLocaleString()} surplus/mo).`;
  } else {
    explanation = `Over budget: Estimated monthly commitment of $${totalMonthlyPayment.toLocaleString()} exceeds your monthly budget of $${monthlyBudget.toLocaleString()} by $${Math.abs(surplusOrDeficit).toLocaleString()}/mo. Consider a larger down payment or a property under $${ruleOfThumbMaxPrice.toLocaleString()}.`;
  }

  return {
    loanAmount: Math.round(loanAmount * 100) / 100,
    downPaymentPercent,
    monthlyPrincipalAndInterest: Math.round(monthlyPrincipalAndInterest * 100) / 100,
    monthlyTax: Math.round(monthlyTax * 100) / 100,
    monthlyInsurance: Math.round(monthlyInsurance * 100) / 100,
    monthlyHoa: Math.round(monthlyHoa * 100) / 100,
    totalMonthlyPayment,
    isAffordable,
    surplusOrDeficit,
    ruleOfThumbMaxPrice,
    explanation,
  };
}
