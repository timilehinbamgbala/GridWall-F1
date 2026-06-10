import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import Nav from "./Nav";
import {
  getDriverStandings,
  teamColor,
  normalizeConstructorId,
  DriverStanding,
} from "./f1api";

const CDN =
  "https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/d_common:f1:2026:fallback:driver:2026fallbackdriverright.webp/v1740000001/common/f1/2026";
const TEAM_CDN =
  "https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/v1740000001/common/f1/2026";

const INVERT_IDS = [
  "mercedes",
  "audi",
  "aston_martin",
  "cadillac",
  "kick_sauber",
  "sauber",
  "andretti",
];

const FLAG_URL = (nat: string) => {
  const map: Record<string, string> = {
    Italian: "it",
    British: "gb",
    Monegasque: "mc",
    Australian: "au",
    Dutch: "nl",
    French: "fr",
    Argentine: "ar",
    Spanish: "es",
    "New Zealand": "nz",
    "New Zealander": "nz",
    Brazilian: "br",
    German: "de",
    Thai: "th",
    Canadian: "ca",
    Finnish: "fi",
    Mexican: "mx",
    Swedish: "se",
    American: "us",
    Japanese: "jp",
    Chinese: "cn",
  };
  const code = map[nat] ?? "un";
  return `https://flagcdn.com/24x18/${code}.png`;
};

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

// ── live standings hook ───────────────────────────────────────────────────────
function useStandings() {
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getDriverStandings();
      if (data.length) {
        setDrivers(data);
        setLastUpdated(new Date());
      }
      setLoading(false);
    };
    load();
    // refresh every 60s
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  return { drivers, loading, lastUpdated };
}

