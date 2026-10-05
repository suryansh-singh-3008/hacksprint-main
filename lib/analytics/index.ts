/** Complete analytics engine — all functions, pure TS, no LLM. */

export { salesSummary } from './sales';
export { profitSummary, profitDiagnosis } from './profit';
export { productPerformance } from './products';
export { supplierCostAnalysis } from './suppliers';
export { hiringAffordability } from './hiring';
export { expiryRisk, discountSuggestion } from './expiry';
export { udhaarSummary } from './udhaar';
export { schemeMatch, complianceDue } from './schemes';
export { periodToRange } from './period';
export type { Period } from './period';
