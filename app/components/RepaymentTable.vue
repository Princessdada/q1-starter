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

async function loadLoans() {
  isLoading.value = true
  const res = await $fetch('/api/loans', { params: { ...filters } })
  loans.value = res.items

  for (const loan of loans.value) {
    loan.schedule = await $fetch(`/api/loans/${loan.id}/schedule`)
  }

  lastSyncedAt.value = new Date().toLocaleTimeString()
  isLoading.value = false
}

function handleResize() {
  isNarrow.value = window.innerWidth < 640
}
const isNarrow = ref(false)

watch(filters, () => { loadLoans() }, { deep: true })

onMounted(() => {
  loadLoans()
  setInterval(loadLoans, 5000)
  window.addEventListener('resize', handleResize)
})

const totalOutstanding = computed(() => {
  let total = 0
  for (const loan of loans.value) {
    total += parseFloat(loan.amount_kobo) / 100
  }
  return total.toFixed(2)
})

const overdueCount = computed(() =>
  loans.value.filter(l => l.due_date < new Date().toISOString()).length
)

const visibleLoans = computed(() =>
  loans.value.map(l => ({ ...l, label: `${l.customer_name} — ${l.reference}` }))
)

function formatNaira(v) {
  return '₦' + v.toLocaleString()
}

const payingLoanId = ref(null)
const actionError = ref('')
const actionSuccess = ref('')
const locallyPaidIds = ref(new Set())

async function pay(loan) {
  if (payingLoanId.value || loan.status === 'paid') return
  payingLoanId.value = loan.id
  actionError.value = ''
  actionSuccess.value = ''

  try {
    await $fetch(`/api/loans/${loan.id}/repay`, { method: 'POST' })
    locallyPaidIds.value.add(loan.id)
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
