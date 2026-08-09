---
title: "Rewiring the streaming stack, badly at first"
date: 2026-08-04
tag: work
excerpt: "Notes from a week spent replacing a batch job with something that runs continuously, and the three ways I broke it before it worked."
---

Notes from a week spent replacing a batch job with something that runs continuously, and the three ways I broke it before it worked.

The first attempt lost state on every deploy. The second recovered state but replayed a day of events every time a pod restarted. The third one — the one that's actually running now — checkpoints often enough that a restart costs seconds, not hours.

None of this was clever. It was mostly reading the failure logs slowly enough to notice what they were actually saying.

*(Sample post — replace with real content by editing this Markdown file.)*
