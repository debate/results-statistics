import { z } from 'zod';
import { procedure, router } from '../trpc';
import * as cheerio from 'cheerio';
import db from '@src/services/db.service';
import { JudgeRanking, TeamRanking } from '@shared/database';
import batchPromises from '@src/utils/batch-promises';
import getId from '@src/utils/get-id';
import _ from "lodash";

export interface TournamentSearchResult {
  id: number;
  date: string;
  name: string;
};

export interface ScrapingOption {
  id: number;
  name: string;
}

const scrapingRouter = router({
  tournament: procedure
    .input(z.object({
      search: z.string()
    }))
    .mutation(async ({ input }) => {
      const tabroomResponse = await fetch(`https://www.tabroom.com/index/search.mhtml?search=${input.search}`)
        .then(res => res.text());
      const $ = cheerio.load(tabroomResponse);
      const results: TournamentSearchResult[] = [];
      $('tr').each((idx, row) => {
        if (idx === 0) return;
        const result: any = {}
        $(row)
          .find('td')
          .each((i, cell) => {
            if (i === 0) {
              result.id = parseInt($(cell)
                .find('a')
                .attr()!['href']
                .replace('/index/tourn/index.mhtml?tourn_id=', ''));
              result.name = $(cell).text().trim();
            } else if (i === 2) {
              result.date = new Date($(cell).text());
            }
          });
        results.push(result as TournamentSearchResult);
      });
      return results;
    }),
  entries: procedure
    .input(z.object({
      id: z.number()
    }))
    .mutation(async ({ input }) => {
      const tabroomResponse = await fetch(`https://www.tabroom.com/index/tourn/fields.mhtml?tourn_id=${input.id}`)
        .then(res => res.text());
      const $ = cheerio.load(tabroomResponse);
      const events: ScrapingOption[] = [];
      $('#content > div.menu > div.sidenote > a').each((idx, event) => {
        events.push({
          id: parseInt($(event)
            .attr()!['href']
            .replace(`/index/tourn/fields.mhtml?tourn_id=${input.id}&event_id=`, '')),
          name: $(event).text().trim()
        });
      });
      return events;
    }),
  judges: procedure
    .input(z.object({
      id: z.number()
    }))
    .mutation(async ({ input }) => {
      const tabroomResponse = await fetch(`https://www.tabroom.com/index/tourn/judges.mhtml?tourn_id=${input.id}`)
        .then(res => res.text());
      const $ = cheerio.load(tabroomResponse);
      const pools: ScrapingOption[] = [];
      $('#content > div.menu > div.sidenote > div').each((idx, pool) => {
        let id: number = 0;
        let name: string = '';
        $(pool).find('a').each((idx, a) => {
          if (idx === 0) {
            id = parseInt(
              $(a)
                .attr()!['href']
                .replace('/index/tourn/judges.mhtml?category_id=', '')
                .replace(`&tourn_id=${input.id}`, '')
            )
          }
        });
        $(pool).find('span').each((idx, span) => {
          if (idx === 0) {
            name = $(span).text().trim()
          }
        });
        if (id && name) {
          pools.push({
            id,
            name
          });
        }
      });
      return pools;
    }),
  metadata: procedure
    .input(z.object({
      id: z.number()
    }))
    .query(async ({ input }) => {
      const tabroomResponse = await fetch(`https://www.tabroom.com/index/tourn/index.mhtml?tourn_id=${input.id}`)
        .then(res => res.text());
      const $ = cheerio.load(tabroomResponse);
      const subtitle = $($('#content > div.main > h5')[0])
        .text()
        .trim()
        .split('—');
      const year = subtitle[0].trim().split(' ')[0];
      return {
        name: $('#content > div.main > h2').text().trim(),
        location: subtitle[1].trim(),
        year
      };
    }),
  threats: procedure
    .input(z.object({
      tournId: z.number(),
      eventId: z.number(),
      circuitId: z.number(),
      seasonId: z.number()
    }))
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;
      const tabroomResponse = await fetch(`https://www.tabroom.com/index/tourn/fields.mhtml?tourn_id=${input.tournId}&event_id=${input.eventId}`)
      .then(res => res.text());
      const $ = cheerio.load(tabroomResponse);
      const teamLastNames: string[][] = [];
      const teamCodes: string[] = [];
      $('tr').each((idx, row) => {
        if (idx === 0) return;
        $(row).find('td').each((idx, cell) => {
          if (idx === 2) {
            teamLastNames.push($(cell).text().trim().split(' & '));
          } else if (idx === 3) {
            teamCodes.push($(cell).text().trim());
          }
        });
      });

      const teams = await prisma.alias.findMany({
        where: {
          code: {
            in: _.flatten(teamCodes.map(code => {
              let nodes = code.split(' ');
              let last = nodes[nodes.length - 1];
              let base = nodes.slice(0, nodes.length - 1).join(' ');
              if (last.length !== 2) return code;
              return [`${base} ${last[0]}${last[1]}`, `${base} ${last[1]}${last[0]}`]
            }))
          }
        },
        select: {
          teamId: true,
          code: true
        }
      });

      const ranks = await (await db).query(`
        SELECT * FROM (
          SELECT
            RANK() OVER (ORDER BY otr DESC) AS circuitRank,
            otr,
            team_id AS teamId
          FROM (
            SELECT DISTINCT
              team_rankings.team_id,
              team_rankings.otr
            FROM team_rankings
            INNER JOIN teams ON team_rankings.team_id = teams.id
            WHERE
              team_rankings.circuit_id = 40 AND
              team_rankings.season_id = 2023
            ) t
          ) q
        WHERE teamId IN (${teams.map(t => `'${t.teamId}'`).join(',')})
        ORDER BY circuitRank ASC;
      `, [input.circuitId, input.seasonId, input.circuitId, input.seasonId]) as unknown as [
        { circuitRank: number, teamId: string, otr: number }[],
        object[],
      ];
      return ranks[0].map(r => {
        const { code } = teams.find(t => t.teamId == r.teamId)!;
        return {...r, code}
      });
    }),
  threatDetails: procedure
    .input(z.object({
      teams: z.array(z.string()),
      season: z.number().optional(),
      circuit: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;
      return Promise.all(input.teams.map((teamId) =>
        prisma.teamTournamentResult.aggregate({
          where: {
            teamId,
            tournament: {
              ...(input.circuit && {
                circuits: {
                  some: {
                    id: input.circuit
                  }
                }
              }),
              ...(input.season && {
                seasonId: input.season
              })
            }
          },
          _sum: {
            prelimWins: true,
            prelimLosses: true,
            elimWins: true,
            elimLosses: true
          },
          _avg: {
            opWpM: true,
            otrComp: true,
          },
          _count: true
        }).then(result => ({...result, teamId}))
      ))
    }),
  strikes: procedure
    .input(z.object({
      tournId: z.number(),
      poolId: z.number(),
      seasonId: z.number(),
      circuitId: z.number()
    }))
    .query(async ({ input, ctx }) => {
      const tabroomResponse = await fetch(`https://www.tabroom.com/index/tourn/judges.mhtml?category_id=${input.poolId}&tourn_id=${input.tournId}`)
      .then(res => res.text());
      const $ = cheerio.load(tabroomResponse);

      const judgeNames: string[] = [];

      let targetCols: number[] = [];

      $('tr').each((idx, row) => {
        if (idx === 0) {
          $(row).find('th').each((idx, cell) => {
            if (["First", "Middle", "Last"].includes($(cell).text().trim())) {
              targetCols.push(idx);
            }
          });
          return;
        };
        const names: string[] = [];
        $(row).find('td').each((idx, cell) => {
          if (targetCols.includes(idx)) {
            const text = $(cell).text().trim();
            if (text) {
              names.push(text);
            }
          }
        });
        judgeNames.push(getId(names))
      });

        const ranks = await (await db).query(`
          SELECT * FROM (
            SELECT
              RANK() OVER (ORDER BY \`index\` DESC, t.numRounds DESC) AS circuitRank,
              \`index\`,
              judge_id AS judgeId,
              name
            FROM (
              SELECT DISTINCT
                judge_rankings.judge_id,
                judges.name,
                judge_rankings.\`index\`,
                t.numRounds,
                t.avgSpeakerPoints
              FROM judge_rankings
              INNER JOIN judges ON judge_rankings.judge_id = judges.id
              INNER JOIN (
                SELECT
                  judgeId,
                  COUNT(*) / 2 as numRounds,
                  AVG(jr.avgSpeakerPoints) as avgSpeakerPoints
                FROM _JudgeRecordToRound jrtr
                INNER JOIN judge_records jr ON jrtr.A = jr.id
                INNER JOIN tournaments t ON jr.tournamentId = t.id
                WHERE
                  t.id IN (
                    SELECT ctt.B
                    FROM _CircuitToTournament ctt
                    WHERE ctt.A = ?
                  ) AND
                  t.season_id = ?
                GROUP BY judgeId
              ) as t ON judge_rankings.judge_id = t.judgeId
              WHERE
                judge_rankings.circuit_id = ? AND
                judge_rankings.season_id = ?
              ) t
            ) q
          WHERE q.judgeId IN (${judgeNames.map(n => `'${n}'`).join(',')})
          ORDER BY circuitRank DESC;
        `, [input.circuitId, input.seasonId, input.circuitId, input.seasonId]) as unknown as [
          ({ circuitRank: number; index: number; judgeId: string; name: string })[],
            object[],
          ];
      return ranks[0];
    }),
  strikeDetails: procedure
    .input(z.object({
      judges: z.array(z.string()),
      season: z.number().optional(),
      circuit: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;
      return Promise.all(input.judges.map((judgeId) =>
        prisma.judgeTournamentResult.aggregate({
          where: {
            judgeId,
            tournament: {
              ...(input.circuit && {
                circuits: {
                  some: {
                    id: input.circuit
                  }
                }
              }),
              ...(input.season && {
                seasonId: input.season
              })
            }
          },
          _sum: {
            numAff: true,
            numPro: true,
            numNeg: true,
            numCon: true
          },
          _avg: {
            numSquirrels: true,
            numPrelimScrews: true,
            stdDevPoints: true,
            avgRawPoints: true,
          },
          _count: true
        }).then(result => ({...result, judgeId}))
      ))
    })
});

export default scrapingRouter;
