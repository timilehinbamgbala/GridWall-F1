import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./App.css";
import Nav from "./Nav";
import {
  getDriverStandings,
  getNextRace,
  getAllResults,
  teamColor,
  formatRaceDate,
  DriverStanding,
  Race,
} from "./f1api";

const CDN =
  "https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/d_common:f1:2026:fallback:driver:2026fallbackdriverright.webp/v1740000001/common/f1/2026";
const TEAM_CDN =
  "https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/v1740000001/common/f1/2026";

const INVERT_TEAMS = ["Mercedes", "Audi", "Aston Martin", "Cadillac"];

// driver image map — includes all driverId variants the API may return
const DRIVER_IMGS: Record<string, string> = {
  antonelli: `${CDN}/mercedes/andant01/2026mercedesandant01right.webp`,
  kimi_antonelli: `${CDN}/mercedes/andant01/2026mercedesandant01right.webp`,
  hamilton: `${CDN}/ferrari/lewham01/2026ferrarilewham01right.webp`,
  leclerc: `${CDN}/ferrari/chalec01/2026ferrarichalec01right.webp`,
  russell: `${CDN}/mercedes/georus01/2026mercedesgeorus01right.webp`,
  norris: `${CDN}/mclaren/lannor01/2026mclarenlannor01right.webp`,
  piastri: `${CDN}/mclaren/oscpia01/2026mclarenoscpia01right.webp`,
  max_verstappen: `${CDN}/redbullracing/maxver01/2026redbullracingmaxver01right.webp`,
  verstappen: `${CDN}/redbullracing/maxver01/2026redbullracingmaxver01right.webp`,
  gasly: `${CDN}/alpine/piegas01/2026alpinepiegas01right.webp`,
  hadjar: `${CDN}/redbullracing/isahad01/2026redbullracingisahad01right.webp`,
  isack_hadjar: `${CDN}/redbullracing/isahad01/2026redbullracingisahad01right.webp`,
  colapinto: `${CDN}/alpine/fracol01/2026alpinefracol01right.webp`,
  franco_colapinto: `${CDN}/alpine/fracol01/2026alpinefracol01right.webp`,
  sainz: `${CDN}/williams/carsai01/2026williamscarsai01right.webp`,
  lawson: `${CDN}/racingbulls/lialaw01/2026racingbullslialaw01right.webp`,
  liam_lawson: `${CDN}/racingbulls/lialaw01/2026racingbullslialaw01right.webp`,
  bearman: `${CDN}/haasf1team/olibea01/2026haasf1teamolibea01right.webp`,
  oliver_bearman: `${CDN}/haasf1team/olibea01/2026haasf1teamolibea01right.webp`,
  bortoleto: `${CDN}/audi/gabbor01/2026audigabbor01right.webp`,
  hulkenberg: `${CDN}/audi/nichul01/2026audinichul01right.webp`,
  ocon: `${CDN}/haasf1team/estoco01/2026haasf1teamestoco01right.webp`,
  albon: `${CDN}/williams/alealb01/2026williamsalealb01right.webp`,
  stroll: `${CDN}/astonmartin/lanstr01/2026astonmartinlanstr01right.webp`,
  alonso: `${CDN}/astonmartin/feralo01/2026astonmartinferalo01right.webp`,
  bottas: `${CDN}/cadillac/valbot01/2026cadillacvalbot01right.webp`,
  perez: `${CDN}/cadillac/serper01/2026cadillacserper01right.webp`,
  lindblad: `${CDN}/racingbulls/arvlin01/2026racingbullsarvlin01right.webp`,
  arvid_lindblad: `${CDN}/racingbulls/arvlin01/2026racingbullsarvlin01right.webp`,
};