// ── constructors from driver standings ───────────────────────────────────────
function buildConstructors(drivers: DriverStanding[]) {
  const map: Record<
    string,
    { name: string; cId: string; pts: number; wins: number; drivers: string[] }
  > = {};
  drivers.forEach((d) => {
    const c = d.Constructors[0];
    if (!c) return;
    if (!map[c.constructorId]) {
      map[c.constructorId] = {
        name: c.name,
        cId: c.constructorId,
        pts: 0,
        wins: 0,
        drivers: [],
      };
    }
    map[c.constructorId].pts += Number(d.points);
    map[c.constructorId].wins += Number(d.wins);
    map[c.constructorId].drivers.push(
      `${d.Driver.givenName} ${d.Driver.familyName}`
    );
  });
  return Object.values(map).sort((a, b) => b.pts - a.pts);
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function DriversTable({
  drivers,
  loading,
}: {
  drivers: DriverStanding[];
  loading: boolean;
}) {
  const maxPts = Number(drivers[0]?.points ?? 1);
  const posClass = (pos: string) => {
    if (pos === "1") return "gold";
    if (pos === "2") return "silver";
    if (pos === "3") return "bronze";
    return "";
  };

  if (loading)
    return <div className="pw-loading">Fetching live standings...</div>;

  return (
    <div className="st-table-wrap">
      <table className="st-table">
        <thead>
          <tr>
            <th style={{ width: 44 }}>Pos</th>
            <th>Driver</th>
            <th className="st-col-nat">Nat</th>
            <th className="st-col-team">Team</th>
            <th className="st-col-wins r">Wins</th>
            <th className="r" style={{ width: 180 }}>
              Points
            </th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((d, i) => {
            const cId = normalizeConstructorId(
              d.Constructors[0]?.constructorId ?? ""
            );
            const color = teamColor(cId);
            const teamName = d.Constructors[0]?.name ?? "";
            return (
              <tr
                key={d.Driver.driverId}
                className="st-row"
                style={{ animationDelay: `${i * 0.025}s` }}
              >
                <td>
                  <span className={`pw-pos ${posClass(d.position)}`}>
                    {d.position.padStart(2, "0")}
                  </span>
                </td>
                <td>
                  <div className="st-driver-cell">
                    <span
                      className="st-team-stripe"
                      style={{ background: color }}
                    />
                    <img
                      src={getDriverImg(d.Driver.driverId, d.Driver.code)}
                      alt={`${d.Driver.givenName} ${d.Driver.familyName}`}
                      className="st-driver-img"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="st-driver-meta">
                      <span className="st-driver-name">
                        {d.Driver.givenName} {d.Driver.familyName}
                      </span>
                      <span className="st-driver-abbr">{d.Driver.code}</span>
                    </div>
                  </div>
                </td>
                <td className="st-col-nat">
                  <img
                    src={FLAG_URL(d.Driver.nationality)}
                    alt={d.Driver.nationality}
                    className="st-flag-img"
                    loading="lazy"
                  />
                </td>
                <td className="st-col-team">
                  <div className="pw-team-cell">
                    <img
                      src={TEAM_IMGS[normalizeConstructorId(cId)] ?? ""}
                      alt={teamName}
                      className={`pw-team-img${
                        INVERT_IDS.includes(cId) ? " invert" : ""
                      }`}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <span className="pw-team-name">{teamName}</span>
                  </div>
                </td>
                <td className="st-col-wins r">
                  <span className="st-wins">{d.wins || "—"}</span>
                </td>
                <td>
                  <div className="st-pts-cell">
                    <div className="st-pts-bar-wrap">
                      <div
                        className="st-pts-bar"
                        style={{
                          width: `${(Number(d.points) / maxPts) * 100}%`,
                          background: color,
                        }}
                      />
                    </div>
                    <span className="st-pts-num">{d.points}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConstructorsTable({
  drivers,
  loading,
}: {
  drivers: DriverStanding[];
  loading: boolean;
}) {
  const constructors = buildConstructors(drivers);
  const maxPts = constructors[0]?.pts ?? 1;

  if (loading)
    return <div className="pw-loading">Fetching live standings...</div>;

  return (
    <div className="st-table-wrap">
      <table className="st-table">
        <thead>
          <tr>
            <th style={{ width: 44 }}>Pos</th>
            <th>Constructor</th>
            <th className="st-col-wins r">Wins</th>
            <th className="r" style={{ width: 180 }}>
              Points
            </th>
          </tr>
        </thead>
        <tbody>
          {constructors.map((c, i) => {
            const color = teamColor(c.cId);
            const posClass =
              i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
            return (
              <tr
                key={c.cId}
                className="st-row"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <td>
                  <span className={`pw-pos ${posClass}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </td>
                <td>
                  <div className="st-constructor-cell">
                    <span
                      className="st-team-stripe"
                      style={{ background: color }}
                    />
                    <img
                      src={TEAM_IMGS[c.cId] ?? ""}
                      alt={c.name}
                      className={`st-constructor-logo${
                        INVERT_IDS.includes(c.cId) ? " invert" : ""
                      }`}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="st-constructor-meta">
                      <span className="st-constructor-name">{c.name}</span>
                      <span className="st-constructor-drivers">
                        {c.drivers.join(" · ")}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="st-col-wins r">
                  <span className="st-wins">{c.wins || "—"}</span>
                </td>
                <td>
                  <div className="st-pts-cell">
                    <div className="st-pts-bar-wrap">
                      <div
                        className="st-pts-bar"
                        style={{
                          width: `${(c.pts / maxPts) * 100}%`,
                          background: color,
                        }}
                      />
                    </div>
                    <span className="st-pts-num">{c.pts}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Standings() {
  const [tab, setTab] = useState<"drivers" | "constructors">("drivers");
  const { drivers, loading, lastUpdated } = useStandings();

  const leader = drivers[0];
  const heroImg = leader ? DRIVER_IMGS[leader.Driver.driverId] : null;

  return (
    <div className="pw-root">
      <header>
        <Nav />
      </header>
      <main>
        {/* hero — shows leading driver */}
        <div className="st-header">
          {heroImg && (
            <div
              className="st-header-hero-bg"
              style={{ backgroundImage: `url(${heroImg})` }}
              aria-hidden="true"
            />
          )}
          <div className="st-header-inner">
            <div className="rc-header-breadcrumb" style={{ marginBottom: 16 }}>
              <Link to="/" className="rc-breadcrumb-link">
                GridWall
              </Link>
              <span className="rc-breadcrumb-sep">/</span>
              <span className="rc-breadcrumb-cur">Standings</span>
            </div>
            <div className="rc-header-meta">
              <span className="rc-header-round">
                {loading
                  ? "Loading..."
                  : `After Round ${drivers[0] ? "current" : "—"} of 22`}
              </span>
            </div>
            <h1 className="st-title">2026 Championship</h1>

            <div className="st-leaders">
              <div className="st-leader-card">
                <div className="st-leader-label">Drivers leader</div>
                <div className="st-leader-name">
                  {leader
                    ? `${leader.Driver.givenName} ${leader.Driver.familyName}`
                    : "Loading..."}
                </div>
                <div className="st-leader-detail">
                  <span
                    style={{
                      color: teamColor(
                        leader?.Constructors[0]?.constructorId ?? ""
                      ),
                    }}
                  >
                    {leader?.Constructors[0]?.name}
                  </span>
                  {leader && <>&nbsp;·&nbsp;{leader.points} pts</>}
                </div>
              </div>
              {drivers.length > 1 && (
                <div className="st-leader-card">
                  <div className="st-leader-label">Gap to P2</div>
                  <div className="st-leader-name">
                    {drivers[1].Driver.familyName}
                  </div>
                  <div className="st-leader-detail">
                    +{Number(leader?.points) - Number(drivers[1].points)} pts
                    ahead
                  </div>
                </div>
              )}
            </div>
            {lastUpdated && (
              <div className="st-updated">
                Updated {lastUpdated.toLocaleTimeString()} · auto-refreshes
                every 60s
              </div>
            )}
          </div>
        </div>

        <div className="st-body">
          <div className="st-body-inner">
            <div className="st-tabs" role="tablist">
              <button
                role="tab"
                className={`st-tab${tab === "drivers" ? " active" : ""}`}
                onClick={() => setTab("drivers")}
              >
                Drivers
              </button>
              <button
                role="tab"
                className={`st-tab${tab === "constructors" ? " active" : ""}`}
                onClick={() => setTab("constructors")}
              >
                Constructors
              </button>
            </div>

            {tab === "drivers" ? (
              <DriversTable drivers={drivers} loading={loading} />
            ) : (
              <ConstructorsTable drivers={drivers} loading={loading} />
            )}
          </div>
        </div>
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
