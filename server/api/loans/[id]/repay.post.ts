import { LOANS, delay } from '../../../utils/data'

// Posts a repayment.
// This endpoint fails about 25% of the time with a 502. That is deliberate,
// so that failure handling is observable. It is not a bug in this file.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const loan = LOANS.find((l) => l.id === id)

  await delay(600 + Math.random() * 500)

  if (!loan) {
    throw createError({ statusCode: 404, statusMessage: 'Loan not found' })
  }

  if (Math.random() < 0.25) {
    throw createError({ statusCode: 502, statusMessage: 'Payment processor unavailable' })
  }

  return { ok: true, loan_id: loan.id, status: 'paid', posted_at: new Date().toISOString() }
})
