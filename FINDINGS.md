<!--
=============================================================================
SCRATCH — DELETE THIS ENTIRE COMMENT BLOCK BEFORE SUBMITTING
=============================================================================

TRIAGE CHECKLIST (line numbers only — the diagnosis is yours to write)

  script block
  [ ] line 8         lastSyncedAt initialised at setup
  [ ] lines 10-12    three sequential awaits
  [ ] line 11        summary — is it used anywhere?
  [ ] line 12        rates — is it used anywhere?
  [ ] line 16        $fetch, no cancellation, no try/catch
  [ ] lines 19-21    for...of with await inside
  [ ] line 24        isLoading reset — reachable on every path?
  [ ] lines 27-30    handleResize / isNarrow — consumed anywhere?
  [ ] line 32        watch — fires how often?
  [ ] line 36        setInterval — return value discarded
  [ ] line 37        addEventListener — ever removed?
  [ ] lines 40-46    totalOutstanding
  [ ] lines 48-50    overdueCount
  [ ] lines 52-54    visibleLoans — spread copies
  [ ] lines 56-58    formatNaira — type sensitivity
  [ ] lines 60-63    pay

  template
  [ ] line 71        formatNaira(totalOutstanding)
  [ ] line 74        v-model, no debounce
  [ ] line 76        v-if isLoading, no v-else, no empty state
  [ ] line 80        :key="i" + expandedRow = i
  [ ] line 82        v-html
  [ ] line 83        decimal padding
  [ ] line 86        <div> not <button>, pay(copy)
  [ ] line 92        expandedRow !== null   <-- decoy candidate, do NOT "fix"
  [ ] lines 94-97    unguarded index access
  [ ] line 97        installment_amount_kobo property path

ORDERING RULE (from the brief): rank by DAMAGE TO A REAL USER, not by line
number and not by how clever the bug is. A useful tiebreaker ladder:

  1. wrong money / lost money      (finance acts on it, or a payment vanishes)
  2. security                      (executes attacker code in an authed session)
  3. wrong data shown as right     (user acts on the wrong customer)
  4. crashes / dead UI             (user is blocked, but knows they are)
  5. performance / resource leak   (annoying, degrades over hours)
  6. cosmetic / formatting         (noticed, not acted on)

Be ready to DEFEND the order out loud. They mark the reasoning, not the list.

=============================================================================
-->

# FINDINGS — Question 1

**Candidate:** <your name>
**Time spent:** <hours>
**Repo:** commit history documents each fix individually; see `git log`.

---

## Bugs I found and fixed

<!--
Ordered by damage to a real user, most damaging first.
Use the README's exact per-bug format. Keep each one to ~5 lines.
Reference line numbers from the ORIGINAL file so the reviewer can follow.
-->

### 1. [One-line description]
- **Severity:** Critical / High / Medium / Low
- **Who it hurts and how:**
- **Cause:**
- **My fix:**
- **Commit:** `<sha>`

### 2. [One-line description]
- **Severity:**
- **Who it hurts and how:**
- **Cause:**
- **My fix:**
- **Commit:** `<sha>`

### 3. [One-line description]
- **Severity:**
- **Who it hurts and how:**
- **Cause:**
- **My fix:**
- **Commit:** `<sha>`

### 4. [One-line description]
- **Severity:**
- **Who it hurts and how:**
- **Cause:**
- **My fix:**
- **Commit:** `<sha>`

### 5. [One-line description]
- **Severity:**
- **Who it hurts and how:**
- **Cause:**
- **My fix:**
- **Commit:** `<sha>`

<!-- add or remove numbered entries as needed -->

---

## Things I noticed but deliberately did not fix

<!--
At least two. This section carries real marks — it is not filler.
Aim for a mix:
  - the decoy (something that looks wrong and is correct)
  - something real but out of scope, where fixing it would break a stated rule
  - something real but not worth the risk/effort inside the time budget
For each, say what you would do if it were your call and you had more time.
-->

### [What it is]
- **Why I left it:**

### [What it is]
- **Why I left it:**

### [What it is]
- **Why I left it:**

---

## A note on the finance figure

<!--
Replace this comment with your own words if you agree with the finding.
Verify the arithmetic yourself before you assert it — do not take it on trust.

  Sum of all 25 loans           = 368,942,759 kobo = N3,689,427.59
  Sum excluding 'paid' (23)     = 350,043,594 kobo = N3,500,435.94
  Figure quoted in the brief    =                    N3,511,152.18

  Neither total reconciles with the quoted figure; the gap is N10,716.24
  and does not correspond to any subset of the seed data or to the rates
  returned by /api/rates.

  /api/customers/:id/summary marks outstanding_kobo as the authoritative
  figure ("the finance export uses this"), so I used that field rather
  than tuning the UI to match a target number I could not derive.
-->

---

## Where I used AI

<!--
Be specific and be honest. Name the tool, what you asked for, and at least
one place you rejected or rewrote its output and why.
Vague entries ("used AI for help") score nothing.
-->

- **Tool:**
- **What I used it for:**
- **What I rejected or rewrote, and why:**

---

## What I would do next

<!--
If you ran out of time, say what remains and why you stopped.
The brief explicitly says knowing when to stop is part of the assessment.
-->
