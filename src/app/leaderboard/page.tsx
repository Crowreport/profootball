'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { useUserStore } from '@/store/useUserStore';

const ROWS_PER_PAGE = 25;

// ─── Dummy data (shown when no real picks exist) ─────────────────────────────
const DUMMY_ENTRIES: LeaderboardEntry[] = [
  { rank:1, user:{id:'d1',displayName:'GridironGuru'},    points:14, record:'14-2',  correct:14, incorrect:2,  pending:0, total:16, streak:{type:'W',count:5} },
  { rank:2, user:{id:'d2',displayName:'BlitzKing99'},     points:13, record:'13-3',  correct:13, incorrect:3,  pending:0, total:16, streak:{type:'W',count:2} },
  { rank:3, user:{id:'d3',displayName:'TDQueen'},         points:12, record:'12-4',  correct:12, incorrect:4,  pending:0, total:16, streak:{type:'L',count:1} },
  { rank:4, user:{id:'d4',displayName:'RedZoneRandy'},    points:11, record:'11-5',  correct:11, incorrect:5,  pending:0, total:16, streak:{type:'W',count:3} },
  { rank:5, user:{id:'d5',displayName:'SackMaster'},      points:11, record:'11-5',  correct:11, incorrect:5,  pending:0, total:16, streak:{type:'L',count:2} },
  { rank:6, user:{id:'d6',displayName:'PocketRocket'},    points:10, record:'10-6',  correct:10, incorrect:6,  pending:0, total:16, streak:{type:'W',count:1} },
  { rank:7, user:{id:'d7',displayName:'HailMaryHank'},    points:10, record:'10-6',  correct:10, incorrect:6,  pending:0, total:16, streak:{type:'W',count:4} },
  { rank:8, user:{id:'d8',displayName:'LinebackerLiz'},   points:9,  record:'9-7',   correct:9,  incorrect:7,  pending:0, total:16, streak:null },
  { rank:9, user:{id:'d9',displayName:'FumbleFreeFranck'},points:9,  record:'9-7',   correct:9,  incorrect:7,  pending:0, total:16, streak:{type:'L',count:3} },
  { rank:10,user:{id:'d10',displayName:'EndZoneElla'},    points:8,  record:'8-8',   correct:8,  incorrect:8,  pending:0, total:16, streak:{type:'W',count:2} },
  { rank:11,user:{id:'d11',displayName:'SnapCount'},      points:8,  record:'8-8',   correct:8,  incorrect:8,  pending:0, total:16, streak:null },
  { rank:12,user:{id:'d12',displayName:'DriveTimeDave'},  points:7,  record:'7-9',   correct:7,  incorrect:9,  pending:0, total:16, streak:{type:'W',count:1} },
  { rank:13,user:{id:'d13',displayName:'SpecialTeamsSue'},points:7,  record:'7-9',   correct:7,  incorrect:9,  pending:0, total:16, streak:{type:'L',count:1} },
  { rank:14,user:{id:'d14',displayName:'TwoMinuteTom'},   points:6,  record:'6-10',  correct:6,  incorrect:10, pending:0, total:16, streak:{type:'L',count:4} },
  { rank:15,user:{id:'d15',displayName:'ChopBlockChris'}, points:6,  record:'6-10',  correct:6,  incorrect:10, pending:0, total:16, streak:{type:'W',count:1} },
  { rank:16,user:{id:'d16',displayName:'AudibleAlex'},    points:5,  record:'5-11',  correct:5,  incorrect:11, pending:0, total:16, streak:null },
  { rank:17,user:{id:'d17',displayName:'JukeMoveJordan'}, points:5,  record:'5-11',  correct:5,  incorrect:11, pending:0, total:16, streak:{type:'L',count:2} },
  { rank:18,user:{id:'d18',displayName:'PuntReturnPat'},  points:4,  record:'4-12',  correct:4,  incorrect:12, pending:0, total:16, streak:{type:'W',count:1} },
  { rank:19,user:{id:'d19',displayName:'NoseTackleNick'}, points:4,  record:'4-12',  correct:4,  incorrect:12, pending:0, total:16, streak:{type:'L',count:5} },
  { rank:20,user:{id:'d20',displayName:'WildcardWendy'},  points:3,  record:'3-13',  correct:3,  incorrect:13, pending:0, total:16, streak:null },
  { rank:21,user:{id:'d21',displayName:'SafetyBlitzSam'}, points:3,  record:'3-13',  correct:3,  incorrect:13, pending:0, total:16, streak:{type:'L',count:1} },
  { rank:22,user:{id:'d22',displayName:'CoverTwoCole'},   points:3,  record:'3-13',  correct:3,  incorrect:13, pending:0, total:16, streak:{type:'W',count:2} },
  { rank:23,user:{id:'d23',displayName:'BootlegBeth'},    points:2,  record:'2-14',  correct:2,  incorrect:14, pending:0, total:16, streak:{type:'L',count:3} },
  { rank:24,user:{id:'d24',displayName:'RedDogRex'},      points:2,  record:'2-14',  correct:2,  incorrect:14, pending:0, total:16, streak:null },
  { rank:25,user:{id:'d25',displayName:'OffsidOliver'},   points:1,  record:'1-15',  correct:1,  incorrect:15, pending:0, total:16, streak:{type:'L',count:6} },
  { rank:26,user:{id:'d26',displayName:'HoldingPenalty'}, points:1,  record:'1-15',  correct:1,  incorrect:15, pending:0, total:16, streak:{type:'L',count:2} },
  { rank:27,user:{id:'d27',displayName:'FalseStartFrank'},points:1,  record:'1-15',  correct:1,  incorrect:15, pending:0, total:16, streak:null },
  { rank:28,user:{id:'d28',displayName:'PassIntPriya'},   points:0,  record:'0-16',  correct:0,  incorrect:16, pending:0, total:16, streak:{type:'L',count:16} },
  { rank:29,user:{id:'d29',displayName:'DelayOfGame'},    points:0,  record:'0-16',  correct:0,  incorrect:16, pending:0, total:16, streak:{type:'L',count:8} },
  { rank:30,user:{id:'d30',displayName:'IllegalContact'}, points:0,  record:'0-16',  correct:0,  incorrect:16, pending:0, total:16, streak:{type:'L',count:4} },
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
    3: { w: 104, h: 120, bg: '#a05a28', border: '#d48040', label: '3RD', nameSz: 'text-base', crown: false, growDelay: '260ms', textDelay: '790ms' },
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
          <div style={{ transform: 'translateY(-28px)' }}><Block place={2} entry={top3[1] ?? null} /></div>
          <Block place={1} entry={top3[0] ?? null} />
          <div style={{ transform: 'translateY(-28px)' }}><Block place={3} entry={top3[2] ?? null} /></div>
        </div>

        {/* Baseline */}
        <div style={{ width: totalW, height: 3, background: 'linear-gradient(to right, transparent, #94a3b8 12%, #94a3b8 88%, transparent)', borderRadius: 2 }} />
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
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (yr: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?season=${yr}&limit=500`);
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
    fetchData(season);
    setPage(1);
  }, [season, fetchData]);

  // Fall back to dummy data so the UI is always visible
  const displayEntries = entries.length > 0 ? entries : DUMMY_ENTRIES;

  const top3 = displayEntries.slice(0, 3);
  const rest = displayEntries.slice(3);
  const totalPages = Math.ceil(rest.length / ROWS_PER_PAGE);
  const pageRows = rest.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);


  const streakColor = (s: LeaderboardEntry['streak']) =>
    !s ? 'text-gray-500' : s.type === 'W' ? 'text-emerald-400' : 'text-red-400';

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
            {/* Year selector */}
            <select
              value={season}
              onChange={(e) => setSeason(parseInt(e.target.value))}
              className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg px-3 py-2 border border-slate-500 cursor-pointer focus:outline-none focus:border-blue-400"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
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
                          <td className="px-5 py-4 font-semibold text-white">
                            <span>{entry.user.displayName}</span>
                            {isMe && <span className="ml-2 text-xs text-blue-400 font-normal">(you)</span>}
                          </td>
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
                        <td colSpan={5} className="px-4 py-1 bg-slate-900/60">
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
                          <td className="px-5 py-4 font-medium text-white">
                            <span>{entry.user.displayName}</span>
                            {isMe && <span className="ml-2 text-xs text-blue-400 font-normal">(you)</span>}
                          </td>
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
