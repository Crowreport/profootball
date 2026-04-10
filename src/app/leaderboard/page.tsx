'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { useUserStore } from '@/store/useUserStore';

const ROWS_PER_PAGE = 25;

const TOTAL_GAMES = 272; // NFL regular season: 32 teams × 17 games ÷ 2

// Games per week (NFL 18-week regular season — bye weeks mean some weeks have fewer)
const GAMES_PER_WEEK: Record<number, number> = {
  1:16, 2:16, 3:16, 4:16, 5:14, 6:14, 7:14, 8:14, 9:14, 10:14,
  11:14, 12:16, 13:16, 14:14, 15:16, 16:16, 17:16, 18:16,
  19:6, 20:4, 21:2, 22:1, // playoffs
};

// ─── Dummy data (shown when no real picks exist) ─────────────────────────────
// Seeded PRNG so dummy dots are stable across re-renders
function seededShuffle(arr: ('W' | 'L')[], seed: number) {
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeDummy(rank: number, id: string, name: string, correct: number, incorrect: number, pending: number, streak: LeaderboardEntry['streak']): LeaderboardEntry {
  const total = correct + incorrect + pending;
  const sc = streak?.count ?? 0;
  const st = streak?.type ?? 'W';
  // Non-streak portion: interleave W/L randomly
  const wNonStreak = Math.max(0, correct - (st === 'W' ? sc : 0));
  const lNonStreak = Math.max(0, incorrect - (st === 'L' ? sc : 0));
  const mixed: ('W' | 'L')[] = [];
  for (let i = 0; i < wNonStreak; i++) mixed.push('W');
  for (let i = 0; i < lNonStreak; i++) mixed.push('L');
  seededShuffle(mixed, rank * 7919);
  const results: ('W' | 'L' | 'P')[] = [...mixed];
  for (let i = 0; i < sc; i++) results.push(st);
  for (let i = 0; i < pending; i++) results.push('P');
  return { rank, user: { id, displayName: name }, points: correct, record: `${correct}-${incorrect}`, correct, incorrect, pending, total, streak, results };
}

const DUMMY_ENTRIES: LeaderboardEntry[] = [
  makeDummy(1,'d1','GridironGuru',    200, 72,  0, {type:'W',count:8}),
  makeDummy(2,'d2','BlitzKing99',     194, 78,  0, {type:'W',count:4}),
  makeDummy(3,'d3','TDQueen',         188, 84,  0, {type:'L',count:1}),
  makeDummy(4,'d4','RedZoneRandy',    183, 89,  0, {type:'W',count:6}),
  makeDummy(5,'d5','SackMaster',      180, 92,  0, {type:'L',count:3}),
  makeDummy(6,'d6','PocketRocket',    176, 96,  0, {type:'W',count:2}),
  makeDummy(7,'d7','HailMaryHank',    172, 100, 0, {type:'W',count:5}),
  makeDummy(8,'d8','LinebackerLiz',   168, 104, 0, null),
  makeDummy(9,'d9','FumbleFreeFranck',165, 107, 0, {type:'L',count:4}),
  makeDummy(10,'d10','EndZoneElla',   162, 110, 0, {type:'W',count:3}),
  makeDummy(11,'d11','SnapCount',     158, 114, 0, null),
  makeDummy(12,'d12','DriveTimeDave', 154, 118, 0, {type:'W',count:1}),
  makeDummy(13,'d13','SpecialTeamsSue',150,122, 0, {type:'L',count:2}),
  makeDummy(14,'d14','TwoMinuteTom',  147, 125, 0, {type:'L',count:5}),
  makeDummy(15,'d15','ChopBlockChris',143, 129, 0, {type:'W',count:1}),
  makeDummy(16,'d16','AudibleAlex',   140, 132, 0, null),
  makeDummy(17,'d17','JukeMoveJordan',137, 135, 0, {type:'L',count:3}),
  makeDummy(18,'d18','PuntReturnPat', 133, 139, 0, {type:'W',count:2}),
  makeDummy(19,'d19','NoseTackleNick',129, 143, 0, {type:'L',count:6}),
  makeDummy(20,'d20','WildcardWendy', 125, 147, 0, null),
  makeDummy(21,'d21','SafetyBlitzSam',121, 151, 0, {type:'L',count:2}),
  makeDummy(22,'d22','CoverTwoCole',  117, 155, 0, {type:'W',count:3}),
  makeDummy(23,'d23','BootlegBeth',   113, 159, 0, {type:'L',count:4}),
  makeDummy(24,'d24','RedDogRex',     109, 163, 0, null),
  makeDummy(25,'d25','OffsidOliver',  105, 167, 0, {type:'L',count:7}),
  makeDummy(26,'d26','HoldingPenalty',100, 172, 0, {type:'L',count:3}),
  makeDummy(27,'d27','FalseStartFrank',95, 177, 0, null),
  makeDummy(28,'d28','PassIntPriya',   87, 185, 0, {type:'L',count:11}),
  makeDummy(29,'d29','DelayOfGame',    80, 192, 0, {type:'L',count:9}),
  makeDummy(30,'d30','IllegalContact',  72,200, 0, {type:'L',count:5}),
];

interface LeaderboardEntry {
  rank: number;
  user: { id: string; displayName: string };
  points: number;
  record: string;
  correct: number;
  incorrect: number;
  pending: number;
  total: number;
  streak: { type: 'W' | 'L'; count: number } | null;
  results?: ('W' | 'L' | 'P')[]; // per-game results, oldest→newest
}

// ─── 2D Podium ───────────────────────────────────────────────────────────────
function Podium({ top3 }: { top3: (LeaderboardEntry | null)[] }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(t);
  }, []);

  const cfg = {
    1: { w: 160, h: 220, bg: '#d4a012', border: '#f5ce4e', label: '1ST', nameSz: 'text-xl', crown: true,  growDelay: '0ms',   textDelay: '530ms' },
    2: { w: 128, h: 165, bg: '#7a8e9e', border: '#b0c4d4', label: '2ND', nameSz: 'text-lg', crown: false, growDelay: '140ms', textDelay: '670ms' },
    3: { w: 104, h: 130, bg: '#a05a28', border: '#d48040', label: '3RD', nameSz: 'text-base', crown: false, growDelay: '260ms', textDelay: '790ms' },
  } as const;

  function Block({ place, entry }: { place: 1 | 2 | 3; entry: LeaderboardEntry | null }) {
    const c = cfg[place];

    const blockStyle: React.CSSProperties = {
      width: c.w,
      height: c.h,
      background: c.bg,
      borderTop: `3px solid ${c.border}`,
      borderLeft: `1px solid ${c.border}`,
      borderRight: `1px solid rgba(0,0,0,0.3)`,
      borderRadius: '4px 4px 0 0',
      transformOrigin: 'bottom',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...(animate
        ? { animation: `podiumGrow 0.52s ease-out ${c.growDelay} both` }
        : { transform: 'scaleY(0)' }),
    };

    const textStyle: React.CSSProperties = animate
      ? { animation: `podiumFadeIn 0.35s ease-out ${c.textDelay} both` }
      : { opacity: 0 };

    return (
      <div className="flex flex-col items-center select-none">
        {/* Name / crown / stats */}
        <div style={{ ...textStyle, textAlign: 'center', marginBottom: 12, width: c.w + 24 }}>
          {c.crown && (
            <div className="text-3xl mb-1 animate-bounce" style={{ animationDuration: '2.5s' }}>👑</div>
          )}
          <div className={`font-black text-white ${c.nameSz} leading-snug truncate`} style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
            {entry ? entry.user.displayName : '—'}
          </div>
          {entry && (
            <div className="flex items-center justify-center gap-1.5 flex-wrap mt-1">
              <span className="text-green-400 font-bold text-sm">{entry.correct}W</span>
              <span className="text-gray-400 text-xs">·</span>
              <span className="text-red-400 font-bold text-sm">{entry.incorrect}L</span>
              <span className="text-gray-400 text-xs">·</span>
              <span className="text-yellow-300 font-bold text-sm">{entry.points}pts</span>
            </div>
          )}
        </div>

        {/* 2D block */}
        <div style={blockStyle}>
          <span style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 900, fontSize: place === 1 ? 26 : place === 2 ? 21 : 17, letterSpacing: '0.18em', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
            {c.label}
          </span>
        </div>
      </div>
    );
  }

  // Total width of the three blocks + gaps so the baseline line fits exactly
  const totalW = cfg[2].w + cfg[1].w + cfg[3].w + 36 + 36; // w2 + w1 + w3 + 2×gap

  return (
    <>
      <style>{`
        @keyframes podiumGrow {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        @keyframes podiumFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex flex-col items-center py-8">
        {/* Podium blocks — 2nd behind-left, 1st centre, 3rd behind-right */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 36 }}>
          <Block place={2} entry={top3[1] ?? null} />
          <Block place={1} entry={top3[0] ?? null} />
          <Block place={3} entry={top3[2] ?? null} />
        </div>

        {/* Baseline */}
        <div style={{ width: totalW + 120, height: 3, background: 'linear-gradient(to right, transparent, #94a3b8 8%, #94a3b8 92%, transparent)', borderRadius: 2 }} />
      </div>
    </>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  const { profile } = useUserStore();

  const currentYear = new Date().getFullYear();
  const [season, setSeason] = useState<number>(() => {
    const s = searchParams.get('season');
    return s ? parseInt(s) : currentYear;
  });
  const [week, setWeek] = useState<number | null>(null); // null = all weeks
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (yr: number, wk: number | null) => {
    setLoading(true);
    try {
      const url = `/api/leaderboard?season=${yr}&limit=500${wk !== null ? `&week=${wk}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setEntries(data.entries || []);
      setTotal(data.meta?.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(season, week);
    setPage(1);
  }, [season, week, fetchData]);

  // Fall back to dummy data so the UI is always visible
  // When a specific week is selected, scale dummy stats down to that week's game count
  const displayEntries = entries.length > 0 ? entries : (() => {
    if (week === null) return DUMMY_ENTRIES;
    const weekGames = GAMES_PER_WEEK[week] ?? 16;
    return DUMMY_ENTRIES.map((e) => {
      const ratio = weekGames / TOTAL_GAMES;
      const correct = Math.round(e.correct * ratio);
      const incorrect = Math.round(e.incorrect * ratio);
      const pending = Math.max(0, weekGames - correct - incorrect);
      const streakMax = correct + incorrect;
      const streak = e.streak ? { type: e.streak.type, count: Math.min(e.streak.count, streakMax > 0 ? Math.max(1, Math.round(e.streak.count * ratio)) : 0) } as const : null;
      const results: ('W' | 'L' | 'P')[] = [];
      const wNS = Math.max(0, correct - (streak?.type === 'W' ? (streak?.count ?? 0) : 0));
      const lNS = Math.max(0, incorrect - (streak?.type === 'L' ? (streak?.count ?? 0) : 0));
      const mixed: ('W' | 'L')[] = [];
      for (let i = 0; i < wNS; i++) mixed.push('W');
      for (let i = 0; i < lNS; i++) mixed.push('L');
      seededShuffle(mixed, e.rank * 3571 + (week ?? 0));
      results.push(...mixed);
      if (streak) for (let i = 0; i < streak.count; i++) results.push(streak.type);
      for (let i = 0; i < pending; i++) results.push('P');
      return { ...e, correct, incorrect, pending, total: weekGames, points: correct, record: `${correct}-${incorrect}`, streak, results };
    }).sort((a, b) => b.points - a.points || a.incorrect - b.incorrect).map((e, i) => ({ ...e, rank: i + 1 }));
  })();

  const top3 = displayEntries.slice(0, 3);
  const rest = displayEntries.slice(3);
  const totalPages = Math.ceil(rest.length / ROWS_PER_PAGE);
  const pageRows = rest.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);


  const streakColor = (s: LeaderboardEntry['streak']) =>
    !s ? 'text-gray-500' : s.type === 'W' ? 'text-emerald-400' : 'text-red-400';

  // Derive results array from stats when API hasn't provided one (dummy data)
  function deriveResults(entry: LeaderboardEntry): ('W' | 'L' | 'P')[] {
    if (entry.results && entry.results.length > 0) return entry.results;
    const arr: ('W' | 'L' | 'P')[] = [];
    const sc = entry.streak?.count ?? 0;
    const st = entry.streak?.type ?? 'W';
    const wNS = Math.max(0, entry.correct - (st === 'W' ? sc : 0));
    const lNS = Math.max(0, entry.incorrect - (st === 'L' ? sc : 0));
    const mixed: ('W' | 'L')[] = [];
    for (let i = 0; i < wNS; i++) mixed.push('W');
    for (let i = 0; i < lNS; i++) mixed.push('L');
    seededShuffle(mixed, entry.rank * 4217);
    arr.push(...mixed);
    for (let i = 0; i < sc; i++) arr.push(st);
    for (let i = 0; i < entry.pending; i++) arr.push('P');
    return arr;
  }

  // Dot trail: shows all 272 dots for full season, or just that week's games when filtered
  function WLDots({ entry }: { entry: LeaderboardEntry }) {
    const results = deriveResults(entry);
    const maxDots = week !== null ? (GAMES_PER_WEEK[week] ?? 16) : TOTAL_GAMES;
    const isWeekView = week !== null;
    const dotSize = isWeekView ? 8 : 3;
    const dotColor = (r: 'W' | 'L' | 'P') =>
      r === 'W' ? '#34d399' : r === 'L' ? '#f87171' : '#374151';
    return (
      <div className="flex flex-wrap items-center gap-px" style={{ maxWidth: isWeekView ? 200 : 180 }}>
        {Array.from({ length: maxDots }).map((_, i) => {
          const r = results[i] as 'W' | 'L' | 'P' | undefined;
          return (
            <span
              key={i}
              title={r === 'W' ? 'Win' : r === 'L' ? 'Loss' : r === 'P' ? 'Pending' : 'No pick'}
              style={{ display: 'inline-block', width: dotSize, height: dotSize, borderRadius: '50%', background: r ? dotColor(r) : '#1f2937', flexShrink: 0 }}
            />
          );
        })}
      </div>
    );
  }

  function PlayerCell({ entry, isMe, bold }: { entry: LeaderboardEntry; isMe: boolean; bold?: boolean }) {
    const isWeekView = week !== null;
    const [showDots, setShowDots] = useState(false);
    const cellRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!showDots) return;
      function handleClick(e: MouseEvent) {
        if (cellRef.current && !cellRef.current.contains(e.target as Node)) {
          setShowDots(false);
        }
      }
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [showDots]);

    return (
      <td className="px-5 py-3">
        <div className="relative" ref={cellRef}>
          <div className={`font-semibold text-white ${bold ? 'text-base' : 'text-sm'} leading-snug`}>
            {entry.user.displayName}
            {isMe && <span className="ml-2 text-xs text-blue-400 font-normal">(you)</span>}
          </div>
          <div className="flex items-center gap-2.5 mt-1 flex-wrap">
            {!isWeekView ? (
              <span
                className="text-gray-400 text-xs cursor-pointer underline decoration-gray-500 hover:text-gray-300 transition-colors"
                onClick={() => setShowDots(v => !v)}
              >
                {entry.total} picks
              </span>
            ) : (
              <span className="text-gray-400 text-xs">{entry.total} picks</span>
            )}
            {entry.pending > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                <span>{entry.pending} pending</span>
              </span>
            )}
            {isWeekView && <WLDots entry={entry} />}
          </div>
          {/* Season dot trail popup */}
          {!isWeekView && showDots && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-xl" style={{ minWidth: 200 }}>
              <div className="text-gray-400 text-xs font-semibold mb-1">Season Record</div>
              <WLDots entry={entry} />
            </div>
          )}
        </div>
      </td>
    );
  }

  const colCount = 5;


  return (
    <div className="bg-[#ECCE8B] min-h-screen">
      <Nav />

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Back button */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* ── Outer box — matches prediction game style ── */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-lg border border-slate-600 shadow-2xl overflow-hidden">

          {/* Header — matches prediction game header */}
          <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 text-white px-6 py-4 border-b border-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl select-none" aria-hidden="true">🏆</span>
              <div>
                <h1 className="text-3xl font-black" style={{ fontFamily: 'Inter', fontWeight: 700 }}>
                  Leaderboard
                </h1>
                <p className="text-gray-300 text-base" style={{ fontFamily: 'Inter', fontWeight: 600 }}>
                  NFL Prediction Game — {season} Season
                </p>
              </div>
            </div>
            {/* Selectors */}
            <div className="flex items-center gap-2">
              <select
                value={week ?? ''}
                onChange={(e) => setWeek(e.target.value === '' ? null : parseInt(e.target.value))}
                className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg px-3 py-2 border border-slate-500 cursor-pointer focus:outline-none focus:border-blue-400"
              >
                <option value="">All Weeks</option>
                {Array.from({ length: 18 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
                <option value={19}>Wild Card</option>
                <option value={20}>Divisional</option>
                <option value={21}>Conf. Championship</option>
                <option value={22}>Super Bowl</option>
              </select>
              <select
                value={season}
                onChange={(e) => setSeason(parseInt(e.target.value))}
                className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg px-3 py-2 border border-slate-500 cursor-pointer focus:outline-none focus:border-blue-400"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-gray-400 animate-pulse text-lg">Loading leaderboard...</div>
          </div>
        ) : (
          <>
            {/* ── Podium ── */}
            <section className="mb-10">
              <Podium top3={top3} />
            </section>

            {/* ── Full rankings table ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-200">All Rankings</h2>
                <span className="text-gray-500 text-sm">{displayEntries.length} participant{displayEntries.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-700/60 overflow-hidden shadow-xl">
                <table className="w-full text-base">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-700 text-gray-400 text-sm uppercase tracking-wider">
                      <th className="px-5 py-4 text-left w-20">Rank</th>
                      <th className="px-5 py-4 text-left">Player</th>
                      <th className="px-5 py-4 text-center w-28">Record</th>
                      <th className="px-5 py-4 text-center w-24">Points</th>
                      <th className="px-5 py-4 text-center w-24">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Top 3 rows (always visible, not paginated) */}
                    {top3.map((entry, i) => {
                      const isMe = entry.user.id === profile?.id;
                      const medals = ['🥇', '🥈', '🥉'];
                      return (
                        <tr
                          key={entry.user.id}
                          className={`border-b border-slate-700/60 transition-colors ${
                            i === 0 ? 'bg-yellow-500/10 hover:bg-yellow-500/15' :
                            i === 1 ? 'bg-gray-400/10 hover:bg-gray-400/15' :
                            'bg-orange-500/10 hover:bg-orange-500/15'
                          } ${isMe ? 'ring-1 ring-inset ring-blue-500/50' : ''}`}
                        >
                          <td className="px-5 py-4 font-black text-xl">{medals[i]}</td>
                          <PlayerCell entry={entry} isMe={isMe} bold />
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center gap-0.5 leading-none">
                              <span className="text-green-400">{entry.correct}</span>
                              <span className="text-gray-500">-</span>
                              <span className="text-red-400">{entry.incorrect}</span>
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-yellow-300">{entry.points}</td>
                          <td className={`px-5 py-4 text-center font-mono font-bold ${streakColor(entry.streak)}`}>
                            {entry.streak ? `${entry.streak.type}${entry.streak.count}` : '—'}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Divider */}
                    {top3.length > 0 && rest.length > 0 && (
                      <tr>
                        <td colSpan={colCount} className="px-4 py-1 bg-slate-900/60">
                          <div className="border-t border-slate-600 border-dashed" />
                        </td>
                      </tr>
                    )}

                    {/* Paginated rows (rank 4+) + ghost rows to lock height */}
                    {pageRows.map((entry) => {
                      const isMe = entry.user.id === profile?.id;
                      return (
                        <tr
                          key={entry.user.id}
                          className={`border-b border-slate-700/40 hover:bg-slate-700/30 transition-colors ${
                            isMe ? 'bg-blue-500/10 ring-1 ring-inset ring-blue-500/40' : ''
                          }`}
                        >
                          <td className="px-5 py-4 text-gray-400 font-semibold">#{entry.rank}</td>
                          <PlayerCell entry={entry} isMe={isMe} />
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center gap-0.5 leading-none">
                              <span className="text-green-400">{entry.correct}</span>
                              <span className="text-gray-500">-</span>
                              <span className="text-red-400">{entry.incorrect}</span>
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-gray-200">{entry.points}</td>
                          <td className={`px-5 py-4 text-center font-mono font-bold ${streakColor(entry.streak)}`}>
                            {entry.streak ? `${entry.streak.type}${entry.streak.count}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Ghost rows — keep table height constant across all pages */}
                    {Array.from({ length: ROWS_PER_PAGE - pageRows.length }).map((_, i) => (
                      <tr key={`ghost-${i}`} className="border-b border-slate-700/20">
                        <td className="px-5 py-4">&nbsp;</td>
                        <td /><td /><td /><td />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-sm font-semibold"
                  >
                    ← Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-gray-500">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={`w-9 h-9 rounded-md text-sm font-semibold cursor-pointer transition-colors ${
                            page === p
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-sm font-semibold"
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Page info */}
              {totalPages > 1 && (
                <div className="text-center text-gray-500 text-xs mt-3">
                  Showing ranks {3 + (page - 1) * ROWS_PER_PAGE + 1}–{Math.min(3 + page * ROWS_PER_PAGE, displayEntries.length)} of {displayEntries.length}
                </div>
              )}
            </section>
          </>
        )}
          </div>{/* /Body */}
        </div>{/* /Outer box */}
      </div>
    </div>
  );
}
