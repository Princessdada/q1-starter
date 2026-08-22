import { delay } from '../../utils/data'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  await delay(300)
  return {
    id,
    name: 'Sycamore Operations',
    tier: 'internal',
    branch: 'Lagos — Yaba',
  }
})
