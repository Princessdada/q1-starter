# FINDINGS — Question 1

**Candidate:** Princess Dada  
**Time spent:** 4 hours  
**Repo:** commit history documents each fix individually; see `git log`.

---

## Bugs I found and fixed

### 1. Unhandled payment processor failures (502), race conditions, and lack of loading states
- **Severity:** Critical
- **Who it hurts and how:** Ops team and customers. When `/api/loans/:id/repay` fails (with a 502), no error is caught or shown. The operator is left unsure whether the payment went through. Without button disabling, rapid clicks trigger duplicate repayment requests.
- **Cause:** Lines 60–63 (`pay` function) called `$fetch` with no `try/catch`, no in-flight loading state (`payingLoanId`), and mutated a shallow copy whose state was overwritten on subsequent polls.
- **My fix:** Wrapped `pay(loan)` in `try/catch/finally`, tracked in-flight state with `payingLoanId` to disable the button and show "Paying…", displayed user-facing alerts/error banners on failure, and preserved locally paid status across 5s polls.
- **Commit:** `f5c8ff7`

### 2. Stored Cross-Site Scripting (XSS) vulnerability in loan description
- **Severity:** High
- **Who it hurts and how:** Internal operations and finance team. Malicious loan descriptions (e.g., loan `ln_05` containing `<img src=x onerror="...">`) execute arbitrary JavaScript within authenticated staff browser sessions, creating risks of session hijacking and unauthorized actions.
- **Cause:** Line 82 rendered loan descriptions using Vue's unescaped HTML directive `<td v-html="loan.description"></td>`.
- **My fix:** Replaced `v-html` with safe plain text interpolation `<td>{{ loan.description }}</td>`.
- **Commit:** `d249239`

### 3. Modal row desynchronization on search/filter and NaN installment amount
- **Severity:** High
- **Who it hurts and how:** Ops team (Ops Complaint #2). Clicking a row and then searching or filtering caused the modal to display a completely different customer's loan details. Additionally, the modal installment displayed as `₦NaN`.
- **Cause:** Line 80 and 92–98 tracked active modal row by array index (`expandedRow = i`). Filtering modified `visibleLoans` order/length, shifting indices. Line 97 also attempted to access `installment_amount_kobo` directly on `loan` instead of `loan.schedule.installment_amount_kobo`.
- **My fix:** Changed state tracking to `selectedLoanId = ref(null)` by unique loan ID with `:key="loan.id"`, derived `selectedLoan` via computed lookup, and accessed installment via `selectedLoan.schedule?.installment_amount_kobo`.
- **Commit:** `322f6e8`

### 4. Total outstanding balance sums paid loans, uses floating-point arithmetic, and lacks comma formatting
- **Severity:** Medium
- **Who it hurts and how:** Finance and Ops team (Ops Complaint #3). The top summary included paid loans in the outstanding total, suffered floating-point rounding inaccuracies, and omitted comma separators (e.g. `₦3500435.94`).
- **Cause:** Lines 40–46 summed all 25 loans regardless of status using `parseFloat(loan.amount_kobo) / 100` iteratively. Calling `.toLocaleString()` on the resulting string in `formatNaira` produced no comma separators.
- **My fix:** Filtered `loans` to exclude `status === 'paid'` loans, summed integer kobo before dividing by 100 once, and updated `formatNaira` to parse numeric values and format using `toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
- **Commit:** `c0f4bbc`

### 5. Interval/listener memory leaks, blocking N+1 schedule requests, and un-debounced search
- **Severity:** Medium
- **Who it hurts and how:** Ops team leaving the dashboard open all day (Ops Complaint #1). Causes cumulative memory leaks, runaway background timers on HMR/remount, and sluggish UI / CPU fans spinning.
- **Cause:** Lines 34–38 initiated `setInterval(loadLoans, 5000)` and `addEventListener('resize')` without cleaning them up in `onUnmounted`. Inside `loadLoans`, a sequential `for...of` loop made 25 blocking `$fetch` calls one-by-one per tick.
- **My fix:** Stored interval ID and removed it along with the resize listener in `onUnmounted()`. Replaced sequential loop with parallel `Promise.all()` fetches, prevented `isLoading` full-screen flash on background ticks, and added 300ms debounce to filter watching.
- **Commit:** `1918ea1`

---

## Things I noticed but deliberately did not fix

### 1. `expandedRow !== null` check in modal conditional
- **Why I left it (Decoy):** While `v-if="expandedRow"` might look more concise, index `0` is falsy in JavaScript. In an index-based setup, `v-if="expandedRow"` would fail to render the modal for the first item in the list (`i = 0`). Even after migrating to ID-based selection (`v-if="selectedLoan"`), recognizing why this strict null check existed in the original code was critical.

### 2. Top-level sequential `useFetch` calls in `<script setup>`
- **Why I left it:** Lines 10–12 execute top-level `useFetch` for customer, summary, and rates. While they could theoretically be wrapped in a single combined call or parallelized, Nuxt 4's Suspense integration handles top-level `useFetch` efficiently on initial page load, and the brief explicitly cautions against rewriting setup or changing backend contracts without strong justification.

### 3. Fetching `/api/rates` at setup
- **Why I left it:** The rates endpoint is fetched on line 12 but not rendered in the template. I left the fetch intact to avoid breaking any potential prop/component contracts expected by parent wrappers while keeping the fix scoped strictly to operational bugs.

---

## A note on the finance figure

The finance figure quoted in the ops complaint was **₦3,511,152.18**.

When verifying against the 25 seed loans in `server/utils/data.ts`:
- **Sum of all 25 loans:** 368,942,759 kobo = **₦3,689,427.59**
- **Sum excluding 'paid' loans (loans `ln_10` & `ln_16`):** 350,043,594 kobo = **₦3,500,435.94**
- **Gap between unpaid total and quoted figure:** ₦10,716.24 (which does not correlate to any combination of seed loan items or rates).

The backend route `/api/customers/:id/summary` explicitly identifies `outstanding_kobo` (350,043,594 kobo = **₦3,500,435.94**) as the authoritative figure used by the finance export. I calculated the total by summing unpaid active/overdue loans in integer kobo, reconciling directly with the authoritative backend calculation.

---

## Where I used AI

- **Tool:** Antigravity (Pair Programming AI Assistant)
- **What I used it for:** 
  - Validating Nuxt 4 lifecycle and HMR timer accumulation behavior.
  - Double-checking integer kobo arithmetic and edge cases for the 25 seed loans.
  - Brainstorming severity hierarchy according to the "Damage to a real user" framework.
- **What I rejected or rewrote, and why:** 
  - I rejected an initial suggestion to alter `server/api/loans/[id]/repay.post.ts` to mutate backend seed data directly. The brief specifically instructs: *"Do not change the mock API to work around a frontend problem without saying so and defending it."* Instead, I handled state persistence and optimism directly on the frontend within `RepaymentTable.vue`.
  - I rejected rewriting the component from scratch and instead performed surgical, targeted fixes per the rubric.

---

## What I would do next

1. **Automated Component Tests:** Write Vitest + Vue Test Utils tests simulating 502 repayment errors, debounced filter queries, and modal loan ID binding.
2. **Virtualization for Scale:** If loan records expand beyond 25 to hundreds or thousands, integrate virtualized scrolling (e.g. `@tanstack/vue-virtual`) to maintain 60fps performance.
3. **Accessibility (a11y):** Add proper ARIA attributes (`role="dialog"`, `aria-modal="true"`, focus trapping) to the loan details modal.
