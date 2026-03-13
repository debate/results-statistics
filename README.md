# Scoring System

This document outlines all team and judge scoring formulas used across the platform, and which files implement them.

---

## File Tree (Scoring-Related Files)

```
results-statistics/
├── packages/database/prisma/
│   └── schema.prisma                          # Data models: TeamRanking, TeamTournamentResult, JudgeRanking, etc.
│
├── apps/web/src/
│   ├── utils/
│   │   ├── get-statistics.ts                  # CORE: Deflator, OTR aggregation, PWP, EWP, TWP, break %
│   │   ├── get-expected-wp.ts                 # CORE: Head-to-head expected win probability formula
│   │   ├── get-clutch-factor.ts               # CORE: Clutch factor (upset/choke weighting)
│   │   └── get-percentile.ts                  # Percentile helper
│   │
│   ├── server/routers/
│   │   ├── team.ts                            # Team summary queries, circuit rankings (RANK() OVER otr DESC)
│   │   ├── dataset.ts                         # Leaderboards, school avg OTR, bid stats
│   │   ├── judge.ts                           # Judge summary, index rankings
│   │   ├── scraping.ts                        # Threats/strikes OTR-based analysis
│   │   └── landing-page.ts                    # Homepage OTR data
│   │
│   ├── components/charts/
│   │   ├── TeamCharts.tsx                     # OTR, PWP, TWP, prelim percentile visualizations
│   │   └── JudgeCharts.tsx                    # Judge index, speaks, side-bias charts
│   │
│   ├── components/tables/
│   │   ├── dataset/
│   │   │   ├── LeaderboardTable.tsx           # Team OTR leaderboard
│   │   │   └── SchoolTable.tsx                # School avg OTR rankings
│   │   └── radar/
│   │       ├── ThreatTable.tsx                # OTR-based threat analysis
│   │       └── HeadToHeadRoundTable.tsx       # Round-level head-to-head data
│   │
│   └── pages/
│       ├── teams/[id].tsx                     # Team detail page
│       ├── judges/[id].tsx                    # Judge detail page
│       ├── dataset.tsx                        # Leaderboard page
│       ├── x-ray/head-to-head.tsx             # Expected win probability page
│       └── radar/threats.tsx                  # OTR histogram / threat scouting
│
└── apps/api/src/routes/v1/rankings/
    ├── team.router.ts                         # REST API for team rankings
    └── judge.router.ts                        # REST API for judge rankings
```

---

## Formulas

### 1. OTR (Overall Team Rating)

OTR is the primary team rating metric. Each tournament produces an `otrComp` (OTR component) stored in `team_tournament_results`. The overall OTR is computed as:

```
OTR = deflator(n) × mean(otrComp₁, otrComp₂, ..., otrCompₙ)
```

where `n` = number of tournaments attended.

**Deflator (logistic growth curve):**

```
deflator(n) = N / ((N/Y₀ - 1) × e^(-K × n) + 1)
```

| Parameter | Value | Meaning                              |
| --------- | ----- | ------------------------------------ |
| N         | 1     | Asymptotic maximum (caps at 1.0)     |
| Y₀       | 0.15  | Initial value (15% at 0 tournaments) |
| K         | 1.3   | Growth rate                          |

**Effect:** Teams with few tournaments have their OTR heavily discounted. After ~4-5 tournaments the deflator approaches 1.0.

