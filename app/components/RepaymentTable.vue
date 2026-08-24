<script setup>
const props = defineProps({ customerId: String })

const loans = ref([])
const filters = reactive({ status: 'all', search: '' })
const isLoading = ref(false)
const selectedLoanId = ref(null)
const lastSyncedAt = ref(new Date().toLocaleTimeString())

const selectedLoan = computed(() =>
  loans.value.find((l) => l.id === selectedLoanId.value)
)

const { data: customer } = await useFetch(`/api/customers/${props.customerId}`)
const { data: summary } = await useFetch(`/api/customers/${props.customerId}/summary`)
const { data: rates } = await useFetch('/api/rates')

let pollTimer = null
let searchDebounce = null

async function loadLoans(isInitial = false) {
  if (isInitial) {
    isLoading.value = true
  }

  try {
    const res = await $fetch('/api/loans', { params: { ...filters } })
    
    const itemsWithSchedule = await Promise.all(
      (res.items || []).map(async (loan) => {
        try {
          const schedule = await $fetch(`/api/loans/${loan.id}/schedule`)
          return {
            ...loan,
            status: locallyPaid.value.has(loan.id) ? 'paid' : loan.status,
            schedule
          }
        } catch {
          return {
            ...loan,
            status: locallyPaid.value.has(loan.id) ? 'paid' : loan.status
          }
        }
      })
    )

    loans.value = itemsWithSchedule
    lastSyncedAt.value = new Date().toLocaleTimeString()
  } catch (err) {
    console.error('Failed to load loans:', err)
  } finally {
    isLoading.value = false
  }
}

function handleResize() {
  isNarrow.value = window.innerWidth < 640
}
const isNarrow = ref(false)

watch(
  filters,
  () => {
    if (searchDebounce) clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => {
      loadLoans(true)
    }, 300)
  },
  { deep: true }
)

onMounted(() => {
  loadLoans(true)
  pollTimer = setInterval(() => loadLoans(false), 5000)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (searchDebounce) {
    clearTimeout(searchDebounce)
    searchDebounce = null
  }
  window.removeEventListener('resize', handleResize)
})

const totalOutstanding = computed(() => {
  // Page-level figure: it must cover every open loan, not just the rows that
  // currently match the search. summary.outstanding_kobo is computed server-side
  // over the full set, in integer kobo, and summary.get.ts documents it as the
  // figure the finance export uses.
  const base = summary.value?.outstanding_kobo ?? 0

  // /api/loans/:id/repay acknowledges a payment but does not persist it, so
  // anything paid in this session is still counted inside `base`. Subtract it,
  // or the header would not respond to a payment the operator just made.
  let paidKobo = 0
  for (const amount of locallyPaid.value.values()) paidKobo += amount

  return (base - paidKobo) / 100
})

const overdueCount = computed(() =>
  loans.value.filter((l) => l.status !== 'paid' && l.due_date < new Date().toISOString()).length
)

const visibleLoans = computed(() =>
  loans.value.map((l) => ({ ...l, label: `${l.customer_name} — ${l.reference}` }))
)

function formatNaira(v) {
  const num = Number(v)
  if (isNaN(num)) return '₦0.00'
  return '₦' + num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const payingLoanId = ref(null)
const actionError = ref('')
const actionSuccess = ref('')
// loan id -> amount_kobo captured at the moment of payment. A Map rather than a
// Set because the amount is still needed after the row has been filtered out of
// loans.value, when the loan object is no longer in scope to read it from.
const locallyPaid = ref(new Map())

async function pay(loan) {
  if (payingLoanId.value || loan.status === 'paid') return
  payingLoanId.value = loan.id
  actionError.value = ''
  actionSuccess.value = ''

  try {
    await $fetch(`/api/loans/${loan.id}/repay`, { method: 'POST' })
    locallyPaid.value.set(loan.id, loan.amount_kobo || 0)
    const target = loans.value.find((l) => l.id === loan.id)
    if (target) {
      target.status = 'paid'
    }
    actionSuccess.value = `Repayment of ${loan.reference} (${loan.customer_name}) posted successfully!`
  } catch (err) {
    const errorMsg = err?.data?.statusMessage || err?.data?.message || err?.message || 'Payment processor unavailable'
    actionError.value = `Failed to process repayment for ${loan.reference}: ${errorMsg}`
  } finally {
    payingLoanId.value = null
  }
}
</script>

<template>
  <div>
    <header>
      <h2>Repayments</h2>
      <p>{{ customer?.branch }} · Last synced: {{ lastSyncedAt }}</p>
      <p>{{ overdueCount }} overdue · Total outstanding {{ formatNaira(totalOutstanding) }}</p>
    </header>

    <div v-if="actionSuccess" style="color: #059669; font-weight: 500; margin-bottom: 8px;">
      ✓ {{ actionSuccess }}
    </div>

    <div v-if="actionError" style="color: #dc2626; font-weight: 500; margin-bottom: 8px;">
      ⚠ {{ actionError }}
    </div>

    <input v-model="filters.search" placeholder="Search customer or reference" />

    <div v-if="isLoading">Loading…</div>

    <table>
      <tbody>
        <tr v-for="loan in visibleLoans" :key="loan.id" @click="selectedLoanId = loan.id">
          <td>{{ loan.label }}</td>
          <td>{{ loan.description }}</td>
          <td>{{ formatNaira(loan.amount_kobo / 100) }}</td>
          <td>{{ loan.schedule?.next_due }}</td>
          <td>
            <button
              class="btn"
              :disabled="payingLoanId === loan.id || loan.status === 'paid'"
              @click.stop="pay(loan)"
            >
              {{ payingLoanId === loan.id ? 'Paying…' : loan.status === 'paid' ? 'Paid' : 'Pay' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="selectedLoan" class="modal">
      <div class="close" @click="selectedLoanId = null">×</div>
      <h3>{{ selectedLoan.customer_name }} — {{ selectedLoan.reference }}</h3>
      <p>Status: {{ selectedLoan.status }}</p>
      <p>Due: {{ selectedLoan.schedule?.next_due }}</p>
      <p>Installment: {{ formatNaira((selectedLoan.schedule?.installment_amount_kobo || 0) / 100) }}</p>
    </div>
  </div>
</template>
