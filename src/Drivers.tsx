import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import Nav from "./Nav";
import {
  getDriverStandings,
  getAllResults,
  teamColor,
  normalizeConstructorId,
  DriverStanding,
  Race,
} from "./f1api";

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
    Belgian: "be",
    American: "us",
    Japanese: "jp",
    Chinese: "cn",
    Danish: "dk",
    Austrian: "at",
    Polish: "pl",
    Portuguese: "pt",
    Russian: "ru",
  };
  return `https://flagcdn.com/24x18/${map[nat] ?? "un"}.png`;
};

const DRIVER_IMGS: Record<string, string> = {
  antonelli:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ANDANT01_Andrea_Kimi_Antonelli/andant01.png.transform/2col/image.png",
  kimi_antonelli:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ANDANT01_Andrea_Kimi_Antonelli/andant01.png.transform/2col/image.png",
  hamilton:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png.transform/2col/image.png",
  leclerc:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png.transform/2col/image.png",
  russell:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png.transform/2col/image.png",
  norris:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png.transform/2col/image.png",
  piastri:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png.transform/2col/image.png",
  max_verstappen:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/2col/image.png",
  verstappen:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/2col/image.png",
  gasly:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png.transform/2col/image.png",
  hadjar:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/I/ISAHAD01_Isack_Hadjar/isahad01.png.transform/2col/image.png",
  isack_hadjar:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/I/ISAHAD01_Isack_Hadjar/isahad01.png.transform/2col/image.png",
  colapinto:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FRACOL01_Franco_Colapinto/fracol01.png.transform/2col/image.png",
  franco_colapinto:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FRACOL01_Franco_Colapinto/fracol01.png.transform/2col/image.png",
  sainz:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png.transform/2col/image.png",
  lawson:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png.transform/2col/image.png",
  liam_lawson:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png.transform/2col/image.png",
  bearman:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OLIBEA01_Oliver_Bearman/olibea01.png.transform/2col/image.png",
  oliver_bearman:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OLIBEA01_Oliver_Bearman/olibea01.png.transform/2col/image.png",
  bortoleto:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GABBOR01_Gabriel_Bortoleto/gabbor01.png.transform/2col/image.png",
  hulkenberg:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png.transform/2col/image.png",
  ocon: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png.transform/2col/image.png",
  albon:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png.transform/2col/image.png",
  stroll:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png.transform/2col/image.png",
  alonso:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png.transform/2col/image.png",
  bottas:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png.transform/2col/image.png",
  perez:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png.transform/2col/image.png",
  lindblad:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ARVLIN01_Arvid_Lindblad/arvlin01.png.transform/2col/image.png",
  arvid_lindblad:
    "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ARVLIN01_Arvid_Lindblad/arvlin01.png.transform/2col/image.png",
};

const DRIVER_IMGS_BY_CODE: Record<string, string> = {
  ANT: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ANDANT01_Andrea_Kimi_Antonelli/andant01.png.transform/2col/image.png",
  HAM: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png.transform/2col/image.png",
  LEC: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png.transform/2col/image.png",
  RUS: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png.transform/2col/image.png",
  NOR: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png.transform/2col/image.png",
  PIA: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png.transform/2col/image.png",
  VER: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/2col/image.png",
  GAS: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png.transform/2col/image.png",
  HAD: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/I/ISAHAD01_Isack_Hadjar/isahad01.png.transform/2col/image.png",
  COL: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FRACOL01_Franco_Colapinto/fracol01.png.transform/2col/image.png",
  SAI: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png.transform/2col/image.png",
  LAW: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png.transform/2col/image.png",
  BEA: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OLIBEA01_Oliver_Bearman/olibea01.png.transform/2col/image.png",
  BOR: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GABBOR01_Gabriel_Bortoleto/gabbor01.png.transform/2col/image.png",
  HUL: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png.transform/2col/image.png",
  OCO: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png.transform/2col/image.png",
  ALB: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png.transform/2col/image.png",
  STR: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png.transform/2col/image.png",
  ALO: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png.transform/2col/image.png",
  BOT: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png.transform/2col/image.png",
  PER: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png.transform/2col/image.png",
  LIN: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ARVLIN01_Arvid_Lindblad/arvlin01.png.transform/2col/image.png",
};

