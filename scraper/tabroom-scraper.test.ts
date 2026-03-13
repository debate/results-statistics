import { describe, it, expect } from "vitest";
import {
  getId,
  batchPromises,
  parseTournamentSearch,
  parseEvents,
  parseJudgePools,
  parseMetadata,
  parseEntries,
  parseJudgeNames,
  expandTeamCodes,
  CURRENT_SEASON,
} from "./tabroom-scraper";

// ─── getId ───────────────────────────────────────────────────────────────────

describe("getId", () => {
  it("returns a 24-char hex string", () => {
    const id = getId(["John", "Doe"]);
    expect(id).toMatch(/^[0-9a-f]{24}$/);
  });

  it("is order-independent (sorts inputs)", () => {
    expect(getId(["Alice", "Bob"])).toBe(getId(["Bob", "Alice"]));
  });

  it("strips diacritics", () => {
    expect(getId(["José"])).toBe(getId(["Jose"]));
    expect(getId(["Müller"])).toBe(getId(["Muller"]));
  });

  it("is case-insensitive", () => {
    expect(getId(["JOHN"])).toBe(getId(["john"]));
  });

  it("produces different hashes for different inputs", () => {
    expect(getId(["Alice"])).not.toBe(getId(["Bob"]));
  });
});

// ─── batchPromises ───────────────────────────────────────────────────────────

describe("batchPromises", () => {
  it("resolves all promises", async () => {
    const promises = [1, 2, 3, 4, 5].map((n) => Promise.resolve(n));
    const results = await batchPromises(promises, 2);
    expect(results).toEqual([1, 2, 3, 4, 5]);
  });

  it("handles empty array", async () => {
    const results = await batchPromises([], 5);
    expect(results).toEqual([]);
  });

  it("handles batch size larger than array", async () => {
    const promises = [1, 2].map((n) => Promise.resolve(n));
    const results = await batchPromises(promises, 100);
    expect(results).toEqual([1, 2]);
  });
});

// ─── expandTeamCodes ─────────────────────────────────────────────────────────

describe("expandTeamCodes", () => {
  it("expands two-initial codes into both permutations", () => {
    expect(expandTeamCodes(["Westview AB"])).toEqual([
      "Westview AB",
      "Westview BA",
    ]);
  });

  it("does not expand single-initial or long suffixes", () => {
    expect(expandTeamCodes(["Westview A"])).toEqual(["Westview A"]);
    expect(expandTeamCodes(["Westview ABC"])).toEqual(["Westview ABC"]);
  });

  it("handles multiple codes", () => {
    const result = expandTeamCodes(["School AB", "School XY", "Solo Z"]);
    expect(result).toEqual([
      "School AB",
      "School BA",
      "School XY",
      "School YX",
      "Solo Z",
    ]);
  });
});

// ─── parseTournamentSearch ───────────────────────────────────────────────────

describe("parseTournamentSearch", () => {
  const html = `
    <table>
      <tr><th>Name</th><th>State</th><th>Date</th></tr>
      <tr>
        <td><a href="/index/tourn/index.mhtml?tourn_id=12345">Yale Invitational</a></td>
        <td>CT</td>
        <td>September 15, 2023</td>
      </tr>
      <tr>
        <td><a href="/index/tourn/index.mhtml?tourn_id=67890">Harvard Round Robin</a></td>
        <td>MA</td>
        <td>October 20, 2023</td>
      </tr>
    </table>
  `;

  it("parses tournament search results from HTML table", () => {
    const results = parseTournamentSearch(html);
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: 12345,
      name: "Yale Invitational",
    });
    expect(results[1]).toMatchObject({
      id: 67890,
      name: "Harvard Round Robin",
    });
  });

  it("returns empty array for empty table", () => {
    const results = parseTournamentSearch("<table><tr><th>Name</th></tr></table>");
    expect(results).toEqual([]);
  });

  it("returns empty for no HTML", () => {
    expect(parseTournamentSearch("")).toEqual([]);
  });
});

// ─── parseEvents ─────────────────────────────────────────────────────────────

describe("parseEvents", () => {
  const html = `
    <div id="content">
      <div class="menu">
        <div class="sidenote">
          <a href="/index/tourn/fields.mhtml?tourn_id=100&event_id=200">Public Forum</a>
          <a href="/index/tourn/fields.mhtml?tourn_id=100&event_id=300">Lincoln Douglas</a>
        </div>
      </div>
    </div>
  `;

  it("extracts event options", () => {
    const events = parseEvents(html, 100);
    expect(events).toEqual([
      { id: 200, name: "Public Forum" },
      { id: 300, name: "Lincoln Douglas" },
    ]);
  });

  it("returns empty for no matching elements", () => {
    expect(parseEvents("<div></div>", 1)).toEqual([]);
  });
});