// also map by driver code (3-letter) as fallback
const DRIVER_IMGS_BY_CODE: Record<string, string> = {
  ANT: `${CDN}/mercedes/andant01/2026mercedesandant01right.webp`,
  HAM: `${CDN}/ferrari/lewham01/2026ferrarilewham01right.webp`,
  LEC: `${CDN}/ferrari/chalec01/2026ferrarichalec01right.webp`,
  RUS: `${CDN}/mercedes/georus01/2026mercedesgeorus01right.webp`,
  NOR: `${CDN}/mclaren/lannor01/2026mclarenlannor01right.webp`,
  PIA: `${CDN}/mclaren/oscpia01/2026mclarenoscpia01right.webp`,
  VER: `${CDN}/redbullracing/maxver01/2026redbullracingmaxver01right.webp`,
  GAS: `${CDN}/alpine/piegas01/2026alpinepiegas01right.webp`,
  HAD: `${CDN}/redbullracing/isahad01/2026redbullracingisahad01right.webp`,
  COL: `${CDN}/alpine/fracol01/2026alpinefracol01right.webp`,
  SAI: `${CDN}/williams/carsai01/2026williamscarsai01right.webp`,
  LAW: `${CDN}/racingbulls/lialaw01/2026racingbullslialaw01right.webp`,
  BEA: `${CDN}/haasf1team/olibea01/2026haasf1teamolibea01right.webp`,
  BOR: `${CDN}/audi/gabbor01/2026audigabbor01right.webp`,
  HUL: `${CDN}/audi/nichul01/2026audinichul01right.webp`,
  OCO: `${CDN}/haasf1team/estoco01/2026haasf1teamestoco01right.webp`,
  ALB: `${CDN}/williams/alealb01/2026williamsalealb01right.webp`,
  STR: `${CDN}/astonmartin/lanstr01/2026astonmartinlanstr01right.webp`,
  ALO: `${CDN}/astonmartin/feralo01/2026astonmartinferalo01right.webp`,
  BOT: `${CDN}/cadillac/valbot01/2026cadillacvalbot01right.webp`,
  PER: `${CDN}/cadillac/serper01/2026cadillacserper01right.webp`,
  LIN: `${CDN}/racingbulls/arvlin01/2026racingbullsarvlin01right.webp`,
};

function getDriverImg(driverId: string, code: string): string {
  return DRIVER_IMGS[driverId] ?? DRIVER_IMGS_BY_CODE[code] ?? "";
}

const TEAM_IMGS: Record<string, string> = {
  mercedes: `${TEAM_CDN}/mercedes/2026mercedeslogo.webp`,
  ferrari: `${TEAM_CDN}/ferrari/2026ferrarilogo.webp`,
  red_bull: `${TEAM_CDN}/redbullracing/2026redbullracinglogo.webp`,
  redbull: `${TEAM_CDN}/redbullracing/2026redbullracinglogo.webp`,
  mclaren: `${TEAM_CDN}/mclaren/2026mclarenlogo.webp`,
  alpine: `${TEAM_CDN}/alpine/2026alpinelogo.webp`,
  williams: `${TEAM_CDN}/williams/2026williamslogo.webp`,
  racing_bulls: `${TEAM_CDN}/racingbulls/2026racingbullslogo.webp`,
  rb: `${TEAM_CDN}/racingbulls/2026racingbullslogo.webp`,
  haas: `${TEAM_CDN}/haasf1team/2026haasf1teamlogo.webp`,
  haas_f1_team: `${TEAM_CDN}/haasf1team/2026haasf1teamlogo.webp`,
  aston_martin: `${TEAM_CDN}/astonmartin/2026astonmartinlogo.webp`,
  audi: `${TEAM_CDN}/audi/2026audilogo.webp`,
  kick_sauber: `${TEAM_CDN}/audi/2026audilogo.webp`,
  sauber: `${TEAM_CDN}/audi/2026audilogo.webp`,
  cadillac: `${TEAM_CDN}/cadillac/2026cadillaclogo.webp`,
  andretti: `${TEAM_CDN}/cadillac/2026cadillaclogo.webp`,
};

const FEATURES = [
  {
    tag: "01",
    title: "Race strategy replay",
    desc: "Visualise every pit stop, tyre compound and undercut attempt.",
    to: "/race",
    live: true,
  },
  {
    tag: "02",
    title: "Driver head-to-head",
    desc: "Pick any two drivers and break down their season lap by lap.",
    to: "/drivers",
    live: true,
  },
  {
    tag: "03",
    title: "Prediction league",
    desc: "Lock in your podium before lights out and compete on the leaderboard.",
    to: "/fantasy",
    live: false,
  },
  {
    tag: "04",
    title: "Real-time timing",
    desc: "Live sector times, gap intervals, and tyre age during every session.",
    to: "/live",
    live: false,
  },
  {
    tag: "05",
    title: "Circuit guide",
    desc: "DRS zones, braking points, lap records for all 22 venues.",
    to: "/circuits",
    live: false,
  },
  {
    tag: "06",
    title: "Fan feed",
    desc: "Hot takes, polls, and post-race debate sorted by race and topic.",
    to: "/feed",
    live: false,
  },
];

