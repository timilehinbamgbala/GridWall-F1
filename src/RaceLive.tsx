// RaceLive.tsx — Live race results page using Jolpica F1 API
// Falls back gracefully if the API is unavailable.

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import Nav from "./Nav";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getSchedule,
  getAllResults,
  getNextRace,
  teamColor,
  normalizeConstructorId,
  extractFastestLap,
  formatRaceDate,
  positionText,
  Race,
  RaceResult,
} from "./f1api";

const CDN =
  "https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/d_common:f1:2026:fallback:driver:2026fallbackdriverright.webp/v1740000001/common/f1/2026";
const TEAM_CDN =
  "https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/v1740000001/common/f1/2026";

// Driver image CDN paths (driverId → img path segment)
const DRIVER_IMG: Record<string, string> = {
  antonelli: "mercedes/andant01/2026mercedesandant01right.webp",
  hamilton: "ferrari/lewham01/2026ferrarilewham01right.webp",
  leclerc: "ferrari/chalec01/2026ferrarichalec01right.webp",
  max_verstappen: "redbullracing/maxver01/2026redbullracingmaxver01right.webp",
  hadjar: "redbullracing/isahad01/2026redbullracingisahad01right.webp",
  colapinto: "alpine/fracol01/2026alpinefracol01right.webp",
  lawson: "racingbulls/lialaw01/2026racingbullslialaw01right.webp",
  gasly: "alpine/piegas01/2026alpinepiegas01right.webp",
  sainz: "williams/carsai01/2026williamscarsai01right.webp",
  bearman: "haasf1team/olibea01/2026haasf1teamolibea01right.webp",
  piastri: "mclaren/oscpia01/2026mclarenoscpia01right.webp",
  hulkenberg: "audi/nichul01/2026audinichul01right.webp",
  bortoleto: "audi/gabbor01/2026audigabbor01right.webp",
  ocon: "haasf1team/estoco01/2026haasf1teamestoco01right.webp",
  stroll: "astonmartin/lanstr01/2026astonmartinlanstr01right.webp",
  bottas: "cadillac/valbot01/2026cadillacvalbot01right.webp",
  perez: "cadillac/serper01/2026cadillacserper01right.webp",
  norris: "mclaren/lannor01/2026mclarenlannor01right.webp",
  russell: "mercedes/georus01/2026mercedesgeorus01right.webp",
  alonso: "astonmartin/feralo01/2026astonmartinferalo01right.webp",
  albon: "williams/alealb01/2026williamsalealb01right.webp",
  // Arvid Lindblad — Racing Bulls (Jolpica may use either ID)
  lindblad: "racingbulls/arvlin01/2026racingbullsarvlin01right.webp",
  arvid_lindblad: "racingbulls/arvlin01/2026racingbullsarvlin01right.webp",
};

const TEAM_IMG: Record<string, string> = {
  mercedes: "mercedes/2026mercedeslogo.webp",
  ferrari: "ferrari/2026ferrarilogo.webp",
  red_bull: "redbullracing/2026redbullracinglogo.webp",
  mclaren: "mclaren/2026mclarenlogo.webp",
  alpine: "alpine/2026alpinelogo.webp",
  williams: "williams/2026williamslogo.webp",
  // Liam Lawson / Lindblad — Racing Bulls
  racing_bulls: "racingbulls/2026racingbullslogo.webp",
  haas: "haasf1team/2026haasf1teamlogo.webp",
  aston_martin: "astonmartin/2026astonmartinlogo.webp",
  audi: "audi/2026audilogo.webp",
  cadillac: "cadillac/2026cadillaclogo.webp",
  // Jolpica aliases — map to same paths
  rb: "racingbulls/2026racingbullslogo.webp",
  alphatauri: "racingbulls/2026racingbullslogo.webp",
  kick_sauber: "audi/2026audilogo.webp",
  sauber: "audi/2026audilogo.webp",
};
const INVERT_LOGOS = ["mercedes", "audi", "aston_martin", "cadillac"];

function driverImg(id: string) {
  return DRIVER_IMG[id] ? `${CDN}/${DRIVER_IMG[id]}` : "";
}
function teamImg(id: string) {
  const normalized = normalizeConstructorId(id);
  return TEAM_IMG[normalized] ? `${TEAM_CDN}/${TEAM_IMG[normalized]}` : "";
}

