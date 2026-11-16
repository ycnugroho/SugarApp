import { useState } from "react";
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRp, periodStart, summarize, useApp, type Period } from "@/lib/sugarmilk-store";

export function Laporan() {
  const s = useApp();
  const [period, setPeriod] = useState<Period>("hari");
  const r = summarize(s, periodStart(period));
  const today = summarize(s, periodStart("hari"));
  const untung = r.profit >= 0;
  const pct = Math.min(100, Math.round((today.cups / s.target) * 100));
  const data = [
    { name: "Omzet (rb)", "☀️ Lapak Pagi": Math.round(r.pagi.revenue / 1000), "🌙 Kedai Malam": Math.round(r.malam.revenue / 1000) },
    { name: "Cup", "☀️ Lapak Pagi": r.pagi.cups, "🌙 Kedai Malam": r.malam.cups },
  ];

  return (
    <div className="space-y-4 pb-6">
      <h1 className="text-2xl font-extrabold">Laporan & Anti-Boncos</h1>
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
        {(["hari", "minggu", "bulan"] as Period[]).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`h-12 rounded-xl font-bold ${period === p ? "bg-card shadow-card" : "text-muted-foreground"}`}>
            {p === "hari" ? "Hari Ini" : p === "minggu" ? "7 Hari" : "30 Hari"}
          </button>
        ))}
      </div>

      <div className={`rounded-3xl p-5 ${untung ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
        <p className="text-sm font-bold opacity-90">Laba Bersih</p>
        <p className="text-4xl font-extrabold">{formatRp(r.profit)}</p>
        <p className="mt-1 text-xl font-extrabold">{untung ? "✅ UNTUNG" : "🔻 BONCOS / RUGI"}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-card p-4 shadow-card">
          <p className="text-sm font-bold text-muted-foreground">Omzet Kotor</p>
          <p className="text-xl font-extrabold text-success">{formatRp(r.omzet)}</p>
          <p className="mt-2 text-xs">💵 Tunai {formatRp(r.cash)}</p>
          <p className="text-xs">📱 QRIS {formatRp(r.qris)}</p>
        </div>
        <div className="rounded-3xl bg-card p-4 shadow-card">
          <p className="text-sm font-bold text-muted-foreground">Pengeluaran & HPP</p>
          <p className="text-xl font-extrabold text-destructive">{formatRp(r.totalOut)}</p>
          <p className="mt-2 text-xs">🧾 Belanja {formatRp(r.expense)}</p>
          <p className="text-xs">🗑️ Waste {formatRp(r.wasteCost)}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-card p-5 shadow-card">
        <p className="font-bold">🎯 Target Hari Ini: {s.target} Cup</p>
        <p className="text-sm text-muted-foreground">Tercapai: {today.cups} Cup ({pct}%)</p>
        <div className="mt-3 h-5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm font-bold">{pct >= 100 ? "🎉 Target tembus! Mantap!" : `Kurang ${s.target - today.cups} cup lagi, semangat!`}</p>
      </div>

      <div className="rounded-3xl bg-card p-5 shadow-card">
        <h2 className="mb-3 text-lg font-extrabold">☀️ Lapak Pagi vs 🌙 Kedai Malam</h2>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis hide />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="☀️ Lapak Pagi" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="🌙 Kedai Malam" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {([["☀️ Lapak Pagi", r.pagi, "bg-warning-soft"], ["🌙 Kedai Malam", r.malam, "bg-secondary"]] as const).map(([n, v, bg]) => (
            <div key={n} className={`rounded-2xl p-3 ${bg}`}>
              <p className="font-extrabold">{n}</p>
              <p>{formatRp(v.revenue)}</p>
              <p>{v.cups} cup</p>
              <p className="mt-1 text-xs">🏆 {v.best}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