// ── countdown hook ────────────────────────────────────────────────────────────
function useCountdown(target: Date | null) {
  const calc = () => {
    if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const d = Math.max(0, target.getTime() - Date.now());
    return {
      days: Math.floor(d / 86400000),
      hours: Math.floor((d % 86400000) / 3600000),
      minutes: Math.floor((d % 3600000) / 60000),
      seconds: Math.floor((d % 60000) / 1000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

function useFadeIn(threshold = 0.12) {
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

// ── Next Race Card — live ─────────────────────────────────────────────────────
function NextRaceCard() {
  const [next, setNext] = useState<Race | null>(null);

  useEffect(() => {
    getNextRace().then((r) => setNext(r));
    const id = setInterval(() => getNextRace().then((r) => setNext(r)), 60_000);
    return () => clearInterval(id);
  }, []);

  const raceDate = next
    ? next.time
      ? new Date(`${next.date}T${next.time}`)
      : new Date(`${next.date}T13:00:00Z`)
    : null;

  const { days, hours, minutes, seconds } = useCountdown(raceDate);

  const units = [
    { num: String(days).padStart(2, "0"), label: "Days" },
    { num: String(hours).padStart(2, "0"), label: "Hrs" },
    { num: String(minutes).padStart(2, "0"), label: "Min" },
    { num: String(seconds).padStart(2, "0"), label: "Sec" },
  ];

  return (
    <div className="pw-next-race" aria-label="Next race countdown">
      <div className="pw-next-race-header">
        <span className="pw-next-race-tag">Next Race</span>
        <span className="pw-next-race-round">
          {next ? `Round ${next.round} / 22` : "—"}
        </span>
      </div>
      <div className="pw-next-race-body">
        <div className="pw-next-race-country">
          {next?.Circuit.Location.country ?? "Loading..."}
        </div>
        <div className="pw-next-race-name">
          {next ? next.raceName.replace(" Grand Prix", " GP") : "—"}
        </div>
        <div className="pw-countdown">
          {units.map((u) => (
            <div key={u.label} className="pw-countdown-unit">
              <div className="pw-countdown-num">{u.num}</div>
              <span className="pw-countdown-label">{u.label}</span>
            </div>
          ))}
        </div>
        <div className="pw-next-race-circuit">
          {next
            ? `${next.Circuit.circuitName} · ${formatRaceDate(next.date)}`
            : "Fetching schedule..."}
        </div>
      </div>
    </div>
  );
}

// ── Hero stats — live ─────────────────────────────────────────────────────────
function HeroStats() {
  const [leader, setLeader] = useState<DriverStanding | null>(null);
  const [roundsDone, setRoundsDone] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      const [standings, results] = await Promise.all([
        getDriverStandings(),
        getAllResults(),
      ]);
      if (standings.length) setLeader(standings[0]);
      if (results.length) setRoundsDone(results.length);
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const leaderName = leader
    ? `${leader.Driver.familyName} leads`
    : "Loading...";
  const leaderPts = leader ? `${leader.points} pts` : "";

  const stats = [
    { num: leaderPts || "—", label: leaderName },
    { num: String(roundsDone).padStart(2, "0"), label: "Rounds complete" },
    { num: "22", label: "Races this season" },
    { num: String(22 - roundsDone), label: "Races remaining" },
  ];

  return (
    <div className="pw-hero-stats" role="list" aria-label="Season statistics">
      {stats.map((s) => (
        <div key={s.label} className="pw-hero-stat" role="listitem">
          <div className="pw-hero-stat-num">{s.num}</div>
          <div className="pw-hero-stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Latest race results — live ────────────────────────────────────────────────
function RaceResultsSection() {
  const { ref, vis } = useFadeIn();
  const navigate = useNavigate();
  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const all = await getAllResults();
      if (all.length) setRace(all[all.length - 1]);
      setLoading(false);
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const posClass = (pos: string) => {
    if (pos === "1") return "gold";
    if (pos === "2") return "silver";
    if (pos === "3") return "bronze";
    if (pos === "R" || pos === "D" || pos === "W") return "dnf";
    return "";
  };

  const displayPos = (p: string) => {
    if (p === "R") return "NC";
    if (p === "D") return "DSQ";
    if (p === "W") return "DNS";
    return p.padStart(2, "0");
  };

  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(22px)",
        transition: "opacity 0.65s ease, transform 0.65s ease",
      }}
    >
      <section className="pw-results-section" aria-labelledby="results-title">
        <div className="pw-section-header">
          <div>
            <div className="pw-section-label">
              {race
                ? `Round ${race.round} of 22 · ${race.Circuit.circuitName}`
                : "Latest race"}
            </div>
            <h2 id="results-title" className="pw-section-title">
              {race ? `${race.raceName} result` : "Loading..."}
            </h2>
          </div>
          <button className="pw-section-link" onClick={() => navigate("/race")}>
            All races &rarr;
          </button>
        </div>

        {loading && <div className="pw-loading">Fetching live results...</div>}

        {!loading && race?.Results && (
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
                  <th className="r">Time</th>
                  <th className="r" style={{ width: 48 }}>
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody>
                {race.Results.map((r, i) => {
                  const cId = r.Constructor.constructorId;
                  const dId = r.Driver.driverId;
                  const color = teamColor(cId);
                  const isDnf =
                    r.positionText === "R" ||
                    r.positionText === "D" ||
                    r.positionText === "W";
                  const teamName = r.Constructor.name;

                  return (
                    <tr
                      key={r.Driver.code}
                      className="pw-race-row"
                      style={{ animationDelay: `${i * 0.03}s` }}
                    >
                      <td>
                        <span className={`pw-pos ${posClass(r.positionText)}`}>
                          {displayPos(r.positionText)}
                        </span>
                      </td>
                      <td className="pw-col-no">
                        <span className="pw-num">
                          <span
                            className="pw-num-stripe"
                            style={{ background: color }}
                          />
                          {r.number}
                        </span>
                      </td>
                      <td>
                        <div className="pw-driver-cell">
                          <img
                            src={getDriverImg(r.Driver.driverId, r.Driver.code)}
                            alt={`${r.Driver.givenName} ${r.Driver.familyName}`}
                            className={`pw-driver-img${isDnf ? " dnf" : ""}`}
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                          <div className="pw-driver-meta">
                            <span className="pw-driver-name">
                              {r.Driver.givenName} {r.Driver.familyName}
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
                            src={TEAM_IMGS[cId] ?? ""}
                            alt={teamName}
                            className={`pw-team-img${
                              INVERT_TEAMS.includes(teamName) ? " invert" : ""
                            }`}
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                          <span className="pw-team-name">{teamName}</span>
                        </div>
                      </td>
                      <td className="pw-col-laps pw-laps">{r.laps || "—"}</td>
                      <td
                        className={`pw-time${
                          r.positionText === "1"
                            ? " leader"
                            : isDnf
                            ? " dnf-text"
                            : ""
                        }`}
                      >
                        {r.Time?.time ?? (isDnf ? "DNF" : r.status)}
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
        )}
      </section>
    </div>
  );
}

// ── Features section ──────────────────────────────────────────────────────────
function FeaturesSection() {
  const { ref, vis } = useFadeIn();
  const navigate = useNavigate();
  return (
    <div
      id="features-section"
      ref={ref}
      className="pw-features"
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(22px)",
        transition: "opacity 0.65s ease, transform 0.65s ease",
      }}
    >
      <div className="pw-features-inner">
        <div className="pw-section-header" style={{ marginBottom: 28 }}>
          <div>
            <div className="pw-section-label">What GridWall does</div>
            <h2 className="pw-section-title">Everything you need</h2>
          </div>
        </div>
        <div className="pw-features-grid" role="list">
          {FEATURES.map((f) => (
            <div
              key={f.tag}
              className={`pw-feature-card${
                !f.live ? " pw-feature-card--soon" : ""
              }`}
              role="listitem"
              onClick={() => navigate(f.to)}
              style={{ cursor: "pointer" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 18,
                }}
              >
                <span className="pw-feature-icon" style={{ marginBottom: 0 }}>
                  {f.tag}
                </span>
                {!f.live && <span className="pw-feature-soon-badge">Soon</span>}
              </div>
              <h3 className="pw-feature-title">{f.title}</h3>
              <p className="pw-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="pw-root">
      <header>
        <Nav />
      </header>
      <main>
        <section className="pw-hero" aria-labelledby="hero-title">
          <div className="pw-hero-bg" aria-hidden="true" />
          <div className="pw-hero-inner">
            <div className="pw-hero-eyebrow" aria-hidden="true">
              <span className="pw-hero-eyebrow-text">
                2026 Formula One Season
              </span>
              <div className="pw-hero-eyebrow-line" />
            </div>
            <h1 id="hero-title" className="pw-hero-title">
              <em>F1</em> Fans command centre
            </h1>
            <p className="pw-hero-body">
              Live timing, race strategy, driver comparisons and a prediction
              league — all the things an F1 fan needs, without the paywall.
            </p>
            <div className="pw-hero-actions">
              <button
                className="pw-btn-primary"
                onClick={() => navigate("/race")}
              >
                Explore the season
              </button>
              <button
                className="pw-btn-ghost"
                onClick={() => {
                  document
                    .getElementById("features-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                How it works
              </button>
            </div>
          </div>

          <NextRaceCard />
          <HeroStats />
        </section>

        <RaceResultsSection />
        <FeaturesSection />
      </main>

      <footer>
        <div className="pw-footer">
          <span className="pw-footer-logo">GridWall</span>
          <span className="pw-footer-copy">
            2026 FIA Formula One World Championship. Not affiliated with Formula
            One Group.
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
