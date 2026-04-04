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
**Direction:** Listeneinkaufspreis (LEP) → Bruttoverkaufspreis (BVP)
**Schema:**
```text
LEP brutto
  - Umsatzsteuer (19%)
  = LEP netto
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
  = Bruttoverkaufspreis (BVP)
```

**Sample values for generator:**
- LEP brutto: €50-1500
- Rabatt: 5-20%
- Skonto: 2-5%
- Bezugskosten: €5-100 (flat or per unit)
- Handlungskosten: 25-60%
- Gewinnzuschlag: 8-25%
- Kundenskonto: 2-4%
- Kundenrabatt: 5-15%

#### 2. Rückwärtskalkulation (Backward/Reverse Calculation)
**Purpose:** Find maximum purchase price given market selling price
**Direction:** BVP → LEP (reverse of forward)
**Use case:** When competitor's price is known, calculate max allowable cost

**Schema (reverse):**
```text
BVP
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
  + Umsatzsteuer
  = LEP brutto
```

**Key insight:** In reverse calc, percentages divide instead of multiply:
- Rabatt/Skonto: `value = current / (1 + rate)`
- Instead of: `value = current * rate`

#### 3. Differenzkalkulation (Difference Calculation)
**Purpose:** Both LEP and BVP are known, calculate if product is worth selling
**Direction:** Both ends toward middle
**Shows:** Whether product generates profit/loss

#### 4. Handelskalkulation Combined
Mix of all three types, random selection of which intermediate values to hide

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
