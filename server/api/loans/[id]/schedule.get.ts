import { LOANS, delay } from '../../../utils/data'

// Repayment schedule for a single loan.
// Each call takes ~150ms. That is on purpose — it is what a real per-row
// lookup costs. It is not a bug in this file.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const loan = LOANS.find((l) => l.id === id)

  await delay(150)

  if (!loan) {
    throw createError({ statusCode: 404, statusMessage: 'Loan not found' })
  }

  const installments = 6
  const per = Math.floor(loan.amount_kobo / installments)

  return {
    loan_id: loan.id,
    next_due: loan.due_date.slice(0, 10),
    installments_total: installments,
    installments_paid: loan.status === 'paid' ? installments : 2,
    installment_amount_kobo: per,
  }
})
