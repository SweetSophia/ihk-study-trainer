# Linux answer alternatives and feedback

Approved scope: audit existing Linux exercises for additional valid answers and clearer feedback, preserving each learning objective. The user's adopted autonomous workflow permits ordinary design/implementation decisions without another approval gate. PR #58 remains held. Base: main `8833a15b0a5970abf681d79f685a0fd10fa37f77`.

## Approach and boundary

Keep the existing explicit, normalized answer lists. Add curated tool alternatives only where the described capability fits; these are not claims that tools are interchangeable or installed everywhere. Do not infer correctness from a command prefix or execute any learner input. A generic shell parser would need separate task-specific semantics for options, operands, quoting, pipes, redirections, privilege wrappers and side effects; defer it to a separately approved design. The alternative of accepting the first token would incorrectly accept unrelated or harmful trailing operations. The alternative of exact canonical names alone rejects genuine tool alternatives and gives misleading feedback.

## Catalogue decisions

Add these supported names, retaining current accepted forms:

| Prompt's example | Additional supported names |
|---|---|
| ls | dir, vdir |
| top | htop |
| ps (generic process information) | top, htop |
| nano (screen editor with displayed shortcuts) | pico |
| ss (connections and ports) | netstat |
| wget (noninteractive downloads) | curl |
| locate (indexed lookup) | plocate |
| awk | gawk, mawk |
| who (logged-in users) | users, w |
| apt (Debian package operations) | apt-get |
| nslookup (forward/reverse DNS) | host |
| gzip (gzip format) | pigz |
| cut (field extraction) | awk, gawk, mawk |
| screen (generic terminal multiplexing) | tmux |

Preserve sharper prompts: htop's default F6/F10 keys; tmux's default Ctrl+b prefix; kill targets PIDs, killall defaults to exact process names and pkill to patterns/attribute filters; chown changes owner and optionally group. Keep netstat's routing-table requirement, dig's named identity, tracepath's MTU, nice versus renice, and systemctl enable/disable/daemon-reload distinct. Explain nice's ordinary baseline 0 versus the default +10 adjustment. Fix awk's displayed passwd-field example to use its actual colon separator. Also qualify the existing rm warning with GNU rm's default recursive-root protection ([GNU rm manual](https://www.gnu.org/software/coreutils/manual/html_node/rm-invocation.html)); other wrong target paths remain dangerous. These are clarifications of existing objectives, not new question families.

For command-to-description, use the same curated capability relationships to recognize known overlapping valid descriptions. Do not offer such descriptions as supposedly wrong distractors; retain five options including the canonical description. No fuzzy similarity or generic semantic inference.

## Feedback and state

Pass the existing acceptedValues plus an optional session-only `answerExplanation` from generated Question to LinuxTerminal. Never grade with that explanatory metadata. After checking, show accepted forms as a curated list and identify the canonical command as an example rather than the only correct answer. Label its explanation as applying to that example, so flags are not attributed to alternative tools. A cautious format reminder may explain that additional arguments are not evaluated; it never marks a prefix semantically correct.

Clearly state before input: command name, required command+subcommand, or operator only; no extra options/targets; nothing executes. Preserve existing case-insensitive/whitespace-normalized recognition and explicitly distinguish it from real shell case sensitivity. A persistent polite status region announces results; input is associated with its instructions and receives a visible container focus indicator. New questions clear prior feedback and preserve existing one-check/next-question/progress/reveal behavior. No module IDs, storage, shared validator, dependencies, backend or security settings change.

## Acceptance

Deterministically cover every catalogue entry in both directions, all declared alternatives, genuine negative controls, five nonconflicting choices, aliases and operators, normalized multiword forms, and rejection of argument tails, wrappers, paths, pipelines and command chaining. Use real StudyCard + LinuxTerminal to verify accepted alternatives, wrong-answer list/explanation, feedback reset, Enter/button repeat protection and navigation/theme retention. Desktop/narrow Chromium validates input, feedback, focus, both palettes and no overflow with network/account writes blocked. Run focused development checks then full tests/lint/types/build, independent actual-code pre-push review, Ready PR, real 15-minute window after every push and evidence-based bot triage. Merge only with applicable authorization and repository protections; verify automatic deployment. Do not retry denied endpoints or claim hosted/account/screenreader proof.

## Sources checked

- [GNU directory listing](https://www.gnu.org/software/coreutils/manual/coreutils.html#Directory-listing), [GNU user information](https://www.gnu.org/software/coreutils/manual/html_node/User-information.html)
- [htop upstream](https://htop.dev/), [nano manual](https://www.nano-editor.org/dist/v3/nano.pdf)
- [ss](https://manpages.debian.org/trixie/iproute2/ss.8.en.html), [netstat](https://manpages.debian.org/trixie/net-tools/netstat.8.en.html)
- [curl downloads](https://curl.se/docs/manpage.html), [GNU Wget](https://www.gnu.org/software/wget/manual/wget.html)
- [plocate](https://plocate.sesse.net/), [GNU awk](https://www.gnu.org/software/gawk/), [mawk](https://invisible-island.net/mawk/)
- [BIND host/DNS tools](https://bind9.readthedocs.io/en/latest/manpages.html#host-dns-lookup-utility), [apt-get](https://manpages.debian.org/trixie/apt/apt-get.8.en.html)
- [pigz](https://www.zlib.net/pigz/), [tmux](https://man.openbsd.org/tmux), [GNU nice](https://www.gnu.org/software/coreutils/manual/html_node/nice-invocation.html)

Some GNU node fetches timed out; upstream manual index/search excerpts and independent audit/local non-mutating examples support these stable capabilities. This is a curated audit, not exhaustive equivalence for every Unix tool.
