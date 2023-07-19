import { procedure, router } from '../trpc';
import db from '@src/services/db.service';

const landingPageRouter = router({
  liveUpdates: procedure
    .query(async ({ ctx }) => {
      const { prisma } = ctx;

      const tournaments = (await (await db).query(`
        SELECT id
        FROM tournaments t
        WHERE start = (
            SELECT MAX(start)
            FROM tournaments
            WHERE event = t.event
        );
      `, []) as unknown as [
          { id: number }[],
          object[]
        ])[0];

      const updates = (await Promise.all(tournaments.map(async ({ id }, idx) => {
        const result = (await prisma.teamTournamentResult.findMany({
          where: {
            tournamentId: id,
          },
          orderBy: [
            {
              elimWins: "desc"
            },
            {
              prelimWins: "desc"
            }
          ],
          select: {
            teamId: true,
            rounds: {
              select: {
                nameStd: true
              }
            },
            elimWins: true,
            elimLosses: true,
            prelimWins: true,
            prelimLosses: true,
            tournament: {
              select: {
                name: true,
                nickname: true,
                hasElimRounds: true
              }
            },
            team: {
              select: {
                aliases: true,
              }
            }
          },
          take: 1
        }))[0];
        if (!result) {
          return undefined;
        }

        let alias = result.team.aliases.sort((a, b) => a.code.length - b.code.length)[0].code;

        let nodes = alias.split(' ');
        if (nodes.length > 3) {
          alias = nodes.slice(0, nodes.length - 1).map(n => n[0].toUpperCase()).join('') + ' ' + nodes[nodes.length - 1];
        }

        return `${alias} ${result.tournament.hasElimRounds ? "won" : `went ${result.prelimWins}-${result.prelimLosses} at`} the ${result.tournament.nickname ?? result.tournament.name}`
      }))).filter(update => !!update);

      return updates as string[];
    }),
  otrData: procedure
    .query(({ ctx }) => (
      ctx.prisma.teamRanking.findMany({
        where: {
          seasonId: 2023,
          circuitId: 40
        },
        select: {
          otr: true
        }
      })
    )),
  speakingData: procedure
    .query(({ ctx }) => (
      ctx.prisma.tournamentSpeakerResult.findMany({
        where: {
          result: {
            tournament: {
              seasonId: 2023,
              circuits: {
                some: {
                  id: 40
                }
              }
            }
          }
        },
        select: {
          rawAvgPoints: true
        }
      }).then(results => results.map(r => r.rawAvgPoints))
    ))
});

export default landingPageRouter;
