# Verified legacy content corrections

Correct substantiated findings K1–K3 and K5–K9 from `/workspace/legacy-audit/knowledge.md` on base `3868890713be1a3fd80d557fbb2a2050a3b19c86`. Publication follows the approved repair workflow; all merges remain paused under the current instruction.

## Scope and approach

- K1: swap the mislabeled OSI mnemonic directions. APSTNDP describes layers 7→1; PDNTSPA describes 1→7. Keep layer assignments and ordering unchanged.
- K2: the AWS subnet answer must distinguish a direct route to an Internet Gateway from outbound access through NAT. Addressing and security rules still govern resource reachability.
- K3: retain the existing tiles as **capacity equivalents**, explicitly labeled as such for RAID 5/6. Each tile is one disk-capacity unit, not a dedicated physical data/parity disk. Visible text explains distributed parity and one/two disk-capacity overhead. The alternative of rotating parity stripes adds a visual redesign outside this correction. Preserve formulas, fault tolerance and other RAID layouts.
- K5/K6: accept `nft`, not the framework name `nftables`, as a command. Add only the explicitly taught `mkfs.ext4` alternative to the broad filesystem-creation prompt; do not accept arbitrary prefixes or arguments.
- K7/K8: distinguish `wc -c` bytes and `-m` characters, default output's byte count, and describe existing `ss/netstat -tulpn` examples as listening sockets rather than all connections.
- K9: replace only fiber comparison lines with named optic/rate/reach examples, qualifying dependence on optic and fiber grade. Keep cable selection and reason grading unchanged.

## Primary evidence checked 2026-10-30

- [IBM OSI layers](https://www.ibm.com/think/topics/osi-model): numbered layer names independently establish mnemonic initials and direction.
- [AWS subnet types](https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html#subnet-types): routing determines public/private classification; private resources may use NAT.
- [IBM RAID](https://cloud.ibm.com/docs/bare-metal?topic=bare-metal-bm-raid-levels): RAID 5 distributes parity; RAID 6 uses double parity stripes on each disk and capacity equivalent to two disks. Use these specific statements; this page also has an imprecise RAID 5 heading. Audit IBM POWER6/old support links were blocked or timed out.
- [Netfilter nft manual](https://www.netfilter.org/projects/nftables/manpage.html): `nft` is the command-line tool for the nftables framework. Audit wiki URL timed out; project manual confirms the distinction.
- [Upstream mke2fs manual](https://man7.org/linux/man-pages/man8/mke2fs.8.html): invocation as `mkfs.ext4` implies ext4 creation.
- [GNU wc manual](https://www.gnu.org/software/coreutils/manual/html_node/wc-invocation.html): web fetch timed out; installed GNU `wc --help` independently documents `-c/--bytes`, `-m/--chars`, and default newline/word/byte counts. Safe UTF-8 stdin check: `ä` is two bytes and one character in `C.UTF-8`.
- [ss manual](https://man7.org/linux/man-pages/man8/ss.8.html) and [netstat manual](https://man7.org/linux/man-pages/man8/netstat.8.html): `-l` filters listening sockets; `-a` includes listening and non-listening sockets.
- [Cisco QSFP-100G data sheet](https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/datasheet-c78-736282.html): 100GBASE-SR4-S has 70m OM3 / 100m OM4 reach; 100GBASE-LR4-S has 10km singlemode reach. These are optic-specific examples, not universal fiber maxima.

## Deferred decisions and constraints

K4 remains deferred: choose either explicitly constrained optimum selection or acceptance of multiple suitable cables with reasons validated for the selected cable. A 30m/1G office answer of Cat6a remains rejected by current grading. Neither a new optimum criterion nor a redesign of grading is implied by this patch.

K9's latent rectangular helper model (`findBestCable(550,100000,...)`) and no-solution fallback remain deferred before adding new scenarios. Existing comparison correction does not certify all helper inputs or every current fiber recommendation. Other audit ambiguities (RAID10 guaranteed versus possible failures, RI scope, HTTPS transport, OSI classification conventions, further Linux copy) remain outside this patch.

No new task variants, module IDs, schema, dependencies, security/configuration/accounts/AP2/progress or 5% tolerance changes. Shared StudyCard/registry/validation are owned by another workstream. No external writes, push, PR, comments, merge, full suite or build in this delegated task.

## Acceptance

Run meaningful regressions against generated answers/solution output and rendered RAID labels. Observe RED on the incorrect content before minimal production corrections, then GREEN on the five affected generator suites and RAID visualizer suite. Existing tests that bless `nftables` or physical dedicated parity labels must be updated with the factual reason. Root coordinates full suite/build, independent review and integration.
