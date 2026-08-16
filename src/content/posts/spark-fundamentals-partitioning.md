---
title: "Spark Fundamentals: Partitioning"
date: 2026-08-15
tag: "data engineering"
excerpt: "Two kinds of partitioning — logical (in-memory) and physical (on-disk) — and the rules of thumb for getting each one right: sizing memory partitions for parallelism, and sizing/ordering storage partitions for fast scans."
---

There are two types of partitioning to think about, and they solve different problems:

- **Logical** — partitioning in memory, which optimizes how data is distributed and processed across worker cores during a job.
- **Physical** — partitioning in storage, which optimizes how files are laid out on disk to speed up reads and scans.

## Memory partitioning rules of thumb

The goal is to maximize parallel worker efficiency. Spark 3.0+'s Adaptive Query Execution (AQE) automates some of this — mainly coalescing shuffle partitions and handling join skew — but it doesn't eliminate the need to think about partitioning, especially for initial reads and pre-write repartitioning.

- **Avoid too few, large partitions.** Each partition is processed by a single task on a single core at a time. Too few large partitions means work piles up on a handful of cores while the rest sit idle — you're paying for uptime you're not using. $$$
- **Avoid too many small partitions.** Every partition spins up a task, and each task has fixed scheduling/serialization overhead. Too many tiny partitions means that overhead starts to dominate actual compute time. $$$
- **Generally:** if there's a `write.partitionBy(...)` in the pipeline, always pair it with an explicit `repartition(...)` immediately before the write — this is the one spot AQE reliably doesn't help you, since it's optimizing shuffle stages, not write output layout.

## Storage partitioning rules of thumb

The goal is to make it fast for workers to locate the data they need. Two levers: file size and data ordering/clustering.

### Size

The main problem is accumulating many small files — costly for metadata tracking (on open table formats), for locating row groups, and in raw request count on cloud storage. Manage it with:

- **Open table formats (Delta/Iceberg/Hudi):** run `OPTIMIZE` (or equivalent) periodically to compact small files.
- **Raw Parquet zones:** combine two techniques:
  - **Hive-style partitioning** — write to subdirectories matching filter columns, e.g. `/year=2026/month=08/`. Like tabs in a binder — workers skip straight to relevant folders instead of scanning everything. Use a low-cardinality column that shows up often in `WHERE` clauses (date, country, etc.).
  - **File sizing** — control how many files land in each subdirectory. Aim for roughly 128MB–1GB per file. E.g., writing 50GB of data → aim for ~50 files at ~1GB each, rather than letting the job produce thousands of small ones. For streaming/bursty writes, periodically re-scan and re-compact directories that accumulate many small files.

### Order

Even if your files are right-sized, reads aren't fast if the data inside them isn't organized. You've sorted your bookstore into genres (partitions) — now you need the books within each genre shelved in a useful order.

> A disclaimer on the analogy: these steps won't "physically locate" your books/data together. What actually happens is the min/max for each file are expressed in each partition's footer, which your Spark compute can quickly refer to.

- **Open table formats (Delta/Iceberg/Hudi):** run `Z-ORDER` (or equivalent — clustering in Iceberg/Hudi) on frequently-filtered, high-cardinality columns. Z-order orders the data such that multiple columns together support good file-skipping whether you filter on one of those columns or several at once — unlike a plain sort, which only fully benefits its leading column.
- **Raw Parquet zones:** since there's no Z-order equivalent available, use `.sortWithinPartitions("country", "user_id")` before writing as the closest approximation. This gives strong skipping on the first column (country) and weaker, partial benefit on subsequent columns — it's a real improvement over unsorted data, but not a true substitute for multi-dimensional Z-order clustering. Pick your leading sort column based on whichever filter predicate matters most.
