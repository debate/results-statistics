import { z } from 'zod';
import { procedure, router } from '../trpc';
import sortRecords from '@src/utils/sort-records';
import { Circuit, JudgeRanking, Season, Topic, TopicTag } from '@shared/database';
import db from '@src/services/db.service';

export type TargetedJudgeRanking = JudgeRanking & {
  circuitRank: number;
  season: Season;
  circuit: Circuit;
}

export type AggregatedJudgeRanking = {
  index: number;
  season_id: number;
  circuit_id: number;
  circuit_name: string;
  z_score: number;
};

const judgeRouter = router({
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
      const rankingType = input.circuits?.length === 1 && input.seasons?.length === 1 ? "targeted" : "aggregated";
      const [judge, filterData, topics, topicTags] = await Promise.all([
        prisma.judge.findUnique({
          where: {
            id: input.id
          },
          include: {
            results: {
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
                }
              },
              include: {
                tournament: {
                  select: {
                    name: true,
                    start: true,
                    circuits: true,
                    event: true,
                    seasonId: true,
                    topic: {
                      include: {
                        tags: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                tournament: {
                  start: "asc"
                }
              }
            },
            rankings: {
              include: {
                season: true,
                circuit: {
                  select: {
                    id: true,
                    name: true,
                    event: true
                  }
                },
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
            paradigms: true,
            _count: {
              select: {
                records: true
              }
            }
          }
        }),
        prisma.judgeTournamentResult.findMany({
          where: {
            judgeId: {
              equals: input.id
            },
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
        })
          .then(d => d
            .map(({ tournament }) => tournament!.topic)
            .filter(t => t !== null) as (Topic & { tags: TopicTag[] })[]
          ),
        prisma.topic.findMany({
          where: {
            id: {
              in: input.topics || []
            }
          }
        }),
        prisma.topicTag.findMany({
          where: {
            id: {
              in: input.topicTags || []
            }
          }
        })
      ]);

      let ranking: {
        aggregated?: AggregatedJudgeRanking[];
        targeted?: TargetedJudgeRanking;
      };

      if (rankingType === "targeted") {
        // Targeting a specific ranking
        const targeted = (await (await db).query(`
            SELECT * FROM (
              SELECT
                RANK() OVER (ORDER BY \`index\` DESC) AS circuitRank,
                judge_id,
                \`index\`
              FROM
                judge_rankings
              WHERE
                circuit_id = ? AND
                season_id = ?
            ) t
            WHERE judge_id = ?;
          `, [input.circuits![0], input.seasons![0], input.id]) as unknown as [
            TargetedJudgeRanking[],
            object[],
          ])[0][0];
        ranking = { targeted };
      } else {
        // Aggregating multiple rankings
        const aggregated = (await (await db).query(`
          SELECT
            tr.\`index\`,
            s.id as season_id,
            c.id as circuit_id,
            c.name as circuit_name,
            AVG((tr.\`index\` - tr2.avg_score) / tr2.std_dev) AS z_score
          FROM judge_rankings tr
          JOIN (
            SELECT circuit_id, season_id, AVG(\`index\`) AS avg_score, STDDEV_POP(\`index\`) AS std_dev
            FROM judge_rankings
            GROUP BY circuit_id, season_id
          ) AS tr2 ON tr.circuit_id = tr2.circuit_id AND tr.season_id = tr2.season_id
          JOIN seasons s ON tr.season_id = s.id
          JOIN circuits c on tr.circuit_id = c.id
          WHERE tr.judge_id = ? AND tr.circuit_id ${input.circuits?.length ? "IN" : "NOT IN"} ${input.circuits ? `(${input.circuits.join(",")})` : "(-1)"}
          AND tr.season_id ${input.seasons?.length ? "IN" : "NOT IN"} ${input.seasons ? `(${input.seasons.join(",")})` : "(-1)"}
          GROUP BY tr.judge_id, tr.circuit_id, tr.season_id, tr.\`index\`;
        `, [input.id]) as unknown as [
              AggregatedJudgeRanking[],
              object[],
            ])[0];
        ranking = { aggregated };
      }

      return judge
        ? {
          ...judge,
          filterData,
          filter: {
            topics,
            topicTags
          },
          ranking
        }
        : null
    }),
  records: procedure
    .input(
      z.object({
        id: z.number()
      })
    )
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;
      const records = await prisma.judgeRecord.findMany({
        where: {
          resultId: input.id
        },
        select: {
          rounds: {
            include: {
              speaking: {
                include: {
                  competitor: true
                }
              },
              result: {
                select: {
                  team: {
                    include: {
                      aliases: {
                        select: {
                          code: true
                        },
                        take: 1
                      },
                    }
                  }
                }
              },
              records: {
                select: {
                  judge: {
                    select: {
                      name: true,
                      id: true
                    }
                  },
                  decision: true,
                  winner: {
                    select: {
                      aliases: {
                        take: 1,
                        select: {
                          code: true,
                        }
                      },
                      id: true,
                    }
                  }
                }
              }
            }
          },
          decision: true,
          avgSpeakerPoints: true,
          wasSquirrel: true
        },
      });

      return sortRecords<typeof records[0]>(records);
    })
});

export default judgeRouter;
