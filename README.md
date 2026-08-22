# Sycamore — Frontend Engineer Assessment, Question 1

This is a small Nuxt 4 app. It is the repayments screen from our loan operations
dashboard, cut down to one component so you can read all of it in one sitting.

**The app has bugs in it. We put them there on purpose. We are not telling you
what they are — finding them is the test.**

---

## Getting it running

You need Node 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. You should see a table of 25 loans with a search box
above it. It works. Click around for a few minutes before you read any code.

If it does not start, email us before you spend time debugging the setup. A
broken install is our problem, not yours.

---

## What is in here

```
app/
  components/RepaymentTable.vue   ← the component you are working on
  pages/index.vue                 ← just mounts the component
  assets/app.css                  ← plain styling, ignore it
server/
  api/                            ← mock API, already written for you
  utils/data.ts                   ← the 25 seed loans
```

You do not have to build an API. You do not have to design anything. You do not
have to make it pretty.

---

## About the mock API

The `server/` folder is finished and correct. Please read it, because you cannot
diagnose the frontend without knowing what the backend actually returns, but you
should not need to change it.

Three things in there look odd and are deliberate:

- **`/api/loans` responds slower for shorter search terms.** A two-letter search
  matches more rows, so it scans more. This is realistic and it is not a bug.
- **`/api/loans/:id/schedule` takes about 150ms every time.** That is what a real
  per-row lookup costs.
- **`/api/loans/:id/repay` fails roughly 25% of the time with a 502.** This is so
  that failure handling is observable. It is not a bug.

Money is returned as **integer kobo** in `amount_kobo`. 100 kobo = ₦1. This is
how our real API does it, and it matters.

---

## What ops reported

These are the three complaints that came in from the operations team over about
three weeks. They are all real, and the causes are all in the frontend.

1. **"The page gets slow after a while."** People leave this screen open all day.
   By the afternoon it is sluggish and the fans are running.
2. **"I clicked one row and it showed me somebody else's loan."** Intermittent.
   Seems to happen more when someone has been searching.
3. **"The outstanding total at the top is wrong."** Finance says the real figure
   is ₦3,511,152.18. The screen says something else. Ops also mentioned that the
   number at the top "doesn't look like the numbers in the table."

There are **other problems in the component that nobody has complained about
yet.** Some of them are more serious than the three above. Finding those is worth
more marks than fixing the three you have been handed.

---

## What to hand in

1. Your fixes, committed to a Git repo.
2. A file called `FINDINGS.md` at the root, using the format below.

### FINDINGS.md format

Use exactly these three sections. Keep it tight — we would rather read one clear
page than five padded ones.

```markdown
## Bugs I found and fixed

### 1. [One-line description of the bug]
- **Severity:** Critical / High / Medium / Low
- **Who it hurts and how:** ...
- **Cause:** ...
- **My fix:** ...

### 2. ...

## Things I noticed but deliberately did not fix
### [What it is]
- **Why I left it:** ...

## Where I used AI
- Which tool, what I asked it for
- At least one place where its answer was wrong or I rejected it, and why
```

**Order the bug list by how much damage each one does to a real user — not by
where it appears in the file.** How you rank them tells us more than how many you
find.

---

## Rules

- **Only change `app/components/RepaymentTable.vue`.** If you genuinely need to
  touch another file, that is fine — just say which and why in `FINDINGS.md`.
- **Do not rewrite the component from scratch.** Working inside code you did not
  write is most of this job. A rewrite scores zero on this question even if the
  result is excellent. This is a deliberate rule, not an oversight.
- **Do not restyle it.** Visual polish earns no marks here.
- **Do not change the mock API to work around a frontend problem** without saying
  so and defending it.
- **Keep the component's props and its rendered information the same.** Same
  columns, same modal contents.
- **Commit as you go, one commit per bug or per closely related group.** Write
  commit messages that say what and why. A single "initial commit" with
  everything in it loses marks.
- **At least one thing in this file looks like a bug and is not.** Calling it out
  in the "deliberately did not fix" section, with your reasoning, earns marks.
  "Fixing" it loses marks.

---

## How long this should take

About three to four hours. If you are past six, stop, submit what you have, and
write down in `FINDINGS.md` what you would have done next. Knowing when to stop is
part of what we are assessing.

## Marks

| | |
|---|---|
| Bugs correctly identified | 14 |
| Quality of the fixes | 10 |
| Severity ranking and reasoning | 8 |
| Restraint — what you left alone, and why | 5 |
| Commit history and readability of the diff | 3 |
| **Total** | **40** |
