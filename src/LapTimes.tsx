// LapTimes.tsx — Post-race lap-by-lap timing sheet, per driver.
// Data: OpenF1 API (free, no auth) — /sessions, /drivers, /laps, /stints, /pit
// Layout inspired by MotoGP chronological timing sheets, adapted to F1's
// 3-sector data (no 4th sector) and grouped by tyre stint per driver.
//
// NOTE: this is a post-race page, not live timing — OpenF1 data lags a few
// minutes behind the chequered flag, so we default to the most recently
// completed Race session rather than polling during a live session.

import { useState, useEffect, useMemo, useCallback } from "react";
import "./App.css";
import Nav from "./Nav";
import { normalizeConstructorId, teamColor } from "./f1api";

const OPENF1 = "https://api.openf1.org/v1";

// ── 2026 driver headshots — same F1 media CDN pattern used on the Race page,
// keyed by the 3-letter acronym OpenF1 gives us (name_acronym) so we don't
// depend on OpenF1's own (often stale) headshot_url. ──────────────────────
const CDN =
  "https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/v1740000001/common/f1/2026";
const ACRONYM_DRIVER_IMG: Record<string, string> = {
  ANT: "mercedes/andant01/2026mercedesandant01right.webp",
  HAM: "ferrari/lewham01/2026ferrarilewham01right.webp",
  LEC: "ferrari/chalec01/2026ferrarichalec01right.webp",
  VER: "redbullracing/maxver01/2026redbullracingmaxver01right.webp",
  HAD: "redbullracing/isahad01/2026redbullracingisahad01right.webp",
  COL: "alpine/fracol01/2026alpinefracol01right.webp",
  LAW: "racingbulls/lialaw01/2026racingbullslialaw01right.webp",
  GAS: "alpine/piegas01/2026alpinepiegas01right.webp",
  SAI: "williams/carsai01/2026williamscarsai01right.webp",
  BEA: "haasf1team/olibea01/2026haasf1teamolibea01right.webp",
  PIA: "mclaren/oscpia01/2026mclarenoscpia01right.webp",
  HUL: "audi/nichul01/2026audinichul01right.webp",
  BOR: "audi/gabbor01/2026audigabbor01right.webp",
  OCO: "haasf1team/estoco01/2026haasf1teamestoco01right.webp",
  STR: "astonmartin/lanstr01/2026astonmartinlanstr01right.webp",
  BOT: "cadillac/valbot01/2026cadillacvalbot01right.webp",
  PER: "cadillac/serper01/2026cadillacserper01right.webp",
  NOR: "mclaren/lannor01/2026mclarenlannor01right.webp",
  RUS: "mercedes/georus01/2026mercedesgeorus01right.webp",
  ALO: "astonmartin/feralo01/2026astonmartinferalo01right.webp",
  ALB: "williams/alealb01/2026williamsalealb01right.webp",
  LIN: "racingbulls/arvlin01/2026racingbullsarvlin01right.webp",
};
function driverHeadshot(acronym: string): string | undefined {
  const path = ACRONYM_DRIVER_IMG[(acronym || "").toUpperCase()];
  return path ? `${CDN}/${path}` : undefined;
}

// ── Tyre compound colours (kept in sync with RaceLive.tsx) ───────────────────
const COMPOUND_COLOR: Record<string, string> = {
  SOFT: "#E8002D",
  MEDIUM: "#FFC906",
  HARD: "#FFFFFF",
  INTERMEDIATE: "#39B54A",
  WET: "#0067FF",
  UNKNOWN: "#888",
};
function compoundColor(c: string) {
  return COMPOUND_COLOR[c?.toUpperCase()] ?? COMPOUND_COLOR.UNKNOWN;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Session {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  location: string;
  country_name: string;
  year: number;
}

interface DriverInfo {
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url?: string;
}

interface Lap {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  st_speed?: number | null;
  is_pit_out_lap: boolean;
}

interface Stint {
  driver_number: number;
  stint_number: number;
  compound: string;
  lap_start: number;
  lap_end: number;
  tyre_age_at_start: number;
}

interface PitStop {
  driver_number: number;
  lap_number: number;
  pit_duration: number | null;
}

// ── Fetch helper (no key needed, but be gentle — small in-memory cache) ─────
const cache: Record<string, any> = {};
async function getJSON(url: string): Promise<any[]> {
  if (cache[url]) return cache[url];
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cache[url] = data;
    return data;
  } catch (e) {
    console.warn("[openf1] fetch failed:", url, e);
    return [];
  }
}

// ── Format helpers ───────────────────────────────────────────────────────────

