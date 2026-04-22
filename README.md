# Nottermost

A **Mattermost-inspired** team chat platform built as a **distributed system on AWS**. The scope is intentionally **minimal but essential** to exercise real architecture, operations, and cost trade-offs end to end.

---

## Table of contents

1. [Goals](#goals)
2. [Non-functional requirements](#non-functional-requirements)
3. [Architecture principles](#architecture-principles)
4. [Core features](#core-features)
5. [Application stack](#application-stack)
6. [AWS platform map](#aws-platform-map)
7. [Data, search, and sharding](#data-search-and-sharding)
8. [Security](#security)
9. [Operational maturity](#operational-maturity)
10. [Observability](#observability)
11. [Infrastructure as code](#infrastructure-as-code)
12. [CI/CD](#cicd)
13. [Caching](#caching)
14. [Production deployments](#production-deployments)
15. [Deployment strategies](#deployment-strategies)
16. [Incident handling](#incident-handling)
17. [Scaling under real traffic](#scaling-under-real-traffic)
18. [Monitoring in real environments](#monitoring-in-real-environments)
19. [Load and cost testing](#load-and-cost-testing)
20. [Design trade-offs](#design-trade-offs)
21. [Documentation backlog](#documentation-backlog)
22. [Changelog](#changelog)

---

## Goals

- **AWS hands-on**: realistic environment (VPC, subnets, consistent resource tags, multiple managed services; not a single “lift and shift” box).
- **Documentation**: decisions, alternatives, and trade-offs (especially cost vs latency vs durability).
- **Diagrams**: networks (VPC/subnets), service boundaries, request/event flows.
- **Engineering practice**: mergeable, observable, reproducible (IaC, secrets, CI/CD patterns).
- **No CLI touches**: avoid manual console/CLI changes; prefer repeatable automation via IaC + pipelines.

**Hard constraint:** everything that defines the environment should be **Infrastructure as Code (IaC)**. Networking must use a **VPC with subnets** and **consistent resource tags** for this environment.

---

## Non-functional requirements

These drive service choice, topology, and budget:

- **Concurrent WebSockets**: millions of connections (connection tiering, regional presence, back-pressure).
- **Latency**: global low-latency messaging (**<100ms** where feasible; region placement and edge/cache matter).
- **Fan-out**: **1 message → thousands of recipients** (async pipelines, partitioning, hot-key handling).
- **Durability & ordering**: strict where required (durable queues, idempotency, explicit consistency per path).
- **Cost**: continuous optimization as a first-class requirement.

---

## Architecture principles

- **Distributed system:** components run as separate deployable units with clear ownership of data and failure domains.
- **Microservices:** used for learning and separation of concerns; acknowledge that a well-factored monolith can be simpler at early scale (see [Design trade-offs](#design-trade-offs)).

---

## Core features

- **One-to-one messaging**
- **Workspaces** and **teams**
- **Messaging:** text, emoji, images, GIFs
- **File upload** and object storage integration
- **Message history** with **pagination**
- **Search and filtering** (OpenSearch-backed)

---

## Application stack

- **Web**: Next.js
- **API / services**: Node.js

---

## AWS platform map

High-level mapping from product needs to AWS building blocks (exact boundaries evolve with implementation).

- **Static web + edge**: S3, **CloudFront**, **WAF**
- **API edge**: **API Gateway** (HTTP/WebSocket as appropriate)
- **Compute**: containers or **Lambda** for suitable workloads (auth hooks, async workers, small RPC; exact split TBD per service)
- **Async work**: **SQS**
- **Pub/sub & fan-out**: **SNS** (and/or streaming where ordering/scale demands it)
- **Objects / attachments**: **S3**
- **Relational data**: **RDS** (multi-region / read replicas where justified by read patterns and DR)
- **High-throughput key-value**: **DynamoDB** (optionally **DAX** for hot read paths)
- **Search**: **OpenSearch**

Supporting capabilities: **Secrets Manager** (or Parameter Store) for secrets, **KMS** for encryption, and **Cognito** + **JWT** for identity patterns where applicable.

---

## Data, search, and sharding

- **Message storage**: prefer **DynamoDB** (with **DAX** if needed) for write-heavy, high-cardinality streams; complement with **RDS** where SQL fits (relational/cross-entity consistency).
- **Channel/workspace metadata**: typically **RDS** (or dedicated metadata store) with clear schema + migrations.
- **Search**: **OpenSearch** for full-text and filters over indexed projections.
- **Sharding/partitioning**: first-class topic (partition keys, hot channels, cross-shard queries); document patterns before scaling claims.

Deep-dive docs to write: **NoSQL vs SQL for messages**, **channel metadata model**, and **cost estimates at extreme scale** (e.g. 100M users; see below).

---

## Security

- **Encryption** in transit and at rest (KMS-managed keys where appropriate).
- **Authentication:** **Cognito** and/or **JWT**-based API auth, aligned with API Gateway authorizers.
- **Rate limiting** at the edge (API Gateway / WAF) and in application logic where abuse patterns differ.

---

## Operational maturity

- **Reliability thinking**: design for failure, explicitly define consistency/durability/ordering per path, and bake in idempotency/de-duplication where at-least-once delivery exists.
- **Failure handling**: timeouts, retries with backoff, circuit breaking/back-pressure, DLQs for async pipelines, and safe degradation when dependencies fail.
- **Rollback strategies**: fast revert is a requirement (see [Deployment strategies](#deployment-strategies)).
- **Logs / metrics / alerting**: treat as product features for operators, not afterthoughts (see [Observability](#observability) and [Monitoring in real environments](#monitoring-in-real-environments)).

---

## Observability

- **Metrics**: **Prometheus**-compatible collection + **Grafana** dashboards
- **Logs**: centralized logging (service + platform logs)
- **Tracing**: distributed tracing across microservices

---

## Infrastructure as code

- **Terraform**: primary declarative IaC for AWS resources
- **Ansible**: configuration/bootstrapping/operational automation where imperative steps complement Terraform

---

## CI/CD

- **Jenkins** as the CI/CD orchestrator (pipelines for build, test, security scans, and promoted deployments).
- **Promotion mindset**: changes flow through environments with automated checks; avoid manual production mutation.

---

## Caching

Caching is required for cost and latency (CDN/edge, application caches, and managed cache layers where hot read paths justify them; exact services TBD by workload profiling).

---

## Production deployments

Production-style deployments are treated as part of the architecture:

- **Repeatability**: IaC-defined infra + pipeline-driven deployments (minimize manual steps).
- **Safety**: staged rollout + health signals drive promotion decisions.
- **Reversibility**: every deploy must have a clear rollback path.

---

## Deployment strategies

Production-style promotion patterns (implementation-specific):

- **Rollback** after failed deploys or bad metrics
- **Canary** releases for gradual traffic shift
- **Blue/green** for full cutover with fast revert
- **Rolling** deployments for incremental replacement where appropriate

---

## Incident handling

- **Detection**: alerts tied to SLO-style symptoms (latency, error rate, saturation) + business signals where relevant.
- **Response**: runbooks, severity levels, clear ownership, and a “stop-the-bleed” playbook (rollback, disable feature, shed load).
- **Communication**: incident timeline + status updates (internal/external as applicable).
- **Learning loop**: blameless postmortems with tracked follow-ups.

---

## Scaling under real traffic

- **WebSockets at scale**: connection tiering, regional placement, and back-pressure to prevent cascading failure.
- **Fan-out**: async pipelines (**SQS**, **SNS**) with partitioning and hot-key mitigation.
- **Data scaling**: **DynamoDB** partition key design (and **DAX** for hot reads), **RDS** read replicas where justified, and clear sharding strategy.
- **Search scaling**: **OpenSearch** indexing projections and query patterns that avoid hotspots.
- **Cost under load**: continual cost optimization as traffic grows (compute choices, caching, retention, and right-sizing).

---

## Monitoring in real environments

- **Dashboards**: per-service golden signals (traffic, errors, latency, saturation) plus dependency health.
- **Alerting**: actionable alerts with thresholds tied to user impact; avoid noisy “everything is on fire” paging.
- **Logs**: structured logs with correlation IDs across services; include deploy/version metadata for fast rollback decisions.
- **Tracing**: end-to-end traces for critical paths and fan-out pipelines to find bottlenecks and failure points.

---

## Load and cost testing

- **Stress / scale testing** toward **very large user counts** (e.g. **100M users** as a modeling exercise), including use of **Spot** capacity where appropriate for ephemeral test fleets.
- **Cost optimization at scale:** produce **monthly cost estimates** under stated assumptions (regions, message rates, attachment mix, retention); this is a standing documentation deliverable.

---

## Design trade-offs

- **SQL vs NoSQL**: **SQLite** locally for fast iteration; in cloud: **DynamoDB (+ DAX)** for message-scale paths and **RDS** for relational aggregates, billing-adjacent data, and metadata that benefits from SQL constraints.
- **Monolith vs microservices**: monolith can be simpler/cheaper early; this repo uses **microservices** for practice and clearer boundaries (accept overhead consciously).
- **WebSockets vs polling**: **WebSockets** for real-time delivery; avoid polling for primary transport at scale.
- **Delivery semantics**: compare **at-most-once** vs **at-least-once**; for at-least-once, use **idempotency keys** + de-duplication for user-visible side effects.

---

## Documentation backlog

Planned written artifacts (in addition to this README):

1. **Message storage:** NoSQL vs SQL trade-offs for this workload.
2. **Channel metadata:** schema, consistency, and indexing strategy.
3. **Cost model:** monthly estimates for aggressive scale (e.g. 100M users) with explicit assumptions.
4. **Diagrams:** VPC/subnets, service dependency graph, and critical request/notification flows.

---

## Changelog

All notable changes are tracked in `CHANGELOG.md`.
