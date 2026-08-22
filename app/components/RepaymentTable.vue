<script setup>
const props = defineProps({ customerId: String })

const loans = ref([])
const filters = reactive({ status: 'all', search: '' })
const isLoading = ref(false)
const expandedRow = ref(null)
const lastSyncedAt = ref(new Date().toLocaleTimeString())

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

async function pay(loan) {
  await $fetch(`/api/loans/${loan.id}/repay`, { method: 'POST' })
  loan.status = 'paid'
}
</script>

<template>
  <div>
    <header>
      <h2>Repayments</h2>
      <p>{{ customer?.branch }} · Last synced: {{ lastSyncedAt }}</p>
      <p>{{ overdueCount }} overdue · Total outstanding {{ formatNaira(totalOutstanding) }}</p>
    </header>

    <input v-model="filters.search" placeholder="Search customer or reference" />

    <div v-if="isLoading">Loading…</div>

    <table>
      <tbody>
        <tr v-for="(loan, i) in visibleLoans" :key="i" @click="expandedRow = i">
          <td>{{ loan.label }}</td>
          <td v-html="loan.description"></td>
          <td>{{ formatNaira(loan.amount_kobo / 100) }}</td>
          <td>{{ loan.schedule?.next_due }}</td>
          <td>
            <div class="btn" @click.stop="pay(loan)">Pay</div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="expandedRow !== null" class="modal">
      <div class="close" @click="expandedRow = null">×</div>
      <h3>{{ visibleLoans[expandedRow].label }}</h3>
      <p>Status: {{ visibleLoans[expandedRow].status }}</p>
      <p>Due: {{ visibleLoans[expandedRow].schedule?.next_due }}</p>
      <p>Installment: {{ formatNaira(visibleLoans[expandedRow].installment_amount_kobo / 100) }}</p>
    </div>
  </div>
</template>
