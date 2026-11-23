import { useEffect, useState } from 'react';
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { fetchDashboard, pct, summary, type DashboardResult } from './api';

/** Operator screen (`?admin`): analytics and verification spike flags (requirement.md v1.35 §17, §21). */
export function AdminDashboard() {
  const [result, setResult] = useState<DashboardResult | null>(() =>
    readSupabaseConfig().ok ? null : { ok: false, reason: 'error', message: 'Not connected' },
  );
  useEffect(() => {
    const cfg = readSupabaseConfig();
    if (!cfg.ok) return;
    let alive = true;
    fetchDashboard(getSupabaseClient(cfg.config)).then(
      (r) => alive && setResult(r),
      (e: unknown) => alive && setResult({ ok: false, reason: 'error', message: String(e) }),
    );
    return () => {
      alive = false;
    };
  }, []);

  if (!result) return <Page>Loading…</Page>;
  if (!result.ok)
    return <Page>{result.reason === 'not-operator' ? 'This page is for operators only.' : `Could not load the dashboard: ${result.message}`}</Page>;
  const d = result.data;
  const s = summary(d.days);
  return (
    <Page>
      <p className="mb-4 text-sm text-slate-500">Calgary day {d.today} · last {d.days.length} days · email opt-ins: {d.email_updates}</p>
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="New visitors" value={String(s.newVisitors)} />
        <Stat label="First action" value={pct(s.firstAction)} />
        <Stat label="D1 retention" value={pct(s.d1)} />
        <Stat label="D7 retention" value={pct(s.d7)} />
        <Stat label="Shares" value={String(s.shares)} />
        <Stat label="Invite visits" value={String(s.inviteVisits)} />
      </div>

      <h2 className="mb-2 font-bold text-slate-800">⚠️ Verification spikes (last 14 days)</h2>
      {d.spikes.length === 0 ? (
        <p className="mb-6 text-sm text-slate-500">None.</p>
      ) : (
        <Table head={['Day', 'Community', 'New verifications', 'Usual per day']} rows={d.spikes.map((x) => [x.day, x.name, String(x.verifications), String(x.usual)])} />
      )}

      <h2 className="mb-2 font-bold text-slate-800">Days</h2>
      <Table
        head={['Day', 'Visitors', 'New', 'First action', 'D1', 'D7', 'Shares', 'Invite visits']}
        rows={d.days.map((x) => [x.day, String(x.visitors), String(x.new_visitors), pct(x.first_action_pct), pct(x.d1_pct), pct(x.d7_pct), String(x.shares), String(x.invite_visits)])}
      />

      <h2 className="mb-2 font-bold text-slate-800">Visits by community (last 7 days)</h2>
      <Table head={['Community', 'Visitors']} rows={d.communities_7d.map((c) => [c.name, String(c.visitors)])} />
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-dvh overflow-y-auto bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-1 text-xl font-bold text-slate-800">MakeCalgaryTalk · Operator</h1>
        {children}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="mb-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="px-3 py-2 text-slate-400">
                No data yet.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                {r.map((c, j) => (
                  <td key={j} className="whitespace-nowrap px-3 py-1.5 text-slate-700">
                    {c}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