// ─── parseJudgePools ─────────────────────────────────────────────────────────

describe("parseJudgePools", () => {
  const html = `
    <div id="content">
      <div class="menu">
        <div class="sidenote">
          <div>
            <a href="/index/tourn/judges.mhtml?category_id=10&tourn_id=100">link</a>
            <span>PF Pool</span>
          </div>
          <div>
            <a href="/index/tourn/judges.mhtml?category_id=20&tourn_id=100">link</a>
            <span>LD Pool</span>
          </div>
        </div>
      </div>
    </div>
  `;

  it("extracts judge pool options", () => {
    const pools = parseJudgePools(html, 100);
    expect(pools).toEqual([
      { id: 10, name: "PF Pool" },
      { id: 20, name: "LD Pool" },
    ]);
  });

  it("skips entries without id or name", () => {
    const html = `
      <div id="content"><div class="menu"><div class="sidenote">
        <div><span></span></div>
      </div></div></div>
    `;
    expect(parseJudgePools(html, 1)).toEqual([]);
  });
});

// ─── parseMetadata ───────────────────────────────────────────────────────────

describe("parseMetadata", () => {
  const html = `
    <div id="content">
      <div class="main">
        <h2>Yale Invitational</h2>
        <h5>September 15 2023 — New Haven, CT</h5>
      </div>
    </div>
  `;

  it("extracts tournament name, location, year", () => {
    const meta = parseMetadata(html);
    expect(meta).toEqual({
      name: "Yale Invitational",
      location: "New Haven, CT",
      year: "September",
    });
  });

  it("handles missing subtitle gracefully", () => {
    const meta = parseMetadata('<div id="content"><div class="main"><h2>Test</h2></div></div>');
    expect(meta.name).toBe("Test");
  });
});

// ─── parseEntries ────────────────────────────────────────────────────────────

describe("parseEntries", () => {
  const html = `
    <table>
      <tr><th>School</th><th>Location</th><th>Entry</th><th>Code</th></tr>
      <tr>
        <td>Westview</td>
        <td>OR</td>
        <td>Smith &amp; Jones</td>
        <td>Westview SJ</td>
      </tr>
      <tr>
        <td>Millburn</td>
        <td>NJ</td>
        <td>Lee &amp; Park</td>
        <td>Millburn LP</td>
      </tr>
    </table>
  `;

  it("extracts team last names and codes", () => {
    const entries = parseEntries(html);
    expect(entries).toEqual([
      { lastNames: ["Smith", "Jones"], code: "Westview SJ" },
      { lastNames: ["Lee", "Park"], code: "Millburn LP" },
    ]);
  });

  it("returns empty for no data rows", () => {
    expect(parseEntries("<table><tr><th>Header</th></tr></table>")).toEqual([]);
  });
});

// ─── parseJudgeNames ─────────────────────────────────────────────────────────

describe("parseJudgeNames", () => {
  const html = `
    <table>
      <tr><th>First</th><th>Last</th><th>School</th></tr>
      <tr>
        <td>John</td>
        <td>Doe</td>
        <td>Westview</td>
      </tr>
      <tr>
        <td>Jane</td>
        <td>Smith</td>
        <td>Millburn</td>
      </tr>
    </table>
  `;

  it("extracts judge name parts and computes hashed IDs", () => {
    const judges = parseJudgeNames(html);
    expect(judges).toHaveLength(2);
    expect(judges[0].parts).toEqual(["John", "Doe"]);
    expect(judges[0].hashedId).toBe(getId(["John", "Doe"]));
    expect(judges[1].parts).toEqual(["Jane", "Smith"]);
  });

  it("includes Middle column when present", () => {
    const html = `
      <table>
        <tr><th>First</th><th>Middle</th><th>Last</th></tr>
        <tr><td>John</td><td>Q</td><td>Doe</td></tr>
      </table>
    `;
    const judges = parseJudgeNames(html);
    expect(judges[0].parts).toEqual(["John", "Q", "Doe"]);
    expect(judges[0].hashedId).toBe(getId(["John", "Q", "Doe"]));
  });

  it("skips empty name rows", () => {
    const html = `
      <table>
        <tr><th>First</th><th>Last</th></tr>
        <tr><td></td><td></td></tr>
      </table>
    `;
    expect(parseJudgeNames(html)).toEqual([]);
  });
});

// ─── CURRENT_SEASON ──────────────────────────────────────────────────────────

describe("CURRENT_SEASON", () => {
  it("is set to 2023", () => {
    expect(CURRENT_SEASON).toBe(2023);
  });
});
