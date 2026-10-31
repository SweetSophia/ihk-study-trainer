# Exercise labels and RAID semantics

Approved scope: polish existing headings, unit controls and RAID explanations without changing exercises, grading, IDs or persistence. The autonomous workflow waives routine design/task approval pauses; implementation choices below are engineering decisions within that scope.

Use the existing module registry's full German names in StudyCard, resolving stored aliases and the retired mixed-history label. Unknown/prototype-like IDs receive the neutral heading `Übungsaufgabe`; never render an arbitrary lookup result. Do not change the shared ID/type guard or storage mappings.

Keep associated visible labels for unit selects, adding their value-field context (`Einheit für Minuten`, `Einheit für Sekunden`). Unlabelled fields use their numbered value position. Options, values, check/reveal guards and validation remain unchanged.

Keep RAID's current capacity-equivalent diagram and distributed-parity explanation. Make its container a named group and each static tile an image with its existing accurate name; group the text legend explicitly. Link the parity explanation as the group's description. Explain mirrored capacity in RAID 1/10 without inventing disk pairing or changing calculations. Correct RAID fixture defaults so level/disk changes produce coherent usable capacity and fault tolerance; retain independent literal expectations.

Alternatives: a new label registry or diagram redesign would duplicate existing metadata or broaden this package. Reusing metadata and adding semantic roles is smaller and preserves the layout. Native fieldsets would add form semantics to a static diagram; named groups and images fit its content.

No dependencies, generator/math/scoring changes, schema/security changes, account access or AP2 routing changes. PR #58 is held. Publish a ready PR only after full verification and independent code review. Wait 15 real minutes after every push; assess all review feedback. Stop before merge and separate public completion comments pending specific approval.