function fmtLapTime(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = (seconds - m * 60).toFixed(3);
  return m > 0 ? `${m}'${s.padStart(6, "0")}` : s;
}

function fmtSector(seconds: number | null): string {
  if (seconds == null) return "—";
  return seconds.toFixed(3);
}

// ── Session switcher ─────────────────────────────────────────────────────────

function SessionSwitcher({
  sessions,
  activeKey,
  onChange,
}: {
  sessions: Session[];
  activeKey: number | null;
  onChange: (k: number) => void;
}) {
  return (
    <div className="rc-switcher">
      {sessions.map((s) => (
        <button
          key={s.session_key}
          className={`rc-switcher-btn${
            s.session_key === activeKey ? " active" : ""
          }`}
          onClick={() => onChange(s.session_key)}
        >
          <span className="rc-switcher-round">
            {new Date(s.date_start).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            })}
          </span>
          <span className="rc-switcher-name">{s.country_name}</span>
        </button>
      ))}
    </div>
  );
}

// ── One driver's stint block (a group of consecutive laps on one compound) ──

function StintBlock({
  stint,
  laps,
  pitLapSet,
  pitDurations,
  hadRealStop,
}: {
  stint: Stint | null;
  laps: Lap[];
  pitLapSet: Set<number>;
  pitDurations: Record<number, number>;
  hadRealStop: boolean;
}) {
  if (!laps.length) return null;
  const compound = stint?.compound ?? "UNKNOWN";
  const label = stint
    ? `Stint ${stint.stint_number} · ${compound.charAt(0)}${compound
        .slice(1)
        .toLowerCase()}`
    : `${compound.charAt(0)}${compound.slice(1).toLowerCase()}`;

  return (
    <div className="lt-stint">
      <div
        className="lt-stint-label"
        style={{ borderLeftColor: compoundColor(compound) }}
      >
        <span
          className="lt-compound-dot"
          style={{ background: compoundColor(compound) }}
        />
        {label}
        {stint && (
          <span className="lt-stint-sub">
            Laps {stint.lap_start}–{stint.lap_end}
            {stint.tyre_age_at_start > 0 &&
              ` · started on lap ${stint.tyre_age_at_start}-old tyres`}
            {stint.stint_number > 1 &&
              !hadRealStop &&
              " · no pit stop — tyre change under red flag/stoppage"}
          </span>
        )}
      </div>
      <table className="lt-lap-table" style={{ width: "100%", tableLayout: "auto" }}>
        <thead>
          <tr>
            <th className="lt-col-lap">Lap</th>
            <th className="lt-col-time">Lap Time</th>
            <th>S1</th>
            <th>S2</th>
            <th>S3</th>
            <th className="lt-col-speed">Speed</th>
          </tr>
        </thead>
        <tbody>
          {laps.map((lap) => {
            const cancelled = lap.lap_duration == null || lap.is_pit_out_lap;
            const pitted = pitLapSet.has(lap.lap_number);
            return (
              <tr
                key={lap.lap_number}
                className={cancelled ? "lt-row-cancelled" : ""}
              >
                <td className="lt-col-lap">
                  {lap.lap_number}
                  {pitted && <span className="lt-pit-badge">PIT</span>}
                </td>
                <td className="lt-col-time">
                  {fmtLapTime(lap.lap_duration)}
                  {pitted && pitDurations[lap.lap_number] != null && (
                    <span className="lt-pit-duration">
                      {" "}
                      (+{pitDurations[lap.lap_number].toFixed(1)}s pit)
                    </span>
                  )}
                </td>
                <td>{fmtSector(lap.duration_sector_1)}</td>
                <td>{fmtSector(lap.duration_sector_2)}</td>
                <td>{fmtSector(lap.duration_sector_3)}</td>
                <td className="lt-col-speed">
                  {lap.st_speed ? `${lap.st_speed}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── One driver's expandable panel ────────────────────────────────────────────

function DriverPanel({
  driver,
  laps,
  stints,
  pits,
  open,
  onToggle,
}: {
  driver: DriverInfo;
  laps: Lap[];
  stints: Stint[];
  pits: PitStop[];
  open: boolean;
  onToggle: () => void;
}) {
  const teamId = normalizeConstructorId(
    (driver.team_name || "").toLowerCase().replace(/\s+/g, "_")
  );
  const accent = driver.team_colour ? `#${driver.team_colour}` : teamColor(teamId);

  // De-dupe /pit entries by lap number — OpenF1 occasionally returns more
  // than one row for the same physical stop.
  const dedupedPits = useMemo(() => {
    const byLap = new Map<number, PitStop>();
    pits.forEach((p) => byLap.set(p.lap_number, p));
    return Array.from(byLap.values());
  }, [pits]);

  const pitLapSet = useMemo(
    () => new Set(dedupedPits.map((p) => p.lap_number)),
    [dedupedPits]
  );
  const pitDurations = useMemo(() => {
    const m: Record<number, number> = {};
    dedupedPits.forEach((p) => {
      if (p.pit_duration != null) m[p.lap_number] = p.pit_duration;
    });
    return m;
  }, [dedupedPits]);

  // Group laps by stint using lap_start/lap_end ranges. Stint numbering
  // resets after red flags/restarts — and OpenF1 also bumps stint_number
  // for a tyre change made during a red flag/stoppage even when the car
  // never passed through the pit lane, so a stint boundary is only a real
  // pit stop when a matching /pit entry exists at or near that lap.
  const groups = useMemo(() => {
    const sortedStints = [...stints].sort((a, b) => a.lap_start - b.lap_start);
    if (!sortedStints.length) {
      // Driver with no stint data at all — show every lap ungrouped.
      return [{ stint: null as Stint | null, laps, hadRealStop: true }];
    }
    const out: { stint: Stint | null; laps: Lap[]; hadRealStop: boolean }[] = [];
    sortedStints.forEach((stint) => {
      const inRange = laps.filter(
        (l) => l.lap_number >= stint.lap_start && l.lap_number <= stint.lap_end
      );
      // A real pit stop for this stint shows up as a /pit entry on the lap
      // just before this stint started (±1 lap for OpenF1 timing jitter).
      const hadRealStop = dedupedPits.some(
        (p) => Math.abs(p.lap_number - (stint.lap_start - 1)) <= 1
      );
      out.push({ stint, laps: inRange, hadRealStop });
    });
    // Any laps not covered by a stint window (e.g. a driver who never
    // registered a pit stop, or a gap around a red flag) get their own
    // trailing/leading group so no lap silently disappears.
    const covered = new Set(out.flatMap((g) => g.laps.map((l) => l.lap_number)));
    const leftover = laps.filter((l) => !covered.has(l.lap_number));
    if (leftover.length) out.push({ stint: null, laps: leftover, hadRealStop: true });
    return out.filter((g) => g.laps.length);
  }, [stints, laps, dedupedPits]);

  const validLaps = laps.filter((l) => l.lap_duration != null);
  const fastest = validLaps.length
    ? Math.min(...validLaps.map((l) => l.lap_duration as number))
    : null;
  const realPitStops = dedupedPits.length;

  return (
    <div
      className="lt-panel"
      style={{ borderLeft: `3px solid ${accent}`, width: "100%" }}
    >
      <button
        className="lt-panel-header"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <span className="lt-panel-number" style={{ color: accent, flexShrink: 0 }}>
          {driver.driver_number}
        </span>
        {(driverHeadshot(driver.name_acronym) || driver.headshot_url) && (
          <div
            className="lt-headshot-wrap"
            style={{
              width: 46,
              height: 46,
              minWidth: 46,
              borderRadius: 8,
              overflow: "hidden",
              background: "#0c0b0b",
              flexShrink: 0,
            }}
          >
            <img
              src={driverHeadshot(driver.name_acronym) || driver.headshot_url}
              alt=""
              className="lt-panel-headshot"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                transform: "scale(1.9) translateY(6%)",
                transformOrigin: "top center",
              }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.parentElement) img.parentElement.style.display = "none";
              }}
            />
          </div>
        )}
        <span className="lt-panel-name" style={{ flexShrink: 0 }}>
          {driver.full_name}
        </span>
        <span className="lt-panel-team" style={{ flex: 1 }}>{driver.team_name}</span>
        <span className="lt-panel-meta" style={{ flexShrink: 0 }}>
          {laps.length} laps
          {fastest != null && ` · best ${fmtLapTime(fastest)}`}
          {` · ${realPitStops} pit stop${realPitStops === 1 ? "" : "s"}`}
        </span>
        <span className={`lt-panel-chevron${open ? " open" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="lt-panel-body" style={{ width: "100%" }}>
          {groups.map((g, i) => (
            <StintBlock
              key={g.stint ? `s${g.stint.stint_number}` : `u${i}`}
              stint={g.stint}
              laps={g.laps}
              pitLapSet={pitLapSet}
              pitDurations={pitDurations}
              hadRealStop={g.hadRealStop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Loading / error states ───────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="rl-state">
      <div className="rl-state-spinner" aria-hidden="true">
        <div className="rl-spinner-ring" />
      </div>
      <div className="rl-state-text">Loading lap data...</div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rl-state">
      <div className="rl-state-text">Could not load lap data</div>
      <button className="rl-retry-btn" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LapTimes() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [stints, setStints] = useState<Stint[]>([]);
  const [pits, setPits] = useState<PitStop[]>([]);
  const [openDriver, setOpenDriver] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Load the list of completed Race sessions once.
  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getJSON(
        `${OPENF1}/sessions?year=2026&session_name=Race`
      );
      const now = Date.now();
      const completed: Session[] = (data as Session[])
        .filter((s) => new Date(s.date_end).getTime() < now)
        .sort(
          (a, b) =>
            new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
        );
      if (!completed.length) throw new Error("No completed races yet");
      setSessions(completed);
      setActiveKey((prev) => prev ?? completed[completed.length - 1].session_key);
    } catch {
      setError(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load driver/lap/stint/pit data for the active session.
  useEffect(() => {
    if (activeKey == null) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const [driverData, lapData, stintData, pitData] = await Promise.all([
          getJSON(`${OPENF1}/drivers?session_key=${activeKey}`),
          getJSON(`${OPENF1}/laps?session_key=${activeKey}`),
          getJSON(`${OPENF1}/stints?session_key=${activeKey}`),
          getJSON(`${OPENF1}/pit?session_key=${activeKey}`),
        ]);
        if (cancelled) return;
        if (!driverData.length && !lapData.length) {
          throw new Error("No lap data for this session yet");
        }
        // De-dupe drivers by driver_number (OpenF1 can return dupes).
        const byNum = new Map<number, DriverInfo>();
        (driverData as DriverInfo[]).forEach((d) => byNum.set(d.driver_number, d));
        const driverList = Array.from(byNum.values()).sort(
          (a, b) => a.driver_number - b.driver_number
        );
        setDrivers(driverList);
        setLaps(lapData as Lap[]);
        setStints(stintData as Stint[]);
        setPits(pitData as PitStop[]);
        setOpenDriver((prev) => prev ?? driverList[0]?.driver_number ?? null);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeKey]);

  const activeSession = sessions.find((s) => s.session_key === activeKey);

  return (
    <div className="pw-root">
      <header>
        <Nav />
      </header>
      <main>
        <div style={{ paddingTop: 88 }}>
          <div className="rc-header-breadcrumb" style={{ padding: "0 40px" }}>
            <span className="pw-section-label">Lap Times</span>
          </div>
          {activeSession && (
            <h1 className="rc-header-title" style={{ padding: "0 40px" }}>
              {activeSession.country_name} — Chronological Lap Analysis
            </h1>
          )}
        </div>

        {sessions.length > 0 && (
          <SessionSwitcher
            sessions={sessions}
            activeKey={activeKey}
            onChange={(k) => {
              setActiveKey(k);
              setOpenDriver(null);
              setDrivers([]);
              setLaps([]);
              setStints([]);
              setPits([]);
            }}
          />
        )}

        {loading && drivers.length === 0 && <LoadingState />}
        {error && drivers.length === 0 && (
          <ErrorState
            onRetry={() => (activeKey ? setActiveKey(activeKey) : loadSessions())}
          />
        )}

        {!loading && !error && drivers.length > 0 && (
          <section className="rc-section" style={{ maxWidth: "1600px", width: "100%" }}>
            <div className="lt-legend">
              <span className="lt-legend-item">
                <span className="lt-legend-swatch lt-row-cancelled" /> Cancelled /
                invalid lap
              </span>
              <span className="lt-legend-item">
                <span className="lt-pit-badge">PIT</span> Pit stop this lap
              </span>
            </div>
            <div className="lt-panel-list" style={{ width: "100%" }}>
              {drivers.map((d) => (
                <DriverPanel
                  key={d.driver_number}
                  driver={d}
                  laps={laps
                    .filter((l) => l.driver_number === d.driver_number)
                    .sort((a, b) => a.lap_number - b.lap_number)}
                  stints={stints.filter(
                    (s) => s.driver_number === d.driver_number
                  )}
                  pits={pits.filter((p) => p.driver_number === d.driver_number)}
                  open={openDriver === d.driver_number}
                  onToggle={() =>
                    setOpenDriver((prev) =>
                      prev === d.driver_number ? null : d.driver_number
                    )
                  }
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <footer>
        <div className="pw-footer">
          <span className="pw-footer-logo">GridWall</span>
          <span className="pw-footer-copy">
            Data via OpenF1 API · 2026 FIA Formula One World Championship · Not
            affiliated with Formula One Group.
          </span>
          <ul className="pw-footer-links">
            <li>
              <a href="#">Twitter</a>
            </li>
            <li>
              <a href="#">Reddit</a>
            </li>
            <li>
              <a href="#">Privacy</a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
