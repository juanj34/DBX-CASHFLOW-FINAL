
## What’s actually going wrong (root cause)

### 1) Snapshot: the “Post‑Handover Coverage” card is not showing
`src/components/roi/snapshot/CompactPostHandoverCard.tsx` currently does this:

- if `!inputs.hasPostHandoverPlan` → hide
- if `!inputs.postHandoverPayments?.length` → hide

But in your current quotes, **`postHandoverPayments` is empty** (as shown in the request payload), and post-handover installments are instead **embedded inside `additionalPayments`** (months that fall on/after handover). So the card always returns `null`, even though you do have post‑handover installments.

### 2) Cashflow: you don’t see “handover quarter” emphasis (green) on “The Journey”
We added highlighting in `PaymentBreakdown.tsx` (Cashflow uses this), but you’re expecting something more obvious and consistent:

- Strong emphasis on the **three months of the delivery quarter (e.g. Jul/Aug/Sep)**.
- Visible not only as a tiny badge, but also **as a highlighted “zone” / band** in the timeline and/or clear emphasis in the list.

Also, the **PaymentHorizontalTimeline has a bug**:
- It sets `isPostHandover` as `positionPercent > 100`, but it caps `positionPercent` to 100, so it effectively never becomes post-handover.
- It does not explicitly highlight the *handover quarter range* (a 3‑month band).

So even if the list row highlight exists, the most “visual” part (timeline) is not emphasizing delivery quarter.

---

## Goals (what you asked for)
1) Cashflow: “show me with emphasis the months of the quarter the project is delivered on”
- We will add **very visible delivery-quarter highlighting** in the cashflow payment timeline and ensure the list clearly marks those months.
2) Snapshot: “I don’t see the card that tells me if rent covers post-handover payments”
- We will make the Snapshot card work **like mortgage**: always compute from actual schedule data (fallback to deriving from `additionalPayments` if `postHandoverPayments` is empty).

---

## Implementation Plan (code changes)

### A) Fix Snapshot: Post‑Handover Coverage card should render and compute correctly
**File:** `src/components/roi/snapshot/CompactPostHandoverCard.tsx`

**Change:**
- Replace the strict dependency on `inputs.postHandoverPayments` with:
  1) Prefer `inputs.postHandoverPayments` if present (backward compatible)
  2) Else derive post-handover payments from `inputs.additionalPayments`:
     - Take only `type === 'time'`
     - Convert `triggerValue` → calendar date using booking month/year
     - Include those that are `>=` handover quarter start month (same logic as Snapshot payment table uses via `isPaymentPostHandover`)
- Only `return null` if the derived list is empty.

**Outcome:**
- The Snapshot sidebar will show the card whenever `hasPostHandoverPlan` is true and there are post-handover installments embedded in `additionalPayments`.

---

### B) Fix Snapshot: ensure handover-quarter highlighting appears even when post-handover plan is ON
**File:** `src/components/roi/snapshot/CompactPaymentTable.tsx`

**Problem in current code:**
- “The Journey” section already highlights `isHandoverQuarter`.
- The “Post‑Handover Installments” section currently does **not** apply the same highlighting (it renders plain rows).

**Change:**
- In the `derivedPostHandoverPayments.map(...)` section:
  - Compute `isHandoverQuarter` using the existing `isPaymentInHandoverQuarter(...)`
  - Apply the same green background + left border + “Handover” badge.
  - This makes delivery-quarter payments stand out regardless of section.

**Outcome:**
- With post-handover enabled, if months in the delivery quarter are categorized as post-handover, they still get the green emphasis.

---

### C) Cashflow: add a strong “Delivery Quarter” emphasis in the horizontal timeline
**File:** `src/components/roi/PaymentHorizontalTimeline.tsx`

**Changes:**

1) **Fix post-handover detection**
- Replace:
  - `const isPostHandover = positionPercent > 100;`
- With:
  - `const isPostHandover = monthsFromBooking > totalMonths;`
- Keep `positionPercent` capped for placement, but preserve the post-handover classification for color/badge/tooltip.

2) **Add a delivery-quarter band (high emphasis)**
- Compute start/end of handover quarter in months-from-booking terms:
  - Determine handover quarter start month index: `(handoverQuarter - 1) * 3 + 1` (month number in year)
  - Convert that to a booking-relative month offset range:
    - `handoverQuarterStartOffset` (first month of quarter relative to booking)
    - `handoverQuarterEndOffset` (third month of quarter relative to booking)
- Convert those offsets to % positions on timeline:
  - `startPercent = (handoverQuarterStartOffset / totalMonths) * 100`
  - `endPercent = (handoverQuarterEndOffset / totalMonths) * 100`
- Render an absolute positioned “band” behind the track:
  - A translucent green gradient region on the track for the delivery quarter.
  - Label: “Delivery Quarter” / translated equivalent (optional), with “Qx YYYY”.

3) **Add per-marker highlight when marker month falls inside delivery quarter**
- Add `isInDeliveryQuarter` boolean to each payment marker based on its computed calendar month/quarter.
- If true, give the marker:
  - green ring / glow and/or green border override
  - and a small “🔑 Delivery”/Key icon label in tooltip

**Outcome:**
- In Cashflow, the delivery quarter becomes unmistakable:
  - Users see a highlighted band on the timeline plus highlighted markers that fall within that quarter.

---

### D) Cashflow: make sure “The Journey” list emphasis is unmistakable
**File:** `src/components/roi/PaymentBreakdown.tsx`

You already have per-row green highlight for `inHandoverQuarter`, but users still report not seeing it. We’ll make it more obvious and resilient:

**Changes:**
1) Increase visual contrast of highlight:
- Stronger border + slightly stronger background (still premium/minimal):
  - e.g. `bg-green-500/15` + `border-l-4` + subtle glow ring

2) Add an explicit “Delivery Quarter” mini-divider inside The Journey list:
- When iterating `sortedAdditionalPayments`, detect the first payment that falls within the delivery quarter and render a small divider label above it:
  - “Delivery Quarter (Qx YYYY)”
- This ensures even if the green background blends, the label makes it clear.

**Outcome:**
- The Journey section will clearly call out the delivery quarter months even at a glance.

---

## Verification checklist (what we’ll test after implementing)
1) Cashflow route `/cashflow/:token`:
- Timeline shows a green “Delivery Quarter” band at the correct location.
- Payments in Jul/Aug/Sep of delivery year get emphasized markers.
- The Journey list shows the same months with strong green highlight and “Handover” badge.

2) Snapshot view:
- Post-Handover Coverage card appears when:
  - `hasPostHandoverPlan = true`
  - post-handover installments exist either in `postHandoverPayments` OR derived from `additionalPayments`.
- Post-Handover installment rows that fall in the delivery quarter show the same green emphasis.

---

## Files we will modify
- `src/components/roi/snapshot/CompactPostHandoverCard.tsx` (derive payments fallback; stop hiding when postHandoverPayments is empty)
- `src/components/roi/snapshot/CompactPaymentTable.tsx` (apply handover-quarter highlight in Post-HO section too)
- `src/components/roi/PaymentHorizontalTimeline.tsx` (fix post-HO detection; add delivery-quarter band + marker emphasis)
- `src/components/roi/PaymentBreakdown.tsx` (increase highlight emphasis + add delivery-quarter divider label)

---

## Notes / compatibility
- No backend changes required.
- Backward compatible with older quotes that do populate `postHandoverPayments`.
- Keeps existing theme system and premium minimal UI style intact.
