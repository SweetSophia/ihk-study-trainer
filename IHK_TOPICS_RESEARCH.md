# IHK Study Trainer - Topic Research Notes

## Status: Research Complete (2026-04-01)

---

## 📋 HANDELSKALKULATION (Priority: High for initial implementation)

### Topic Overview
Handelskalkulation is a core business math topic in IHK exams for IT specialists.
Uses percentage-based calculations with simple operators (+, -, *, /).
**Server load: LOW** (math-based, no AI needed for validation)

### Sub-topics

#### 1. Vorwärtskalkulation (Forward Calculation)
**Purpose:** Calculate selling price from supplier price
**Direction:** Listeneinkaufspreis (LEP, netto) → Bruttoverkaufspreis (Brutto-VK)
**Implemented teaching model:** All purchase and cost values exclude VAT. VAT appears only at the Netto-VK ↔ Brutto-VK boundary. Round each new monetary row commercially to cents and use those displayed cents in subsequent rows.
**Schema:**
```text
LEP netto
  - Lieferantenrabatt (%)
  = Zieleinkaufspreis (ZEP)
  - Lieferskonto (%)
  = Bareinkaufspreis (BEP)
  + Bezugskosten
  = Bezugspreis (BP) / Einstandspreis
  + Handlungskosten (%)
  = Selbstkosten
  + Gewinnzuschlag (%)
  = Barverkaufspreis (BVP)
  + Kundenskonto (%)
  = Zielverkaufspreis (ZVP)
  + Kundenrabatt (%)
  = Nettoverkaufspreis
  + Umsatzsteuer (19%)
  = Bruttoverkaufspreis (Brutto-VK)
```

**Sample values for generator:**
- LEP netto: €100-1500
- Rabatt: 5-20%
- Lieferskonto: 1-4%
- Bezugskosten: €5-80
- Handlungskosten: 25-60%
- Gewinnzuschlag: 8-25%
- Kundenskonto: 2-5%
- Kundenrabatt: 5-20%

#### 2. Rückwärtskalkulation (Backward/Reverse Calculation)
**Purpose:** Find maximum purchase price given market selling price
**Direction:** Brutto-VK → LEP netto (reverse of forward)
**Use case:** When competitor's price is known, calculate max allowable cost

**Schema (reverse):**
```text
Brutto-VK
  - Umsatzsteuer
  = Nettoverkaufspreis
  - Kundenrabatt
  = Zielverkaufspreis
  - Kundenskonto
  = Barverkaufspreis
  - Gewinnzuschlag
  = Selbstkosten
  - Handlungskosten
  = Bezugspreis
  - Bezugskosten
  = Bareinkaufspreis
  + Lieferskonto
  = Zieleinkaufspreis
  + Lieferantenrabatt
  = LEP netto
```

**Percentage bases and reverse factors** (`p` is a percentage, e.g. 19):
- Reverse VAT, profit or handling markup: `base = total / (1 + p / 100)`; derive the markup amount as `total - base`.
- Recover a price before supplier Rabatt/Skonto: `base = remaining / (1 - p / 100)`; derive the deduction amount as `base - remaining`.
- In the forward sales chain, recover ZVP from BVP and Netto-VK from ZVP with that same discount divisor, because customer deductions refer to the higher price.
- In the backward sales chain, calculate customer Rabatt/Skonto as `higherPrice * p / 100`, round the deduction to cents, and subtract it.
- Round every newly calculated amount/base to cents before deriving the complementary sum/difference. Do not apply purchase VAT conversion after recovering LEP netto.

#### 3. Differenzkalkulation (Difference Calculation)
**Purpose:** Compare the calculated Brutto-VK with a given gross market price, starting from a given LEP netto.
**Direction:** Full forward chain from the given LEP netto and shared backward chain from Markt-Brutto-VK.
**Shows:** Markt-Brutto-VK minus calculated Brutto-VK (Gewinnspielraum/Unterdeckung under the stated assumptions). The market-derived backward LEP netto is the purchase price compatible with the market price and the assumed markups/deductions; it can differ from the given forward LEP. This gross sale-price difference is not a separate calculation of realized profit.

#### 4. Handelskalkulation Combined
The combined trainer randomly selects forward, backward or Differenz calculation and asks for the corresponding intermediate and final values. Dedicated forward/backward trainers retain their own modes.

### Question Types for Kalkulation
1. **fillBlank:** Complete missing step(s) in schema (most common)
2. **multipleChoice:** Identify correct intermediate value / formula
3. **matching:** Match terms to definitions (LEP, ZEP, BEP, BP, etc.)

### Sources
- https://www.lernnetz24.de/km/hinweise/26.html (detailed step-by-step)
- https://prozubi.de/blog/2016/04/17/pruefungsaufgabe-vorwaertskalkulation
- https://prozubi.de/blog/2015/12/02/pruefungsauftabe-rueckwaertskalkulation-rechnen
- https://studyflix.de/wirtschaft/handelskalkulation-1470
- https://www.schule-arbeitsblaetter.de/kaufmaennische-ausbildung/preiskalkulation/

---

## 🔜 NEXT PRIORITY TOPICS (for later implementation)

### Business Math

| Topic | Complexity | AI Needed | Notes |
|-------|-----------|-----------|-------|
| Zinsrechnung (Interest) | Low | No | Principal, rate, time; Simple & compound |
| Dreisatz (Rule of Three) | Low | No | Direct & indirect proportionality |
| Prozentrechnung | Low | No | Foundation for all above |
| Gewinn-Verlust-Rechnung | Low | No | Simple profit/loss |

### IT Topics (FISI/FIAE)

| Topic | Complexity | AI Needed | Notes |
|-------|-----------|-----------|-------|
| Subnetting | Medium | No | IPv4 CIDR, network/host bits |
| OSI Modell | Low | No | 7 layers, protocols per layer |
| UML Diagramme | Medium | Partial | Class, sequence, activity diagrams |
| SQL Grundlagen | Medium | No | SELECT, INSERT, UPDATE, JOIN |
| BPMN | Medium | Partial | Process modeling notation |

### Lower Priority / Complex
- Cloud Computing (already implemented ✓)
- Linux Commands (already implemented ✓)
- Programming Algorithms (requires code execution sandbox)
- Project Management (Gantt, Netzplan)

---

## 📁 Implementation Files
Generator location: `src/app/lib/generators/math.ts` (or create new `handelskalkulation.ts`)

## ✅ Validation Approach
- All calculations use simple arithmetic - easy to validate server-side
- Round to 2 decimal places (standard for €)
- No floating-point issues if using integers (cents) internally
