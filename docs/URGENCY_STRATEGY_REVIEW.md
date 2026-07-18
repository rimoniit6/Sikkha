# Urgency Strategy Review

> **Scope:** Validate urgency message logic before Phase 4 implementation
> **Approved implementation:** Block 7 from HERO_IMPLEMENTATION_PLAN.md
> **Config data:** homepageExam1Date, homepageExam1Name, homepageExam1DateLabel

---

## Question 1: When should the urgency message appear?

**When ALL of these conditions are true:**
1. A valid exam date is configured in `config?.homepageExam1Date`
2. The exam is in the future (daysRemaining > 0)
3. The exam is within 180 days (daysRemaining < 180)

**Rationale:** Urgency is only effective when the deadline is close enough to motivate action. 180 days (6 months) is the threshold where "preparing for an exam" shifts from "I have time" to "I should start now."

---

## Question 2: When should it be hidden?

| Condition | Hidden? | Reason |
|-----------|---------|--------|
| No exam date configured | YES | No data to show |
| Exam is > 180 days away | YES | Too far to create urgency |
| Exam has already passed | YES | Countdown would show 0 or negative |
| Exam is today | DEBATABLE | See Question 3 |

---

## Question 3: What happens after the exam date passes?

**Current logic:** `daysRemaining > 0 && daysRemaining < 180`

When the exam passes, `daysRemaining` becomes 0 or negative. The condition `daysRemaining > 0` is false → message is hidden.

**This is correct.** A countdown that reaches 0 or goes negative is meaningless. The message should disappear silently.

**Edge case:** On the exact exam day, `daysRemaining` = 0. The message is hidden. This is correct — the exam is happening NOW, not "upcoming."

---

## Question 4: What happens if there is no configured exam date?

**The urgency block is entirely hidden.** The Hero renders 6 blocks instead of 7. No visual gap, no broken layout. The spacing adjusts naturally because the urgency message has `mb-6` margin — when removed, the space above the wave simply grows.

**This is correct.** The Hero is designed to work with or without urgency.

---

## Question 5: What happens if multiple public exams exist (SSC and HSC)?

**Current implementation:** Only uses `config?.homepageExam1Date` (single exam).

**Available config fields:**
- `homepageExam1Name`, `homepageExam1Date`, `homepageExam1DateLabel`
- `homepageExam2Name`, `homepageExam2Date`, `homepageExam2DateLabel`

**Problem:** The current plan only shows ONE exam countdown. If both SSC and HSC dates are configured, only one is shown.

**Options:**
1. Show only Exam 1 (current plan) — simpler, less visual clutter
2. Show the NEAREST exam — most relevant, requires comparison logic
3. Show both exams — comprehensive but visually heavy

**Recommendation:** Option 2 — show the nearest exam. This is the most relevant to the visitor. If SSC is in 90 days and HSC is in 180 days, show SSC. If HSC is in 60 days and SSC already passed, show HSC.

---

## Question 6: Should Class 6–8 students always see an SSC countdown?

**No.** Class 6–8 students don't have board exams. An SSC countdown is irrelevant to them.

**Current behavior:** The urgency message is NOT personalized. Every visitor sees the same countdown regardless of their class.

**Impact:** A Class 6 student seeing "SSC পরীক্ষা: ১৮০ দিন বাকি" thinks: "What SSC? I'm in Class 6." This creates confusion, not urgency.

**However:** Personalizing the urgency message requires class detection logic that doesn't exist in the current Hero. Adding it would increase scope beyond the approved plan.

**Recommended approach for Phase 4:** Show the urgency message as-is (non-personalized). Accept that Class 6–8 students will see an irrelevant countdown. The countdown is still useful for SSC/HSC students (the primary exam-preparation audience).

**Future improvement:** Detect the visitor's class (from URL, cookie, or learning preference) and show class-relevant urgency. This is a separate feature.

---

## Question 7: Should the urgency message be personalized based on the selected class?

**Ideally yes, but not in Phase 4.**

Personalization would require:
1. Reading the visitor's class preference (from `useLearningPreference`)
2. Mapping class level to relevant exam (Class 6–8 → no exam; SSC → SSC exam; HSC → HSC exam)
3. Conditionally showing/hiding the countdown based on this mapping

This adds complexity and is outside the approved scope. Phase 4 should implement the basic countdown. Personalization is a future iteration.

