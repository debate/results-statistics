import * as cheerio from "cheerio";
import * as crypto from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TournamentSearchResult {
  id: number;
  name: string;
  date: string;
}

export interface ScrapingOption {
  id: number;
  name: string;
}

export interface TournamentMetadata {
  name: string;
  location: string;
  year: string;
}

export interface EntryTeam {
  lastNames: string[];
  code: string;
}

export interface JudgeName {
  parts: string[];
  hashedId: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TABROOM_BASE = "https://www.tabroom.com";
const CURRENT_SEASON = 2023;

export { TABROOM_BASE, CURRENT_SEASON };

// ─── Utilities ───────────────────────────────────────────────────────────────

export function getId(nodes: string[]): string {
  nodes = nodes.map((node) =>
    node.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  );
  nodes = nodes.sort();
  const concatenated = nodes.join("").toLowerCase();
  const sha224 = crypto.createHash("sha224").update(Buffer.from(concatenated)).digest();
  return Array.from(sha224, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

export async function batchPromises<T>(
  promises: Promise<T>[],
  batchSize: number
): Promise<T[]> {
  const results: T[] = [];
  let batchStart = 0;
  while (batchStart < promises.length) {
    const batchEnd = batchStart + batchSize;
    const batch = await Promise.all(
      promises.slice(batchStart, Math.min(batchEnd, promises.length))
    );
    results.push(...batch);
    batchStart = batchEnd;
  }
  return results;
}

// ─── HTML Parsers (pure functions, no network) ──────────────────────────────

export function parseTournamentSearch(html: string): TournamentSearchResult[] {
  const $ = cheerio.load(html);
  const results: TournamentSearchResult[] = [];
  $("tr").each((idx, row) => {
    if (idx === 0) return;
    const result: Partial<TournamentSearchResult> = {};
    $(row)
      .find("td")
      .each((i, cell) => {
        if (i === 0) {
          const href = $(cell).find("a").attr("href") ?? "";
          result.id = parseInt(
            href.replace("/index/tourn/index.mhtml?tourn_id=", ""),
            10
          );
          result.name = $(cell).text().trim();
        } else if (i === 2) {
          result.date = new Date($(cell).text()).toString();
        }
      });
    if (result.id !== undefined && result.name) {
      results.push(result as TournamentSearchResult);
    }
  });
  return results;
}

export function parseEvents(html: string, tournId: number): ScrapingOption[] {
  const $ = cheerio.load(html);
  const events: ScrapingOption[] = [];
  $("#content > div.menu > div.sidenote > a").each((_idx, event) => {
    const href = $(event).attr("href") ?? "";
    events.push({
      id: parseInt(
        href.replace(
          `/index/tourn/fields.mhtml?tourn_id=${tournId}&event_id=`,
          ""
        ),
        10
      ),
      name: $(event).text().trim(),
    });
  });
  return events;
}

export function parseJudgePools(
  html: string,
  tournId: number
): ScrapingOption[] {
  const $ = cheerio.load(html);
  const pools: ScrapingOption[] = [];
  $("#content > div.menu > div.sidenote > div").each((_idx, pool) => {
    let id = 0;
    let name = "";
    $(pool)
      .find("a")
      .each((idx, a) => {
        if (idx === 0) {
          const href = $(a).attr("href") ?? "";
          id = parseInt(
            href
              .replace("/index/tourn/judges.mhtml?category_id=", "")
              .replace(`&tourn_id=${tournId}`, ""),
            10
          );
        }
      });
    $(pool)
      .find("span")
      .each((idx, span) => {
        if (idx === 0) {
          name = $(span).text().trim();
        }
      });
    if (id && name) {
      pools.push({ id, name });
    }
  });
  return pools;
}

export function parseMetadata(html: string): TournamentMetadata {
  const $ = cheerio.load(html);
  const subtitle = $($("#content > div.main > h5")[0])
    .text()
    .trim()
    .split("—");
  const year = subtitle[0]?.trim().split(" ")[0] ?? "";
  return {
    name: $("#content > div.main > h2").text().trim(),
    location: subtitle[1]?.trim() ?? "",
    year,
  };
}

export function parseEntries(html: string): EntryTeam[] {
  const $ = cheerio.load(html);
  const teams: EntryTeam[] = [];
  $("tr").each((idx, row) => {
    if (idx === 0) return;
    let lastNames: string[] = [];
    let code = "";
    $(row)
      .find("td")
      .each((i, cell) => {
        if (i === 2) {
          lastNames = $(cell).text().trim().split(" & ");
        } else if (i === 3) {
          code = $(cell).text().trim();
        }
      });
    if (code) {
      teams.push({ lastNames, code });
    }
  });
  return teams;
}

export function parseJudgeNames(html: string): JudgeName[] {
  const $ = cheerio.load(html);
  const judges: JudgeName[] = [];
  let targetCols: number[] = [];

  $("tr").each((idx, row) => {
    if (idx === 0) {
      $(row)
        .find("th")
        .each((i, cell) => {
          if (["First", "Middle", "Last"].includes($(cell).text().trim())) {
            targetCols.push(i);
          }
        });
      return;
    }
    const parts: string[] = [];
    $(row)
      .find("td")
      .each((i, cell) => {
        if (targetCols.includes(i)) {
          const text = $(cell).text().trim();
          if (text) parts.push(text);
        }
      });
    if (parts.length > 0) {
      judges.push({ parts, hashedId: getId(parts) });
    }
  });
  return judges;
}

/** Generate alias code permutations for two-initial team codes (e.g., "School AB" → ["School AB", "School BA"]) */
export function expandTeamCodes(codes: string[]): string[] {
  return codes.flatMap((code) => {
    const nodes = code.split(" ");
    const last = nodes[nodes.length - 1];
    const base = nodes.slice(0, -1).join(" ");
    if (last.length !== 2) return [code];
    return [`${base} ${last[0]}${last[1]}`, `${base} ${last[1]}${last[0]}`];
  });
}

// ─── Fetch + Parse (network-dependent) ──────────────────────────────────────

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

export async function searchTournaments(
  query: string
): Promise<TournamentSearchResult[]> {
  const html = await fetchText(
    `${TABROOM_BASE}/index/search.mhtml?search=${encodeURIComponent(query)}`
  );
  return parseTournamentSearch(html);
}

export async function getEvents(tournId: number): Promise<ScrapingOption[]> {
  const html = await fetchText(
    `${TABROOM_BASE}/index/tourn/fields.mhtml?tourn_id=${tournId}`
  );
  return parseEvents(html, tournId);
}

export async function getJudgePools(
  tournId: number
): Promise<ScrapingOption[]> {
  const html = await fetchText(
    `${TABROOM_BASE}/index/tourn/judges.mhtml?tourn_id=${tournId}`
  );
  return parseJudgePools(html, tournId);
}

export async function getMetadata(
  tournId: number
): Promise<TournamentMetadata> {
  const html = await fetchText(
    `${TABROOM_BASE}/index/tourn/index.mhtml?tourn_id=${tournId}`
  );
  return parseMetadata(html);
}

export async function getEntries(
  tournId: number,
  eventId: number
): Promise<EntryTeam[]> {
  const html = await fetchText(
    `${TABROOM_BASE}/index/tourn/fields.mhtml?tourn_id=${tournId}&event_id=${eventId}`
  );
  return parseEntries(html);
}

export async function getJudgeNames(
  tournId: number,
  poolId: number
): Promise<JudgeName[]> {
  const html = await fetchText(
    `${TABROOM_BASE}/index/tourn/judges.mhtml?category_id=${poolId}&tourn_id=${tournId}`
  );
  return parseJudgeNames(html);
}
