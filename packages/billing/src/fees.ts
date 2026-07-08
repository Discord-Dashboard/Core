// Platform revenue math for Stripe Connect. The platform keeps an application
// fee (a percentage of the amount) and the connected account gets the rest.
export function computeApplicationFee(amountCents: number, feePercent: number): number {
  if (!Number.isFinite(amountCents) || amountCents < 0) {
    throw new Error("amountCents must be a non negative number")
  }
  if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 100) {
    throw new Error("feePercent must be between 0 and 100")
  }
  return Math.round(amountCents * (feePercent / 100))
}

export function connectedAccountShare(amountCents: number, feePercent: number): number {
  return amountCents - computeApplicationFee(amountCents, feePercent)
}