---

## Question 8: Is the urgency message informative or manipulative?

**Informative.**

The message says: "{Exam Name}: {X} দিন বাকি — এখনই প্রস্তুতি শুরু করুন"

- It states a fact (days remaining until a real exam)
- It uses a real date (from admin configuration)
- It doesn't use fear tactics ("You'll fail if you don't start!")
- It doesn't create false urgency (the countdown is accurate)
- The CTA ("start preparation now") is helpful, not coercive

**Verdict:** This is a legitimate informational urgency signal, not a dark pattern.

---

## Question 9: Can the Hero still feel complete when no urgency is shown?

**Yes.** The Hero has 6 essential blocks that work independently:

1. Trust Badge — eliminates cost anxiety
2. Headline — promises outcome
3. Supporting Sentence — explains how
4. Feature Strip — shows content types
5. Trust Message — provides social proof
6. CTAs — invites action

Urgency is Block 7 — an amplifier, not a foundation. When hidden, the Hero feels complete because all 5 W's are answered (What, Who, How, Why, What next).

---

## Question 10: Does the countdown degrade gracefully?

**Yes.** When the urgency message is hidden:

- No visual gap appears
- No broken layout
- No error state
- No placeholder text
- The Hero simply has 6 blocks instead of 7
- The bottom wave transitions naturally to the next section

The urgency block has `mb-6 sm:mb-8` margin. When removed, the space above the wave grows slightly — this is imperceptible.

---

## State Table

| State | Visible? | Displayed Message | Reason |
|-------|----------|-------------------|--------|
| **No exam configured** | NO | (nothing) | No data to show |
| **Exam > 180 days away** | NO | (nothing) | Too far for urgency to be effective |
| **Exam 180–1 days remaining** | YES | "{Exam Name}: {X} দিন বাকি — এখনই প্রস্তুতি শুরু করুন" | Urgency window active |
| **Exam day (0 days)** | NO | (nothing) | Exam is today — countdown complete |
| **Exam passed** | NO | (nothing) | Countdown would be negative — hidden |
| **Multiple exams configured** | SHOW NEAREST | "{Nearest Exam Name}: {X} দিন বাকি — এখনই প্রস্তুতি শুরু করুন" | Most relevant exam shown |

---

## Issues Found

### Issue 1: Only one exam is shown
**Current plan:** Uses only `homepageExam1Date`.
**Problem:** If SSC (90 days) and HSC (180 days) are both configured, only one is shown.
**Fix:** Compare both dates, show the nearest one that's within the 180-day window.

### Issue 2: Class 6–8 students see irrelevant countdown
**Current plan:** No personalization.
**Problem:** Class 6–8 students don't have board exams.
**Fix:** Accept for Phase 4. Document as future improvement.

---

## Recommended Urgency Strategy (Rewrite)

### Logic

```
1. Read config?.homepageExam1Date and config?.homepageExam2Date
2. For each valid date:
   a. Calculate daysRemaining
   b. If daysRemaining > 0 AND daysRemaining < 180 → candidate
3. If no candidates → hide urgency
4. If 1+ candidates → show the NEAREST one (smallest daysRemaining)
5. Display: "{examName}: {daysRemaining} দিন বাকি — এখনই প্রস্তুতি শুরু করুন"
```

### States (Final)

| State | Visible? | Displayed Message |
|-------|----------|-------------------|
| No exam configured | NO | — |
| All exams > 180 days | NO | — |
| 1+ exams within 180 days | YES | "{Nearest Exam}: {X} দিন বাকি — এখনই প্রস্তুতি শুরু করুন" |
| All exams passed | NO | — |

### What This Strategy Handles

- Single exam configured → shows it if within 180 days
- Two exams configured → shows the nearest one
- Both exams > 180 days → hidden
- Exam passes → hidden
- No config → hidden
- SSR safe → server renders hidden, client calculates in useEffect

### What This Strategy Does NOT Handle (Future)

- Class-based personalization (Class 6–8 see no countdown)
- Multiple countdowns shown simultaneously
- Exam date changes mid-countdown (rare, admin updates config)

---

*The urgency strategy is sound for Phase 4. The main refinement is showing the NEAREST exam instead of only Exam 1. This requires comparing two dates — a trivial addition to the logic.*
