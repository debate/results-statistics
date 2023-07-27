import { z } from 'zod';
import { procedure, router } from '../trpc';
import sortRounds from '@src/utils/sort-rounds';
import getStatistics from '@src/utils/get-statistics';
import db from '@src/services/db.service';
import { Circuit, Season, TeamRanking, Topic, TopicTag } from '@shared/database';

export type TargetedTeamRanking = TeamRanking & {
  circuitRank: number;
  season: Season;
  circuit: Circuit;
}

export type AggregatedTeamRanking = {
  otr: number;
  season_id: number;
  circuit_id: number;
  circuit_name: string;
  z_score: number;
};

export type TeamPageRanking = TargetedTeamRanking | AggregatedTeamRanking[];

const teamRouter = router({
  summary: procedure
    .input(
      z.object({
        id: z.string(),
        seasons: z.array(z.number()).optional(),
        circuits: z.array(z.number()).optional(),
        topics: z.array(z.number()).optional(),
        topicTags: z.array(z.number()).optional()
      })
    )
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;
      let { rankings, ...team } = await prisma.team.findUniqueOrThrow({
        where: {
          id: input.id,
        },
        include: {
          competitors: true,
          results: {
            include: {
              tournament: {
                include: {
                  circuits: true,
                  topic: {
                    include: {
                      tags: true
                    }
                  },
                }
              },
              bid: {
                select: {
                  value: true,
                  isGhostBid: true
                }
              },
              alias: true,
              school: true,
              speaking: {
                include: {
                  competitor: {
                    select: {
                      name: true
                    }
                  }
                }
              },
            },
            where: {
              tournament: {
                ...(input.circuits && {
                  circuits: {
                    some: {
                      id: {
                        in: input.circuits
                      }
                    }
                  }
                }),
                ...(input.seasons && {
                  seasonId: {
                    in: input.seasons
                  }
                }),
                ...(input.topics && {
                  topic: {
                    id: {
                      in: input.topics
                    }
                  }
                }),
                ...(input.topicTags && {
                  topic: {
                    tags: {
                      some: {
                        id: {
                          in: input.topicTags
                        }
                      }
                    }
                  }
                })
              },
            },
          },
          aliases: {
            select: {
              code: true,
            }
          },
          schools: true,
          rankings: {
            include: {
              season: true,
              circuit: true,
            },
            where: {
              ...(input.circuits && {
                circuit: {
                  id: {
                    in: input.circuits
                  }
                }
              }),
              ...(input.seasons && {
                seasonId: {
                  in: input.seasons
                }
              }),
            }
          },
          circuits: {
            select: {
              name: true,
              event: true,
              id: true,
            }
          },
          seasons: true,
          _count: {
            select: {
              rounds: true
            }
          }
        }
      });
      const topics = await prisma.topic.findMany({
        where: {
          id: {
            in: input.topics || []
          }
        }
      });
      const topicTags = await prisma.topicTag.findMany({
        where: {
          id: {
            in: input.topicTags || []
          }
        }
      });

      let ranking: { targeted?: TargetedTeamRanking, aggregated?: AggregatedTeamRanking[] };

      if (input.circuits?.length === 1 && input.seasons?.length === 1) {
        // Targeting a specific ranking
        const circuitRankQuery = await (await db).query(`
          SELECT * FROM (
            SELECT
              RANK() OVER (ORDER BY otr DESC) AS circuitRank,
              team_id,
              otr
            FROM
              team_rankings
            WHERE
              circuit_id = ? AND
              season_id = ?
          ) t
          WHERE team_id = ?;
        `, [input.circuits[0], input.seasons[0], team.id]) as unknown as [
            (TeamRanking & { circuitRank: number })[],
            object[],
          ];
        ranking = {
          targeted: {
            ...rankings[0],
            circuitRank: circuitRankQuery[0][0].circuitRank
          }
        }
      } else {
        // Aggregating multiple rankings
        const aggregatedRankingQuery = await (await db).query(`
          SELECT
            tr.otr,
            s.id as season_id,
            c.id as circuit_id,
            c.name as circuit_name,
            AVG((tr.otr - tr2.avg_score) / tr2.std_dev) AS z_score
          FROM team_rankings tr
          JOIN (
            SELECT circuit_id, season_id, AVG(otr) AS avg_score, STDDEV_POP(otr) AS std_dev
            FROM team_rankings
            GROUP BY circuit_id, season_id
          ) AS tr2 ON tr.circuit_id = tr2.circuit_id AND tr.season_id = tr2.season_id
          JOIN seasons s ON tr.season_id = s.id
          JOIN circuits c on tr.circuit_id = c.id
          WHERE tr.team_id = ? AND tr.circuit_id ${input.circuits?.length ? "IN" : "NOT IN"} ${input.circuits ? `(${input.circuits.join(",")})` : "(-1)"}
          AND tr.season_id ${input.seasons?.length ? "IN" : "NOT IN"} ${input.seasons ? `(${input.seasons.join(",")})` : "(-1)"}
          GROUP BY tr.team_id, tr.circuit_id, tr.season_id, tr.otr;
      `, [team.id]) as unknown as [
          AggregatedTeamRanking[],
          object[],
          ];
        ranking = { aggregated: aggregatedRankingQuery[0] };
      }

      const filterData = await prisma.teamTournamentResult.findMany({
        where: {
          teamId: input.id,
          tournament: {
            ...(input.seasons && {
              seasonId: {
                in: input.seasons
              }
            }),
            ...(input.circuits && {
              circuits: {
                some: {
                  id: {
                    in: input.circuits
                  }
                }
              }
            }),
          }
        },
        select: {
          tournament: {
            select: {
              topic: {
                include: {
                  tags: true,
                }
              }
            }
          }
        }
      }).then(d => d
        .map(({ tournament }) => tournament.topic)
        .filter(t => t !== null) as (Topic & { tags: TopicTag[] })[]
      );

      return {
        ...team,
        ranking,
        filterData,
        statistics: getStatistics({ rankings, ...team }),
        filter: {
          topics,
          topicTags
        }
      }
    }),
  rounds: procedure
    .input(
      z.object({
        id: z.number()
      })
    )
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;
      const rounds = await prisma.round.findMany({
        where: {
          resultId: input.id
        },
        include: {
          opponent: {
            select: {
              aliases: {
                take: 1
              },
              id: true,
            }
          },
          records: {
            select: {
              decision: true,
              judge: true,
            }
          },
          speaking: {
            include: {
              competitor: true,
            }
          }
        }
      });

      if (rounds) {
        return sortRounds<typeof rounds[0]>(rounds);
      }

      return rounds;
    }),
});

export default teamRouter;