// ── Tyre compound colours ─────────────────────────────────────────────────────
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

// ── hooks ─────────────────────────────────────────────────────────────────────

function useFadeIn(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, vis };
}

// ── Race Switcher ─────────────────────────────────────────────────────────────

function RaceSwitcher({
  races,
  activeRound,
  onChange,
}: {
  races: Race[];
  activeRound: string;
  onChange: (r: string) => void;
}) {
  return (
    <div className="rc-switcher">
      {races.map((r) => (
        <button
          key={r.round}
          className={`rc-switcher-btn${
            r.round === activeRound ? " active" : ""
          }`}
          onClick={() => onChange(r.round)}
        >
          <span className="rc-switcher-round">R{r.round}</span>
          <span className="rc-switcher-name">{r.Circuit.Location.country}</span>
        </button>
      ))}
    </div>
  );
}

// ── Race Header ───────────────────────────────────────────────────────────────

function RaceHeader({ race }: { race: Race }) {
  const winner = race.Results?.[0];
  return (
    <div className="rc-header">
      <div className="rc-header-bg" aria-hidden="true" />
      <div className="rc-header-inner">
        <div className="rc-header-breadcrumb">
          <Link to="/" className="rc-breadcrumb-link">
            GridWall
          </Link>
          <span className="rc-breadcrumb-sep">/</span>
          <span className="rc-breadcrumb-cur">
            {race.Circuit.Location.country} GP
          </span>
        </div>
        <div className="rc-header-meta">
          <span className="rc-header-round">Round {race.round} of 24</span>
          <span className="rc-header-dot" />
          <span className="rc-header-date">{formatRaceDate(race.date)}</span>
          <span className="rc-header-dot" />
          <span className="rc-header-circuit">
            {race.Circuit.circuitName}, {race.Circuit.Location.locality}
          </span>
        </div>
        <h1 className="rc-header-title">{race.raceName}</h1>
        {winner && (
          <div className="rc-header-winner">
            <img
              src={driverImg(winner.Driver.driverId)}
              alt={winner.Driver.familyName}
              className="rc-winner-img"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="rc-winner-meta">
              <span className="rc-winner-label">Race winner</span>
              <span className="rc-winner-name">
                {winner.Driver.givenName} {winner.Driver.familyName}
              </span>
              <span className="rc-winner-detail">
                {winner.Constructor.name} · {winner.laps} laps ·{" "}
                {winner.Time?.time ?? winner.status}
              </span>
            </div>
            <div className="rc-winner-badge">P1</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Results Table ─────────────────────────────────────────────────────────────

function ResultsSection({ race }: { race: Race }) {
  const { ref, vis } = useFadeIn();
  const results = race.Results ?? [];

  const posClass = (pt: string) => {
    if (pt === "1") return "gold";
    if (pt === "2") return "silver";
    if (pt === "3") return "bronze";
    if (pt === "NC" || pt === "DNS" || pt === "DSQ") return "dnf";
    return "";
  };

  return (
    <div
      ref={ref}
      className="rc-fade"
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(22px)",
      }}
    >
      <section className="pw-results-section rc-section">
        <div className="pw-section-header">
          <div>
            <h2 className="pw-section-title">Race result</h2>
          </div>
        </div>
        <div className="pw-race-table-wrap">
          <table className="pw-race-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>Pos</th>
                <th className="pw-col-no" style={{ width: 44 }}>
                  No
                </th>
                <th>Driver</th>
                <th className="pw-col-team">Team</th>
                <th
                  className="pw-col-laps"
                  style={{ width: 52, textAlign: "center" }}
                >
                  Laps
                </th>
                <th className="r">Time / Status</th>
                <th className="r" style={{ width: 48 }}>
                  Pts
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const pt = positionText(r);
                const dnf = pt === "NC" || pt === "DNS" || pt === "DSQ";
                const col = teamColor(r.Constructor.constructorId);
                return (
                  <tr
                    key={r.Driver.driverId}
                    className="pw-race-row"
                    style={{ animationDelay: `${i * 0.025}s` }}
                  >
                    <td>
                      <span className={`pw-pos ${posClass(pt)}`}>
                        {pt === "NC" || pt === "DNS" ? pt : pt.padStart(2, "0")}
                      </span>
                    </td>
                    <td className="pw-col-no">
                      <span className="pw-num">
                        <span
                          className="pw-num-stripe"
                          style={{ background: col }}
                        />
                        {r.Driver.permanentNumber}
                      </span>
                    </td>
                    <td>
                      <div className="pw-driver-cell">
                        <img
                          src={driverImg(r.Driver.driverId)}
                          alt={r.Driver.familyName}
                          className={`pw-driver-img${dnf ? " dnf" : ""}`}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                        <div className="pw-driver-meta">
                          <span className="pw-driver-name">
                            {r.Driver.givenName} {r.Driver.familyName}
                            {r.FastestLap?.rank === "1" && (
                              <span className="rc-fl-badge">FL</span>
                            )}
                          </span>
                          <span className="pw-driver-abbr">
                            {r.Driver.code}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="pw-col-team">
                      <div className="pw-team-cell">
                        <img
                          src={teamImg(r.Constructor.constructorId)}
                          alt={r.Constructor.name}
                          className={`pw-team-img${
                            INVERT_LOGOS.includes(
                              normalizeConstructorId(
                                r.Constructor.constructorId
                              )
                            )
                              ? " invert"
                              : ""
                          }`}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                        <span className="pw-team-name">
                          {r.Constructor.name}
                        </span>
                      </div>
                    </td>
                    <td className="pw-col-laps pw-laps">{r.laps || "—"}</td>
                    <td
                      className={`pw-time${
                        pt === "1" ? " leader" : dnf ? " dnf-text" : ""
                      }`}
                    >
                      {r.Time?.time ?? r.status}
                    </td>
                    <td
                      className={`pw-pts-cell${
                        r.points === "0" ? " zero" : ""
                      }`}
                    >
                      {r.points === "0" ? "—" : r.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ── Key Stats ─────────────────────────────────────────────────────────────────

function KeyStatsSection({ race }: { race: Race }) {
  const { ref, vis } = useFadeIn();
  const results = race.Results ?? [];
  const fl = extractFastestLap(results);

  // Most overtakes: driver who gained the most positions from grid to finish
  const gridVsFinish = results
    .map((r) => ({
      name: r.Driver.familyName,
      gain: parseInt(r.grid) - parseInt(r.position),
    }))
    .filter((x) => !isNaN(x.gain) && x.gain > 0);
  const mover = gridVsFinish.sort((a, b) => b.gain - a.gain)[0];

  // Circuit image for Total Laps stat
  const circuitImgUrl = `https://media.formula1.com/image/upload/f_auto/q_auto/v1677244924/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/${race.Circuit.Location.country.replace(
    / /g,
    "_"
  )}_Circuit.png`;

  const stats = [
    {
      label: "Fastest Lap",
      value: fl?.time ?? "—",
      sub: fl ? `${fl.driver} · Lap ${fl.lap}` : "No data",
      iconUrl: "/fastest-lap.png",
      iconAlt: "Fastest lap",
      color: "#A855F7",
    },
    {
      label: "Total Laps",
      value: race.Results?.[0]?.laps ?? "—",
      sub: race.Circuit.circuitName,
      iconUrl: circuitImgUrl,
      iconAlt: race.Circuit.circuitName,
      color: "#00D2BE",
      isCircuit: true,
    },
    {
      label: "Most Overtakes",
      value: mover ? `+${mover.gain}` : "—",
      sub: mover ? `${mover.name}` : "No data",
      iconUrl: "/overtakes.png",
      iconAlt: "Overtakes",
      color: "#10B981",
    },
    {
      label: "Race Date",
      value: new Date(race.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      sub: race.Circuit.Location.country,
      iconUrl: "/calendar.png",
      iconAlt: "Race date",
      color: "#F59E0B",
    },
  ];

  return (
    <div
      ref={ref}
      className="rc-fade"
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(22px)",
      }}
    >
      <section className="rc-section rc-stats-section">
        <div className="pw-section-header">
          <div>
            <h2 className="pw-section-title">Key stats</h2>
          </div>
        </div>
        <div className="rc-stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="rc-stat-card">
              <div
                className={`rc-stat-icon-img${
                  s.isCircuit ? " rc-stat-icon-circuit" : ""
                }`}
              >
                <img
                  src={s.iconUrl}
                  alt={s.iconAlt}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div className="rc-stat-label">{s.label}</div>
              <div className="rc-stat-value" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="rc-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Next Race Countdown ────────────────────────────────────────────────────────

function NextRaceCountdown() {
  const [next, setNext] = useState<Race | null>(null);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Auto-refresh next race every 60s to catch GP transitions
  useEffect(() => {
    const fetchNext = () => getNextRace().then(setNext);
    fetchNext();
    const id = setInterval(fetchNext, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!next) return;
    const raceTime = next.time
      ? new Date(`${next.date}T${next.time}`)
      : new Date(`${next.date}T13:00:00Z`);
    const tick = () => {
      const d = Math.max(0, raceTime.getTime() - Date.now());
      setCountdown({
        days: Math.floor(d / 86400000),
        hours: Math.floor((d % 86400000) / 3600000),
        minutes: Math.floor((d % 3600000) / 60000),
        seconds: Math.floor((d % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [next]);

  if (!next) return null;

  const units = [
    { num: String(countdown.days).padStart(2, "0"), label: "Days" },
    { num: String(countdown.hours).padStart(2, "0"), label: "Hrs" },
    { num: String(countdown.minutes).padStart(2, "0"), label: "Min" },
    { num: String(countdown.seconds).padStart(2, "0"), label: "Sec" },
  ];

  return (
    <div className="rl-next-banner">
      <div className="rl-next-label">
        <span className="pw-section-label">Next Race · Round {next.round}</span>
        <span className="rl-next-name">{next.raceName}</span>
        <span className="rl-next-circuit">
          {next.Circuit.circuitName} · {formatRaceDate(next.date)}
        </span>
      </div>
      <div className="pw-countdown">
        {units.map((u) => (
          <div key={u.label} className="pw-countdown-unit">
            <div className="pw-countdown-num">{u.num}</div>
            <span className="pw-countdown-label">{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Loading / Error states ─────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="rl-state">
      <div className="rl-state-spinner" aria-hidden="true">
        <div className="rl-spinner-ring" />
      </div>
      <div className="rl-state-text">Loading race data...</div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rl-state">
      <div className="rl-state-text">Could not load race data</div>
      <button className="rl-retry-btn" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RaceLive() {
  const [completedRaces, setCompletedRaces] = useState<Race[]>([]);
  const [activeRound, setActiveRound] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const all = await getAllResults("2026");
      if (!all.length) throw new Error("No data");
      const done = all.filter((r) => r.Results && r.Results.length > 0);
      setCompletedRaces(done);
      setLastUpdated(new Date());
      // Default to most recent race, but don't override user selection
      if (done.length > 0) {
        setActiveRound((prev) => prev || done[done.length - 1].round);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Initial load + auto-refresh every 60 seconds
  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const activeRace = completedRaces.find((r) => r.round === activeRound);

  return (
    <div className="pw-root">
      <header>
        <Nav />
      </header>
      <main>
        {/* Next race countdown banner */}
        <div style={{ paddingTop: 56 }}>
          <NextRaceCountdown />
        </div>

        {loading && completedRaces.length === 0 && <LoadingState />}
        {error && <ErrorState onRetry={load} />}

        {completedRaces.length > 0 && (
          <>
            {activeRace && <RaceHeader race={activeRace} />}
            <RaceSwitcher
              races={completedRaces}
              activeRound={activeRound}
              onChange={setActiveRound}
            />
            {activeRace && (
              <>
                <ResultsSection race={activeRace} />
                <KeyStatsSection race={activeRace} />
              </>
            )}
            {lastUpdated && (
              <div className="rl-last-updated">
                Last updated {lastUpdated.toLocaleTimeString()} · Auto-refreshes
                every 60s
              </div>
            )}
          </>
        )}
      </main>
      <footer>
        <div className="pw-footer">
          <span className="pw-footer-logo">GridWall</span>
          <span className="pw-footer-copy">
            Data via Jolpica F1 API · 2026 FIA Formula One World Championship ·
            Not affiliated with Formula One Group.
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
