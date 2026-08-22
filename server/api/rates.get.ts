import { delay } from '../utils/data'

export default defineEventHandler(async () => {
  await delay(250)
  return { base_rate: 0.045, penalty_rate: 0.015, effective_from: '2026-07-01' }
})