**Source:** [get-statistics.ts:44-52](apps/web/src/utils/get-statistics.ts#L44-L52)

---

### 2. PWP (Prelim Win Percentage)

```
PWP = prelimBallotsWon / (prelimBallotsWon + prelimBallotsLost)
```

Aggregated across all tournaments.

**Source:** [get-statistics.ts:107](apps/web/src/utils/get-statistics.ts#L107)

---

### 3. EWP (Elim Win Percentage)

```
EWP = elimWins / (elimWins + elimLosses)
```

Aggregated across all tournaments.

**Source:** [get-statistics.ts:108](apps/web/src/utils/get-statistics.ts#L108)

---

### 4. TWP (Total Win Percentage)

```
TWP = (prelimBallotsWon + elimWins) / (totalPrelimBallots + totalElimBallots) + EWP × 0.1
```

Capped at 1.0. The `+ EWP × 0.1` bonus rewards teams that win in elimination rounds (harder opponents, higher stakes).

**Source:** [get-statistics.ts:110-111](apps/web/src/utils/get-statistics.ts#L110-L111)

---

### 5. Break Percentage

```
Break% = (# tournaments where team made elims) / (# tournaments with elim rounds)
```

Only counts tournaments that have elimination rounds.

**Source:** [get-statistics.ts:81-89, 114](apps/web/src/utils/get-statistics.ts#L81-L89)

---

### 6. OpWpM (Opponent Win Percentage Margin)

Average of per-tournament `opWpM` values. Measures strength of schedule — higher means the team faced tougher opponents.

**Source:** [get-statistics.ts:117](apps/web/src/utils/get-statistics.ts#L117)

---

### 7. Expected Win Probability (Head-to-Head)

Given two teams with OTR values and optionally a judge panel's average index:

```
EWP = (1.47 × |ΔOTR|^0.8094 × (1 / (4 × avgOTR))) / (1 + 2^(-(judgeIndex - 6))) + 0.5
```

| Component                     | Meaning                                            |
| ----------------------------- | -------------------------------------------------- |
| `1.47 × \|ΔOTR\|^0.8094`    | Non-linear impact of OTR gap (diminishing returns) |
| `1 / (4 × avgOTR)`         | Scales down when both teams are strong             |
| `1 + 2^(-(judgeIndex - 6))` | Judge quality adjustment (default index = 10)      |
| `+ 0.5`                     | Baseline: equal teams have 50% win probability     |

Returns the probability that the higher-OTR team wins.

**Source:** [get-expected-wp.ts](apps/web/src/utils/get-expected-wp.ts)

---

### 8. Clutch Factor

Measures performance under pressure relative to expectations:

```
ClutchFactor = (udWins × udRounds × 7 - udLosses × udRounds × 0.5
              + favWins × favRounds × 2 - favLosses × favRounds × 6)
              / ((favRounds + udRounds) × 4)
```

| Scenario                           | Weight | Rationale                            |
| ---------------------------------- | ------ | ------------------------------------ |
| Underdog win (beat higher-OTR)     | +7     | Highest reward — clutch performance |
| Favored win (beat lower-OTR)       | +2     | Expected outcome, modest credit      |
| Underdog loss (lost to higher-OTR) | −0.5  | Expected outcome, minimal penalty    |
| Favored loss (lost to lower-OTR)   | −6    | Choke — heavy penalty               |

Output is clamped to **[0, 10]**.

A team's rounds are classified as "favored" or "underdog" by comparing their OTR to their opponent's OTR.

**Source:** [get-clutch-factor.ts](apps/web/src/utils/get-clutch-factor.ts)

---

### 9. Prelim Pool Percentile

```
Percentile = 100 - (prelimPos / prelimPoolSize) × 100
```

Per-tournament metric shown in charts.

**Source:** [TeamCharts.tsx](apps/web/src/components/charts/TeamCharts.tsx)

---

### 10. Judge Index

Stored in `judge_rankings.index`. Analogous to team OTR but for judges. Judges are ranked by index per circuit/season. Associated per-tournament stats include:

- **avgRawPoints / avgAdjPoints** — average speaker points awarded
- **stdDevPoints** — consistency of point distribution
- **numSquirrels** — unexpected decisions
- **numPrelimScrews** — prelim judging errors
- **Side bias** — pro/aff vs con/neg vote frequency

---

## Data Flow

```
Tabroom.com scraping
        ↓
  TeamTournamentResult (otrComp, opWpM, prelim/elim records)
  JudgeTournamentResult (points, squirrels, screws)
        ↓
  team_rankings / judge_rankings (aggregated OTR / index per circuit+season)
        ↓
  tRPC routers (team.ts, dataset.ts, judge.ts)
        ↓
  Frontend pages + charts (TeamCharts, LeaderboardTable, HeadToHead, etc.)
```
