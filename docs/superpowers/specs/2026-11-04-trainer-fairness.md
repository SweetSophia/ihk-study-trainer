# Fair cable selection and unambiguous knowledge questions

## Scope
Preserve module IDs, persisted history, AP2 scenarios, ordinary attempt/reveal behavior and all numerical tolerances. Repair confirmed ambiguity rather than broadly accepting stronger-looking answers. No dependencies or storage changes. PR #58 is held.

Cable selection uses an explicit Ethernet teaching catalogue: suitable optics/endpoints and outdoor installation are available; no PoE, price preference or media converters. Cat 6 at 10 Gbit/s is assumed installation-tested through 55 m, not guaranteed by its category alone. Copper shielding is stated for the supplied variants. Use speed-specific reach: Cat 5e 1G/100m; Cat 6 1G/100m and tested 10G/55m; Cat 6a/7 1G and 10G/100m; MMF with supplied SX optics 1G/550m and SR optics 10G/300m (conservative common OM3/OM4 profile); OS2 with supplied LX/LR optics 1G (LX/LH)/10G (LR)/10km. RG-6 without a converter is not eligible for this direct Ethernet link. Unknown rates or impossible ranges must not produce an incapable fallback.

Accept every listed eligible cable, then require exactly two distinct properties belonging to that selection, explicitly for the required scenario rate and distance. Rate/reach properties use the scenario's matched rate profile; shared true properties are accepted for every applicable medium. Copper shielding is distinguished from fibre EMI immunity. Choices and validation share one session-local contract; all catalogue advantages remain visible as distractors and unsuitable media can be submitted and graded wrong; changing medium clears its old reason selections. The example is one recommendation, not the sole valid solution. Show catalogue assumptions before checking.

RAID asks for the guaranteed number of arbitrary simultaneous failures before rebuild, without hot spares. RAID 10 uses mirror pairs: one arbitrary failure guaranteed; two in one pair fail; one per pair can survive but is not a general guarantee. Keep all capacity and tolerance values unchanged.

Qualify HTTPS transport questions to HTTP/1.1 or HTTP/2 over TLS/TCP and explain HTTP/3/QUIC separately. Reserved Instances teach term commitment and optional payment schedules; distinguish regional from zonal capacity reservation.

## Deferred money policy decision
Current ordinary numeric tolerance is ±5%; exact-zero stays exact. Proposed separate policy for the three pure calculation modules: compare cent amounts under their explicit row-by-row commercial rounding, accept decimal comma/point representations, retain other modules' measurement tolerance. Whether to allow a one-cent margin or follow-through credit is a pedagogical decision. No implementation here until settled.

## Evidence
- Fluke: https://www.flukenetworks.com/knowledge-base/applicationstandards-articles-copper/10gbase-t-field-testing-requirements (Cat 6 conditional reach / alien crosstalk)
- Cisco: https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/data_sheet_c78-455693.html (10G SR/LR optics)
- Cisco: https://www.cisco.com/site/us/en/products/networking/interfaces-modules/1000base-sx-sfp/index.html (supplied SX profile)
- IBM: https://www.ibm.com/docs/POWER7/p7ebk/recover_ten_multiple.htm (mirror-pair failure)
- IETF: https://www.rfc-editor.org/rfc/rfc9114.html#section-3.1
- AWS: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-reserved-instances.html and https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/reserved-instances-scope.html

## Bounded audit limits
An independent sample found no further confirmed defect in tested unit/base conversion, aggregation/subnetting, AP2 network allocation or SQL grading. This is not exhaustive review of every generated SQL question or knowledge-bank assertion. Live account persistence and actual screenreader/device testing are outside this package.
