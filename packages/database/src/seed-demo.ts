import { PrismaClient, Event, Side, RoundOutcome, RoundType, BidType, ElimRoundName } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding demo data...");

  // --- Seasons ---
  const season2023 = await prisma.season.upsert({
    where: { id: 2023 },
    update: {},
    create: { id: 2023 },
  });
  const season2024 = await prisma.season.upsert({
    where: { id: 2024 },
    update: {},
    create: { id: 2024 },
  });

  // --- Circuits ---
  const natCircuitPF = await prisma.circuit.upsert({
    where: { name_event: { name: "National Circuit", event: Event.PublicForum } },
    update: {},
    create: {
      name: "National Circuit",
      event: Event.PublicForum,
      seasons: { connect: [{ id: 2023 }, { id: 2024 }] },
    },
  });
  const natCircuitLD = await prisma.circuit.upsert({
    where: { name_event: { name: "National Circuit", event: Event.LincolnDouglas } },
    update: {},
    create: {
      name: "National Circuit",
      event: Event.LincolnDouglas,
      seasons: { connect: [{ id: 2023 }, { id: 2024 }] },
    },
  });
  const localCircuitPF = await prisma.circuit.upsert({
    where: { name_event: { name: "California", event: Event.PublicForum } },
    update: {},
    create: {
      name: "California",
      event: Event.PublicForum,
      seasons: { connect: [{ id: 2024 }] },
    },
  });

  // --- Topics ---
  const topic1 = await prisma.topic.create({
    data: {
      resolution: "Resolved: The United States federal government should substantially increase fiscal redistribution in the United States by adopting a federal jobs guarantee, expanding Social Security, or providing a universal basic income.",
      nickname: "UBI/Jobs/SS",
      event: Event.PublicForum,
    },
  });
  const topic2 = await prisma.topic.create({
    data: {
      resolution: "Resolved: The United States ought to adopt a policy of nuclear no first use.",
      nickname: "Nuclear NFU",
      event: Event.LincolnDouglas,
    },
  });

  // --- Schools ---
  const schools = await Promise.all(
    ["Oakwood Academy", "Lincoln High", "Jefferson Prep", "Valley Central", "Riverside HS"].map(
      (name) =>
        prisma.school.upsert({
          where: { name },
          update: {},
          create: { name },
        })
    )
  );
  const [oakwood, lincoln, jefferson, valley, riverside] = schools;

  // --- Competitors ---
  const competitors = await Promise.all(
    [
      { id: "comp-1", name: "Alex Chen" },
      { id: "comp-2", name: "Jordan Rivera" },
      { id: "comp-3", name: "Morgan Taylor" },
      { id: "comp-4", name: "Casey Kim" },
      { id: "comp-5", name: "Riley Patel" },
      { id: "comp-6", name: "Sam Washington" },
      { id: "comp-7", name: "Drew Martinez" },
      { id: "comp-8", name: "Quinn Foster" },
    ].map((c) =>
      prisma.competitor.upsert({
        where: { id: c.id },
        update: {},
        create: c,
      })
    )
  );

  // --- Teams ---
  const teams = await Promise.all(
    [
      {
        id: "team-oakwood-cr",
        competitorIds: ["comp-1", "comp-2"],
        schoolIds: [oakwood.id],
        circuitIds: [natCircuitPF.id, localCircuitPF.id],
        seasonIds: [2024],
      },
      {
        id: "team-lincoln-tk",
        competitorIds: ["comp-3", "comp-4"],
        schoolIds: [lincoln.id],
        circuitIds: [natCircuitPF.id],
        seasonIds: [2024],
      },
      {
        id: "team-jefferson-pw",
        competitorIds: ["comp-5", "comp-6"],
        schoolIds: [jefferson.id],
        circuitIds: [natCircuitPF.id, localCircuitPF.id],
        seasonIds: [2024],
      },
      {
        id: "team-valley-mf",
        competitorIds: ["comp-7", "comp-8"],
        schoolIds: [valley.id],
        circuitIds: [localCircuitPF.id],
        seasonIds: [2024],
      },
    ].map((t) =>
      prisma.team.upsert({
        where: { id: t.id },
        update: {},
        create: {
          id: t.id,
          competitors: { connect: t.competitorIds.map((id) => ({ id })) },
          schools: { connect: t.schoolIds.map((id) => ({ id })) },
          circuits: { connect: t.circuitIds.map((id) => ({ id })) },
          seasons: { connect: t.seasonIds.map((id) => ({ id })) },
        },
      })
    )
  );
  const [teamOakwood, teamLincoln, teamJefferson, teamValley] = teams;

  // --- Judges ---
  const judges = await Promise.all(
    [
      { id: "judge-1", name: "Dr. Sarah Williams" },
      { id: "judge-2", name: "Prof. David Lee" },
      { id: "judge-3", name: "Maria Garcia" },
    ].map((j) =>
      prisma.judge.upsert({
        where: { id: j.id },
        update: {},
        create: j,
      })
    )
  );

  // --- Paradigms ---
  await prisma.paradigm.create({
    data: {
      scrapedAt: Math.floor(Date.now() / 1000),
      text: "I evaluate arguments on the flow. I value clear sign-posting and weighing. I default to util unless told otherwise.",
      html: "<p>I evaluate arguments on the flow. I value clear sign-posting and weighing. I default to util unless told otherwise.</p>",
      judgeId: "judge-1",
      flowType: "Flow",
      progressiveType: "SemiProgressive",
    },
  });

  // --- Tournament 1: Demo Classic ---
  const tourn1 = await prisma.tournament.create({
    data: {
      name: "Demo Classic Invitational",
      nickname: "Demo Classic",
      start: Math.floor(new Date("2024-01-15").getTime() / 1000),
      end: Math.floor(new Date("2024-01-16").getTime() / 1000),
      event: Event.PublicForum,
      tabEventId: 10001,
      tabTournId: 20001,
      location: "Los Angeles, CA",
      isTocQualifier: true,
      bidLevel: ElimRoundName.Quarterfinals,
      hasElimRounds: true,
      boost: 1.5,
      seasonId: 2024,
      topicId: topic1.id,
      circuits: { connect: [{ id: natCircuitPF.id }, { id: localCircuitPF.id }] },
      schools: { connect: schools.map((s) => ({ id: s.id })) },
    },
  });

  // --- Tournament 2: Regional Open ---
  const tourn2 = await prisma.tournament.create({
    data: {
      name: "Regional Open Championship",
      nickname: "Regionals",
      start: Math.floor(new Date("2024-02-10").getTime() / 1000),
      end: Math.floor(new Date("2024-02-11").getTime() / 1000),
      event: Event.PublicForum,
      tabEventId: 10002,
      tabTournId: 20002,
      location: "San Francisco, CA",
      isTocQualifier: false,
      bidLevel: null,
      hasElimRounds: true,
      boost: 1.0,
      seasonId: 2024,
      topicId: topic1.id,
      circuits: { connect: [{ id: localCircuitPF.id }] },
      schools: { connect: [{ id: oakwood.id }, { id: jefferson.id }, { id: valley.id }] },
    },
  });

  // --- Aliases ---
  const aliases = await Promise.all([
    prisma.alias.create({ data: { code: "Oakwood CR", teamId: teamOakwood.id } }),
    prisma.alias.create({ data: { code: "Lincoln TK", teamId: teamLincoln.id } }),
    prisma.alias.create({ data: { code: "Jefferson PW", teamId: teamJefferson.id } }),
    prisma.alias.create({ data: { code: "Valley MF", teamId: teamValley.id } }),
  ]);
  const [aliasOakwood, aliasLincoln, aliasJefferson, aliasValley] = aliases;

  // --- Geography ---
  const geoCali = await prisma.entryGeography.create({
    data: { country: "US", state: "CA" },
  });

  // --- Team Tournament Results for Tournament 1 ---
  const result1 = await prisma.teamTournamentResult.create({
    data: {
      tournamentId: tourn1.id,
      tabEntryId: 30001,
      teamId: teamOakwood.id,
      aliasId: aliasOakwood.id,
      schoolId: oakwood.id,
      geographyId: geoCali.id,
      prelimPos: 1,
      prelimPoolSize: 32,
      prelimWins: 5,
      prelimLosses: 1,
      prelimBallotsWon: 12,
      prelimBallotsLost: 2,
      elimWins: 3,
      elimLosses: 1,
      elimBallotsWon: 5,
      elimBallotsLost: 2,
      opWpM: 0.72,
      otrComp: 95.3,
    },
  });
  const result2 = await prisma.teamTournamentResult.create({
    data: {
      tournamentId: tourn1.id,
      tabEntryId: 30002,
      teamId: teamLincoln.id,
      aliasId: aliasLincoln.id,
      schoolId: lincoln.id,
      geographyId: geoCali.id,
      prelimPos: 2,
      prelimPoolSize: 32,
      prelimWins: 5,
      prelimLosses: 1,
      prelimBallotsWon: 11,
      prelimBallotsLost: 3,
      elimWins: 3,
      elimLosses: 0,
      elimBallotsWon: 6,
      elimBallotsLost: 0,
      opWpM: 0.68,
      otrComp: 98.1,
    },
  });
  const result3 = await prisma.teamTournamentResult.create({
    data: {
      tournamentId: tourn1.id,
      tabEntryId: 30003,
      teamId: teamJefferson.id,
      aliasId: aliasJefferson.id,
      schoolId: jefferson.id,
      geographyId: geoCali.id,
      prelimPos: 5,
      prelimPoolSize: 32,
      prelimWins: 4,
      prelimLosses: 2,
      prelimBallotsWon: 9,
      prelimBallotsLost: 5,
      elimWins: 1,
      elimLosses: 1,
      elimBallotsWon: 2,
      elimBallotsLost: 2,
      opWpM: 0.65,
      otrComp: 78.4,
    },
  });
  const result4 = await prisma.teamTournamentResult.create({
    data: {
      tournamentId: tourn1.id,
      tabEntryId: 30004,
      teamId: teamValley.id,
      aliasId: aliasValley.id,
      schoolId: valley.id,
      geographyId: geoCali.id,
      prelimPos: 10,
      prelimPoolSize: 32,
      prelimWins: 3,
      prelimLosses: 3,
      prelimBallotsWon: 7,
      prelimBallotsLost: 7,
      elimWins: 0,
      elimLosses: 1,
      elimBallotsWon: 0,
      elimBallotsLost: 2,
      opWpM: 0.58,
      otrComp: 62.7,
    },
  });

  // --- Bids ---
  await prisma.bid.create({
    data: {
      resultId: result2.id,
      teamId: teamLincoln.id,
      value: BidType.Full,
      isGhostBid: false,
    },
  });
  await prisma.bid.create({
    data: {
      resultId: result1.id,
      teamId: teamOakwood.id,
      value: BidType.Partial,
      isGhostBid: false,
    },
  });

  // --- Judge Tournament Results ---
  const judgeResult1 = await prisma.judgeTournamentResult.create({
    data: {
      judgeId: "judge-1",
      tabTournId: 20001,
      tabEventId: 10001,
      tabJudgeId: 40001,
      avgRawPoints: 28.5,
      avgAdjPoints: 28.2,
      stdDevPoints: 0.8,
      numPrelims: 6,
      numPrelimScrews: 1,
      numElims: 3,
      numSquirrels: 0,
      numPro: 4,
      numCon: 5,
      tournamentId: tourn1.id,
    },
  });
  const judgeResult2 = await prisma.judgeTournamentResult.create({
    data: {
      judgeId: "judge-2",
      tabTournId: 20001,
      tabEventId: 10001,
      tabJudgeId: 40002,
      avgRawPoints: 27.8,
      avgAdjPoints: 27.5,
      stdDevPoints: 1.2,
      numPrelims: 6,
      numPrelimScrews: 2,
      numElims: 2,
      numSquirrels: 1,
      numPro: 3,
      numCon: 5,
      tournamentId: tourn1.id,
    },
  });

  // --- Rounds (prelim and elim for tournament 1) ---
  // Oakwood vs Lincoln - Prelim Round 1
  const round1 = await prisma.round.create({
    data: {
      name: "Round 1",
      type: RoundType.Prelim,
      side: Side.Pro,
      nameStd: "R1",
      outcome: RoundOutcome.Win,
      ballotsWon: 2,
      ballotsLost: 1,
      opponentId: teamLincoln.id,
      resultId: result1.id,
    },
  });
  // Lincoln's perspective of same round
  await prisma.round.create({
    data: {
      name: "Round 1",
      type: RoundType.Prelim,
      side: Side.Con,
      nameStd: "R1",
      outcome: RoundOutcome.Loss,
      ballotsWon: 1,
      ballotsLost: 2,
      opponentId: teamOakwood.id,
      resultId: result2.id,
    },
  });

  // Oakwood vs Jefferson - Prelim Round 2
  const round2 = await prisma.round.create({
    data: {
      name: "Round 2",
      type: RoundType.Prelim,
      side: Side.Con,
      nameStd: "R2",
      outcome: RoundOutcome.Win,
      ballotsWon: 3,
      ballotsLost: 0,
      opponentId: teamJefferson.id,
      resultId: result1.id,
    },
  });

  // Oakwood vs Valley - Quarterfinals
  const roundQF = await prisma.round.create({
    data: {
      name: "Quarterfinals",
      type: RoundType.Elim,
      side: Side.Pro,
      nameStd: "QF",
      outcome: RoundOutcome.Win,
      ballotsWon: 2,
      ballotsLost: 1,
      opponentId: teamValley.id,
      resultId: result1.id,
    },
  });

  // Lincoln vs Jefferson - Semifinals
  await prisma.round.create({
    data: {
      name: "Semifinals",
      type: RoundType.Elim,
      side: Side.Con,
      nameStd: "SF",
      outcome: RoundOutcome.Win,
      ballotsWon: 3,
      ballotsLost: 0,
      opponentId: teamJefferson.id,
      resultId: result2.id,
    },
  });

  // Lincoln vs Oakwood - Finals
  await prisma.round.create({
    data: {
      name: "Finals",
      type: RoundType.Elim,
      side: Side.Pro,
      nameStd: "F",
      outcome: RoundOutcome.Win,
      ballotsWon: 2,
      ballotsLost: 1,
      opponentId: teamOakwood.id,
      resultId: result2.id,
    },
  });

  // --- Judge Records ---
  await prisma.judgeRecord.create({
    data: {
      decision: Side.Pro,
      avgSpeakerPoints: 28.5,
      wasSquirrel: false,
      judgeId: "judge-1",
      teams: { connect: [{ id: teamOakwood.id }, { id: teamLincoln.id }] },
      winnerId: teamOakwood.id,
      rounds: { connect: [{ id: round1.id }] },
      type: RoundType.Prelim,
      event: Event.PublicForum,
      tournamentId: tourn1.id,
      resultId: judgeResult1.id,
    },
  });
  await prisma.judgeRecord.create({
    data: {
      decision: Side.Con,
      avgSpeakerPoints: 28.0,
      wasSquirrel: false,
      judgeId: "judge-2",
      teams: { connect: [{ id: teamOakwood.id }, { id: teamJefferson.id }] },
      winnerId: teamOakwood.id,
      rounds: { connect: [{ id: round2.id }] },
      type: RoundType.Prelim,
      event: Event.PublicForum,
      tournamentId: tourn1.id,
      resultId: judgeResult2.id,
    },
  });

  // --- Speaker Results ---
  await prisma.tournamentSpeakerResult.create({
    data: {
      competitorId: "comp-1",
      rawAvgPoints: 28.8,
      adjAvgPoints: 28.5,
      stdDevPoints: 0.6,
      resultId: result1.id,
    },
  });
  await prisma.tournamentSpeakerResult.create({
    data: {
      competitorId: "comp-2",
      rawAvgPoints: 28.3,
      adjAvgPoints: 28.1,
      stdDevPoints: 0.9,
      resultId: result1.id,
    },
  });
  await prisma.tournamentSpeakerResult.create({
    data: {
      competitorId: "comp-3",
      rawAvgPoints: 29.1,
      adjAvgPoints: 28.9,
      stdDevPoints: 0.4,
      resultId: result2.id,
    },
  });
  await prisma.tournamentSpeakerResult.create({
    data: {
      competitorId: "comp-4",
      rawAvgPoints: 28.0,
      adjAvgPoints: 27.8,
      stdDevPoints: 1.1,
      resultId: result2.id,
    },
  });

  // --- Round Speaker Results ---
  await prisma.roundSpeakerResult.create({
    data: {
      competitorId: "comp-1",
      points: 29.0,
      roundId: round1.id,
      judgeId: "judge-1",
    },
  });
  await prisma.roundSpeakerResult.create({
    data: {
      competitorId: "comp-2",
      points: 28.5,
      roundId: round1.id,
      judgeId: "judge-1",
    },
  });

  // --- Team Rankings ---
  await prisma.teamRanking.create({
    data: {
      seasonId: 2024,
      teamId: teamLincoln.id,
      otr: 98.1,
      circuitId: natCircuitPF.id,
    },
  });
  await prisma.teamRanking.create({
    data: {
      seasonId: 2024,
      teamId: teamOakwood.id,
      otr: 95.3,
      circuitId: natCircuitPF.id,
    },
  });
  await prisma.teamRanking.create({
    data: {
      seasonId: 2024,
      teamId: teamJefferson.id,
      otr: 78.4,
      circuitId: natCircuitPF.id,
    },
  });
  await prisma.teamRanking.create({
    data: {
      seasonId: 2024,
      teamId: teamOakwood.id,
      otr: 96.0,
      circuitId: localCircuitPF.id,
    },
  });

  // --- Judge Rankings ---
  await prisma.judgeRanking.create({
    data: {
      seasonId: 2024,
      judgeId: "judge-1",
      index: 92.5,
      circuitId: natCircuitPF.id,
    },
  });
  await prisma.judgeRanking.create({
    data: {
      seasonId: 2024,
      judgeId: "judge-2",
      index: 85.3,
      circuitId: natCircuitPF.id,
    },
  });

  // --- Tournament 2 Results (smaller tournament) ---
  const result2_1 = await prisma.teamTournamentResult.create({
    data: {
      tournamentId: tourn2.id,
      tabEntryId: 30005,
      teamId: teamOakwood.id,
      aliasId: aliasOakwood.id,
      schoolId: oakwood.id,
      geographyId: geoCali.id,
      prelimPos: 1,
      prelimPoolSize: 16,
      prelimWins: 4,
      prelimLosses: 0,
      prelimBallotsWon: 8,
      prelimBallotsLost: 0,
      elimWins: 2,
      elimLosses: 0,
      elimBallotsWon: 4,
      elimBallotsLost: 1,
      opWpM: 0.7,
      otrComp: 92.0,
    },
  });
  const result2_2 = await prisma.teamTournamentResult.create({
    data: {
      tournamentId: tourn2.id,
      tabEntryId: 30006,
      teamId: teamJefferson.id,
      aliasId: aliasJefferson.id,
      schoolId: jefferson.id,
      geographyId: geoCali.id,
      prelimPos: 3,
      prelimPoolSize: 16,
      prelimWins: 3,
      prelimLosses: 1,
      prelimBallotsWon: 6,
      prelimBallotsLost: 2,
      elimWins: 1,
      elimLosses: 1,
      elimBallotsWon: 2,
      elimBallotsLost: 2,
      opWpM: 0.62,
      otrComp: 75.0,
    },
  });

  // Rounds for tournament 2
  await prisma.round.create({
    data: {
      name: "Round 1",
      type: RoundType.Prelim,
      side: Side.Pro,
      nameStd: "R1",
      outcome: RoundOutcome.Win,
      ballotsWon: 2,
      ballotsLost: 0,
      opponentId: teamJefferson.id,
      resultId: result2_1.id,
    },
  });
  await prisma.round.create({
    data: {
      name: "Finals",
      type: RoundType.Elim,
      side: Side.Con,
      nameStd: "F",
      outcome: RoundOutcome.Win,
      ballotsWon: 2,
      ballotsLost: 1,
      opponentId: teamValley.id,
      resultId: result2_1.id,
    },
  });

  console.log("✅ Demo data seeded successfully!");
  console.log("");
  console.log("Summary:");
  console.log("  - 2 seasons (2023, 2024)");
  console.log("  - 3 circuits (National PF, National LD, California PF)");
  console.log("  - 2 topics");
  console.log("  - 5 schools");
  console.log("  - 8 competitors across 4 teams");
  console.log("  - 3 judges with paradigms and records");
  console.log("  - 2 tournaments with full results, rounds, and speaker data");
  console.log("  - Team and judge rankings");
  console.log("  - TOC bids");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