function getDriverImg(driverId: string, code: string): string {
  return DRIVER_IMGS[driverId] ?? DRIVER_IMGS_BY_CODE[code] ?? "";
}

const TEAM_CDN =
  "https://media.formula1.com/image/upload/c_lfill,w_128/q_auto/v1740000001/common/f1/2026";

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

// ── hooks ─────────────────────────────────────────────────────────────────────
function useDriverData() {
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [allRaces, setAllRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      const [standings, races] = await Promise.all([
        getDriverStandings(),
        getAllResults(),
      ]);
      if (standings.length) setDrivers(standings);
      if (races.length) setAllRaces(races);
      setLastUpdated(new Date());
      setLoading(false);
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  return { drivers, allRaces, loading, lastUpdated };
}

// ── driver card ───────────────────────────────────────────────────────────────
function DriverCard({
  driver,
  allRaces,
  isSelected,
  compareSlot,
  onSelect,
}: {
  driver: DriverStanding;
  allRaces: Race[];
  isSelected: boolean;
  compareSlot: 1 | 2 | null;
  onSelect: () => void;
}) {
  const cId = normalizeConstructorId(
    driver.Constructors[0]?.constructorId ?? ""
  );
  const color = teamColor(cId);
  const teamName = driver.Constructors[0]?.name ?? "";
  const podiums = allRaces.filter((r) => {
    const res = r.Results?.find(
      (x) => x.Driver.driverId === driver.Driver.driverId
    );
    return res && Number(res.position) <= 3;
  }).length;

  return (
    <div
      className={`dr-card${isSelected ? " selected" : ""}`}
      style={{ borderTopColor: color }}
      onClick={onSelect}
    >
      {compareSlot && (
        <div className="dr-compare-badge" style={{ background: color }}>
          P{compareSlot}
        </div>
      )}
      <div className="dr-card-header">
        <img
          src={getDriverImg(driver.Driver.driverId, driver.Driver.code)}
          alt={`${driver.Driver.givenName} ${driver.Driver.familyName}`}
          className="dr-card-img"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="dr-card-pos" style={{ color }}>
          {driver.position.padStart(2, "0")}
        </div>
      </div>

      <div className="dr-card-body">
        <img
          src={FLAG_URL(driver.Driver.nationality)}
          alt={driver.Driver.nationality}
          className="dr-flag-img"
          loading="lazy"
        />
        <div className="dr-card-name">
          <span className="dr-card-first">{driver.Driver.givenName}</span>
          <span className="dr-card-last">{driver.Driver.familyName}</span>
        </div>

        <div className="dr-card-team">
          <img
            src={TEAM_IMGS[normalizeConstructorId(cId)] ?? ""}
            alt={teamName}
            className={`dr-team-logo${
              INVERT_IDS.includes(cId) ? " invert" : ""
            }`}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span>{teamName}</span>
        </div>

        <div className="dr-card-stats">
          <div className="dr-stat">
            <span className="dr-stat-val">{driver.points}</span>
            <span className="dr-stat-label">Points</span>
          </div>
          <div className="dr-stat">
            <span className="dr-stat-val">{driver.wins}</span>
            <span className="dr-stat-label">Wins</span>
          </div>
          <div className="dr-stat">
            <span className="dr-stat-val">{podiums}</span>
            <span className="dr-stat-label">Podiums</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── head to head comparison ─────
function HeadToHead({
  d1,
  d2,
  allRaces,
}: {
  d1: DriverStanding;
  d2: DriverStanding;
  allRaces: Race[];
}) {
  const cId1 = normalizeConstructorId(d1.Constructors[0]?.constructorId ?? "");
  const cId2 = normalizeConstructorId(d2.Constructors[0]?.constructorId ?? "");
  const col1 = teamColor(cId1);
  const col2 = teamColor(cId2);

  // use different shade if same team
  const sameTeam = cId1 === cId2;
  const displayCol2 = sameTeam ? "#aaaaaa" : col2;

  const stats = [
    { label: "Points", v1: Number(d1.points), v2: Number(d2.points) },
    { label: "Wins", v1: Number(d1.wins), v2: Number(d2.wins) },
    {
      label: "Podiums",
      v1: allRaces.filter((r) => {
        const res = r.Results?.find(
          (x) => x.Driver.driverId === d1.Driver.driverId
        );
        return res && Number(res.position) <= 3;
      }).length,
      v2: allRaces.filter((r) => {
        const res = r.Results?.find(
          (x) => x.Driver.driverId === d2.Driver.driverId
        );
        return res && Number(res.position) <= 3;
      }).length,
    },
  ];

  return (
    <div className="dr-h2h">
      <div className="dr-h2h-header">
        <div className="dr-h2h-driver" style={{ color: col1 }}>
          <img
            src={getDriverImg(d1.Driver.driverId, d1.Driver.code)}
            alt=""
            className="dr-h2h-img"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span>{d1.Driver.code}</span>
        </div>
        <span className="dr-h2h-vs">VS</span>
        <div className="dr-h2h-driver" style={{ color: displayCol2 }}>
          <img
            src={getDriverImg(d2.Driver.driverId, d2.Driver.code)}
            alt=""
            className="dr-h2h-img"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span>{d2.Driver.code}</span>
        </div>
      </div>

      {/* stat bars */}
      {stats.map((s) => {
        const total = s.v1 + s.v2 || 1;
        const pct1 = (s.v1 / total) * 100;
        return (
          <div key={s.label} className="dr-h2h-row">
            <span className="dr-h2h-val" style={{ color: col1 }}>
              {s.v1}
            </span>
            <div className="dr-h2h-bar-wrap">
              <div className="dr-h2h-bar-label">{s.label}</div>
              <div className="dr-h2h-bar-track">
                <div
                  className="dr-h2h-bar-fill left"
                  style={{ width: `${pct1}%`, background: col1 }}
                />
                <div
                  className="dr-h2h-bar-fill right"
                  style={{ width: `${100 - pct1}%`, background: displayCol2 }}
                />
              </div>
            </div>
            <span className="dr-h2h-val" style={{ color: displayCol2 }}>
              {s.v2}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── page ────────
export default function Drivers() {
  const { drivers, allRaces, loading, lastUpdated } = useDriverData();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (driverId: string) => {
    setSelected((prev) => {
      if (prev.includes(driverId)) return prev.filter((d) => d !== driverId);
      if (prev.length >= 2) return [prev[1], driverId];
      return [...prev, driverId];
    });
  };

  const d1 = selected[0]
    ? drivers.find((d) => d.Driver.driverId === selected[0])
    : null;
  const d2 = selected[1]
    ? drivers.find((d) => d.Driver.driverId === selected[1])
    : null;

  return (
    <div className="pw-root">
      <header>
        <Nav />
      </header>
      <main>
        {/* page header */}
        <div className="st-header" style={{ minHeight: "auto" }}>
          <div className="st-header-inner">
            <div className="rc-header-breadcrumb" style={{ marginBottom: 12 }}>
              <Link to="/" className="rc-breadcrumb-link">
                GridWall
              </Link>
              <span className="rc-breadcrumb-sep">/</span>
              <span className="rc-breadcrumb-cur">Drivers</span>
            </div>
            <h1 className="st-title">2026 Drivers</h1>
            <p style={{ fontSize: 13, color: "var(--mid)", marginTop: 6 }}>
              Select two drivers to compare head to head
            </p>
            {lastUpdated && (
              <div className="st-updated">
                Updated {lastUpdated.toLocaleTimeString()} · auto-refreshes
                every 60s
              </div>
            )}
          </div>
        </div>

        {/* head to head panel */}
        {d1 && d2 && (
          <div className="dr-h2h-section">
            <HeadToHead d1={d1} d2={d2} allRaces={allRaces} />
          </div>
        )}

        {!d1 && !d2 && !loading && (
          <div className="dr-select-hint">
            Tap any two driver cards below to compare
          </div>
        )}

        {/* driver grid */}
        <div className="dr-grid-section">
          {loading && (
            <div className="pw-loading">Fetching live driver data...</div>
          )}
          <div className="dr-grid">
            {drivers.map((d) => {
              const slot =
                selected[0] === d.Driver.driverId
                  ? 1
                  : selected[1] === d.Driver.driverId
                  ? 2
                  : null;
              return (
                <DriverCard
                  key={d.Driver.driverId}
                  driver={d}
                  allRaces={allRaces}
                  isSelected={selected.includes(d.Driver.driverId)}
                  compareSlot={slot as 1 | 2 | null}
                  onSelect={() => toggleSelect(d.Driver.driverId)}
                />
              );
            })}
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
