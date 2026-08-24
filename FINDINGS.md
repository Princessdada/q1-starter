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

### 2. Outstanding total is scoped to the filtered list, counts paid loans, and loses precision
- **Severity:** High
- **Who it hurts and how:** Finance and Ops (Ops Complaint #3). The header figure reads as a page-level total but was silently re-scoped to whatever the operator had typed, so it shrank as they searched — finance could take a number off this screen that was only ever a subtotal. It also counted paid loans, accumulated floating-point error, and rendered without separators (`₦3500435.94`), which is the "doesn't look like the numbers in the table" half of the complaint.
- **Cause:** `/api/loans` applies `search` and `status` server-side, so `loans.value` only ever held the filtered subset — yet lines 40–46 reduced over it, dividing each loan by 100 before summing rather than summing integer kobo once. `summary.outstanding_kobo` was fetched at line 11 and never read. `formatNaira` called `.toLocaleString()` on a string, which resolves to `String.prototype.toLocaleString` and ignores the options object entirely.
- **My fix:** The total now comes from `summary.outstanding_kobo`, which the server computes over the full loan set in integer kobo and documents as the figure the finance export uses. Because `/api/loans/:id/repay` acknowledges a payment without persisting it, loans paid during the session are still inside that figure, so `locallyPaid` was widened from a `Set` of ids to a `Map` of id → `amount_kobo` and those amounts are subtracted — the amount is captured at payment time so the subtraction survives the row being filtered out of view. `formatNaira` now coerces to `Number` before formatting.
- **Commits:** `c0f4bbc`, `dffba6c`

### 3. Stored Cross-Site Scripting (XSS) vulnerability in loan description
- **Severity:** High
- **Who it hurts and how:** Internal operations and finance team. Malicious loan descriptions (e.g., loan `ln_05` containing `<img src=x onerror="...">`) execute arbitrary JavaScript within authenticated staff browser sessions, creating risks of session hijacking and unauthorized actions.
- **Cause:** Line 82 rendered loan descriptions using Vue's unescaped HTML directive `<td v-html="loan.description"></td>`.
- **My fix:** Replaced `v-html` with safe plain text interpolation `<td>{{ loan.description }}</td>`.
- **Commit:** `d249239`

### 4. Modal row desynchronization on search/filter and NaN installment amount
- **Severity:** High
- **Who it hurts and how:** Ops team (Ops Complaint #2). Clicking a row and then searching or filtering caused the modal to display a completely different customer's loan details. Additionally, the modal installment displayed as `₦NaN`.
- **Cause:** Line 80 and 92–98 tracked active modal row by array index (`expandedRow = i`). Filtering modified `visibleLoans` order/length, shifting indices. Line 97 also attempted to access `installment_amount_kobo` directly on `loan` instead of `loan.schedule.installment_amount_kobo`.
- **My fix:** Changed state tracking to `selectedLoanId = ref(null)` by unique loan ID with `:key="loan.id"`, derived `selectedLoan` via computed lookup, and accessed installment via `selectedLoan.schedule?.installment_amount_kobo`.
- **Commit:** `322f6e8`

### 5. Stale search responses overwrite fresher ones
- **Severity:** High
- **Who it hurts and how:** Ops team (Ops Complaint #2 — "seems to happen more when someone has been searching"). The table could show results for a search term the operator had already moved on from, while the search box displayed something else. Unlike the modal bug this leaves no visible clue: the rows look like a legitimate result set.
- **Cause:** `loadLoans` assigned to `loans.value` unconditionally on resolve. `/api/loans` is deliberately slower for shorter search terms, so a broad earlier request routinely resolves *after* a narrower later one — typing `a` then `d` issues requests delayed ~760ms and ~620ms respectively, and the first one lands last. The 5s poll compounds it: a poll issued before a filter change carries the old filters and can land after the new results. Debouncing changes when a request *starts*, not the order responses *arrive*, so it narrows the window without closing it.
- **My fix:** Each call takes a sequence number from a module-level counter; a response may only write to `loans.value` if its call is still the newest. The `isLoading` reset is guarded the same way, so a late superseded response cannot clear the spinner while its replacement is still in flight.
- **Commit:** `c5e0d63`

### 6. Interval/listener memory leaks, blocking N+1 schedule requests, and un-debounced search
- **Severity:** Medium
- **Who it hurts and how:** Ops team leaving the dashboard open all day (Ops Complaint #1). Causes cumulative memory leaks, runaway background timers on HMR/remount, and sluggish UI / CPU fans spinning.
- **Cause:** Lines 34–38 initiated `setInterval(loadLoans, 5000)` and `addEventListener('resize')` without cleaning them up in `onUnmounted`. Inside `loadLoans`, a sequential `for...of` loop made 25 blocking `$fetch` calls one-by-one per tick.
- **My fix:** Stored interval ID and removed it along with the resize listener in `onUnmounted()`. Replaced sequential loop with parallel `Promise.all()` fetches, prevented `isLoading` full-screen flash on background ticks, and added 300ms debounce to filter watching.
- **Commit:** `1918ea1`

---

## Things I noticed but deliberately did not fix

### 1. The strict `!== null` comparison guarding the modal
- **Why I left it (the decoy):** It looks like needless verbosity — `v-if="expandedRow"` is shorter and appears to read the same. It does not: index `0` is falsy, so the shortened form silently fails to open the modal for the first row in the table. When I moved selection from array index to loan id I deliberately preserved those semantics (`selectedLoanId = ref(null)`, `v-if="selectedLoan"`) rather than "simplifying" the check away.

### 2. Top-level sequential `useFetch` calls in `<script setup>`
- **Why I left it:** Lines 10–12 execute top-level `useFetch` for customer, summary, and rates. They could be parallelised, but Nuxt 4 resolves top-level `useFetch` through Suspense on the initial render, this is a one-off cost on page load rather than the per-tick cost driving Ops Complaint #1, and unpicking it means restructuring setup — which is exactly the kind of change the brief warns against making without a strong reason.

### 3. The unused `/api/rates` fetch
- **Why I left it:** It is dead weight — one request on every page load whose result is never read. I left it because an unused fetch sitting alongside two used ones reads like scaffolding for work in progress, and quietly deleting a teammate's half-finished feature on a bug-fix branch is not my call. I would raise it in review. If it is genuinely orphaned, removing it is a one-line win.

### 4. `overdueCount` has the same filter-scope problem as the outstanding total
- **Why I left it:** It reduces over `loans.value`, so like the total it is scoped to the current search rather than to the page. I could not fix it the same way: `/api/customers/:id/summary` exposes `open_loans` but no overdue count, and `/api/loans` cannot be asked for an unfiltered set alongside a filtered one without a second round trip on every keystroke — which would work against the fix in commit `1918ea1`. Rather than add a request per keystroke, or change the mock API to suit the frontend, I left it and would ask the backend for an `overdue_count` field on the summary endpoint.

### 5. The N+1 schedule fetch is parallel, but still N+1
- **Why I left it:** Every poll still issues 25 concurrent `/api/loans/:id/schedule` requests, one per row. `Promise.all` removed the blocking, not the request count. Collapsing it properly needs a batch endpoint that does not exist, and the README states the ~150ms per-row lookup is realistic and intended. At 25 rows this is acceptable; at 500 it would not be, and that is the point at which I would ask for the batch route.

---

## A note on the finance figure

The figure quoted in the ops complaint was **₦3,511,152.18**.

Checking it against the 25 seed loans in `server/utils/data.ts`:
- **Sum of all 25 loans:** 368,942,759 kobo = **₦3,689,427.59**
- **Sum excluding 'paid' loans:** 350,043,594 kobo = **₦3,500,435.94**
- **Gap between the unpaid total and the quoted figure:** ₦10,716.24, which does not correspond to any subset of the seed loans or to the rates returned by `/api/rates`.

I could not derive the quoted number from the data, so I did not tune the UI to hit it. `/api/customers/:id/summary` computes `outstanding_kobo` in integer kobo over the full loan set and its own comment identifies it as the figure the finance export uses, so I took the header total from there and cross-checked that it agrees with my own sum of the unpaid loans (350,043,594 kobo). If finance is genuinely seeing ₦3,511,152.18, the discrepancy is upstream of this screen and I would raise it against the export rather than the dashboard.

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

1. **Automated Component Tests:** Write Vitest + Vue Test Utils tests simulating 502 repayment errors, out-of-order search responses, and modal loan ID binding.
2. **Virtualization for Scale:** If loan records expand beyond 25 to hundreds or thousands, integrate virtualized scrolling (e.g. `@tanstack/vue-virtual`) to maintain 60fps performance — and request the batch schedule endpoint noted above.
3. **Accessibility (a11y):** Add proper ARIA attributes (`role="dialog"`, `aria-modal="true"`, focus trapping) to the loan details modal, and make the table rows keyboard-activatable rather than click-only.
