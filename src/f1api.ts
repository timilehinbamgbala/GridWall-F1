// ─── GridWall F1 Data Service ─────────────────────────────────────────────────
// Uses the Jolpica API (free, no key, Ergast-compatible)
// https://api.jolpi.ca/ergast/f1/
//
// All functions return null on failure so the UI can show a fallback gracefully.

const BASE = "https://api.jolpi.ca/ergast/f1";

// Simple in-memory cache so we don't hammer the API
const cache: Record<string, { data: any; ts: number }> = {};
const TTL = 5 * 60 * 1000; // 5 minutes

async function get(url: string): Promise<any | null> {
  if (cache[url] && Date.now() - cache[url].ts < TTL) {
    return cache[url].data;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    cache[url] = { data: json, ts: Date.now() };
    return json;
  } catch (e) {
    console.warn("[f1api] fetch failed:", url, e);
    return null;
  }
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface RaceResult {
  position: string; // "1", "2", ... or "R" for retirement
  positionText: string; // "1", "R", "D" (DSQ), etc.
  number: string; // car number
  points: string;
  Driver: {
    driverId: string;
    permanentNumber: string;
    code: string; // "HAM", "VER", etc.
    givenName: string;
    familyName: string;
    nationality: string;
  };
  Constructor: {
    constructorId: string;
    name: string;
    nationality: string;
  };
  grid: string;
  laps: string;
  status: string; // "Finished", "+1 Lap", "Engine", etc.
  Time?: { millis: string; time: string };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: { time: string };
    AverageSpeed: { units: string; speed: string };
  };
}

export interface Race {
  season: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    circuitName: string;
    Location: { locality: string; country: string };
  };
  date: string;
  time?: string; // UTC time e.g. "13:00:00Z"
  Results?: RaceResult[];
}

export interface DriverStanding {
  position: string;
  points: string;
  wins: string;
  Driver: {
    driverId: string;
    code: string;
    givenName: string;
    familyName: string;
    nationality: string;
  };
  Constructors: { constructorId: string; name: string }[];
}

// ─── TEAM COLORS (constructorId → hex) ───────────────────────────────────────

export const TEAM_COLORS: Record<string, string> = {
  mercedes: "#00D2BE",
  ferrari: "#E8002D",
  red_bull: "#3671C6",
  mclaren: "#FF8000",
  alpine: "#FF87BC",
  williams: "#64C4FF",
  racing_bulls: "#6692FF",
  haas: "#B6BABD",
  aston_martin: "#358C75",
  sauber: "#C2C500",
  audi: "#C2C500",
  cadillac: "#FFFFFF",
  kick_sauber: "#C2C500",
};

// Jolpica has used multiple IDs for the same team across seasons.
// Normalise to the canonical key used in TEAM_COLORS / TEAM_IMG maps.
export function normalizeConstructorId(id: string): string {
  const aliases: Record<string, string> = {
    rb: "racing_bulls", // Racing Bulls 2024 name
    alphatauri: "racing_bulls",
    toro_rosso: "racing_bulls",
    visa_cash_app_rb: "racing_bulls",
    kick_sauber: "audi", // became Audi in 2026
    sauber: "audi",
    alfa: "audi",
    alfa_romeo: "audi",
    andretti: "cadillac", // Cadillac/Andretti same team
  };
  return aliases[id] ?? id;
}

export function teamColor(constructorId: string): string {
  return TEAM_COLORS[normalizeConstructorId(constructorId)] ?? "#888";
}

// ─── SEASON SCHEDULE ─────────────────────────────────────────────────────────

export async function getSchedule(season = "2026"): Promise<Race[]> {
  const data = await get(`${BASE}/${season}.json?limit=30`);
  return data?.MRData?.RaceTable?.Races ?? [];
}

// ─── NEXT RACE ────────────────────────────────────────────────────────────────

export async function getNextRace(season = "2026"): Promise<Race | null> {
  const races = await getSchedule(season);
  if (!races.length) return null;
  const now = Date.now();
  const upcoming = races.filter((r) => {
    const raceTime = r.time
      ? new Date(`${r.date}T${r.time}`)
      : new Date(`${r.date}T13:00:00Z`);
    return raceTime.getTime() > now;
  });
  return upcoming[0] ?? null;
}

// ─── RACE RESULTS ─────────────────────────────────────────────────────────────

export async function getRaceResults(
  season = "2026",
  round: string | number
): Promise<Race | null> {
  const data = await get(`${BASE}/${season}/${round}/results.json?limit=30`);
  const races: Race[] = data?.MRData?.RaceTable?.Races ?? [];
  return races[0] ?? null;
}

// ─── ALL COMPLETED RACE RESULTS FOR SEASON ────────────────────────────────────
// Jolpica paginates result *rows* (not races). A single bulk call with
// limit=500 truncates races beyond row 500 (25 races × 20 drivers).
// Fix: fetch schedule first, then one request per completed round so every
// race always returns its full 20-driver grid.

export async function getAllResults(season = "2026"): Promise<Race[]> {
  const schedule = await getSchedule(season);
  if (!schedule.length) return [];

  const now = Date.now();
  // Only fetch rounds whose race date has already passed
  const pastRounds = schedule.filter((r) => {
    const raceTime = r.time
      ? new Date(`${r.date}T${r.time}`)
      : new Date(`${r.date}T15:00:00Z`);
    return raceTime.getTime() < now;
  });

  // Fan out one request per completed round
  const results = await Promise.all(
    pastRounds.map((r) => getRaceResults(season, r.round))
  );

  // Drop nulls and rounds with no results yet
  return results.filter(
    (r): r is Race => r !== null && (r.Results?.length ?? 0) > 0
  );
}

// ─── DRIVER STANDINGS ─────────────────────────────────────────────────────────

export async function getDriverStandings(
  season = "2026"
): Promise<DriverStanding[]> {
  const data = await get(`${BASE}/${season}/driverStandings.json`);
  const lists = data?.MRData?.StandingsTable?.StandingsLists ?? [];
  return lists[0]?.DriverStandings ?? [];
}

// ─── FASTEST LAP IN A RACE ────────────────────────────────────────────────────

export function extractFastestLap(
  results: RaceResult[]
): { driver: string; time: string; lap: string } | null {
  const fl = results.find((r) => r.FastestLap?.rank === "1");
  if (!fl?.FastestLap) return null;
  return {
    driver: `${fl.Driver.givenName} ${fl.Driver.familyName}`,
    time: fl.FastestLap.Time.time,
    lap: fl.FastestLap.lap,
  };
}

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────

export function formatRaceDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function isFinished(status: string): boolean {
  return status === "Finished" || status.startsWith("+");
}

export function positionText(result: RaceResult): string {
  if (result.positionText === "R") return "NC";
  if (result.positionText === "D") return "DSQ";
  if (result.positionText === "W") return "DNS";
  return result.positionText;
}
