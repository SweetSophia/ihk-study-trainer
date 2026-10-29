# Legacy calculation core repair

Approved scope: audit M1/M2, the mixed, forward and backward existing commerce drills. No UI redesign, new task families, scoring/tolerance change, dependency/schema changes or progress migration. AP2 trainers and held PR58 stay unchanged.

## Teaching convention

All purchase prices, procurement costs and cost/sales stages are net amounts excluding VAT; VAT is added only from Netto-VK to Brutto-VK, or removed once at the start of a backward calculation. LEP is explicitly labelled netto, never gross while treated as net. Preserve all existing module IDs and answer keys.

Prices are given to two decimals. At EACH row, round the newly calculated money amount/base commercially to cents; derive the complementary sum/difference from the displayed rounded values. Subsequent rows use those rounded values. State this in the task, so the visible solution is reproducible. Existing general 5% answer tolerance is untouched; it is not a remedy for a wrong chain.

Forward: start from displayed net LEP, deduct supplier rebate/skonto, add procurement costs, add handling/profit, reverse customer skonto/rebate, add VAT. Backward: start from displayed gross sale/market price, reverse the same stages in reverse order. Share the backward routine between dedicated/mixed backward and Differenz market branch; never seed a second incompatible purchase chain from an undisclosed VAT conversion.

Differenz retains the existing two directions and gross market-price difference; both use one explicit net purchase convention. Do not change this exercise into a new profit analysis.

## Proof and delivery

Original deterministic midpoint case: Brutto-VK1710.70, VAT19%, customer rebate13%, skonto4%, profit17%, handling43%, procurement42.50, supplier skonto3%, rebate13%. Expected backward BP717.62, LEP800.00; current BP609.82 is wrong. For Differenz the displayed starting LEP800.00 must match forward LEP, rebate104.00 and ZEP696.00.

Independent integer-cent test oracle starts from displayed inputs rather than production helpers. Cover both low/high generated rate bounds, awkward cent values, forward/backward row identities, mixed/Differenz prefixes, actual validator acceptance and solution equations. Full regression/lint/types/build, local production desktop/mobile checks and independent actual-code review before every push. Ready PR, real15-minute review window after publication/every push, valid feedback fixes, bilingual assessment, normal expected-head merge and automatic production observation per user approval. No formal approval review.
