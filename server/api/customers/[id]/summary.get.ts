import { LOANS, delay } from '../../../utils/data'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  await delay(400)

  const outstanding = LOANS
    .filter((l) => l.status !== 'paid')
    .reduce((sum, l) => sum + l.amount_kobo, 0)

  return {
    customer_id: id,
    open_loans: LOANS.filter((l) => l.status !== 'paid').length,
    // Authoritative figure, computed in integer kobo. The finance export uses this.
    outstanding_kobo: outstanding,
  }
})
