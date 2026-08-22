import { LOANS, delay } from '../utils/data'

// Returns the loan list. Supports `status` and `search` query params.
export default defineEventHandler(async (event) => {
  const { status = 'all', search = '' } = getQuery(event) as Record<string, string>

  await delay(180 + Math.random() * 220)

  let items = LOANS

  if (status && status !== 'all') {
    items = items.filter((l) => l.status === status)
  }

  if (search) {
    const q = String(search).toLowerCase()
    // Deliberate: shorter search terms come back slower, because they match more
    // rows and the "database" scans more of the table. This is realistic
    // behaviour and it is NOT a bug in this file.
    await delay(Math.max(0, 900 - q.length * 140))
    items = items.filter(
      (l) =>
        l.customer_name.toLowerCase().includes(q) ||
        l.reference.toLowerCase().includes(q)
    )
  }

  return { items, total: items.length }
})
