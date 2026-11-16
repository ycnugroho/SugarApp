import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { actions, formatRp, periodStart, useApp } from "@/lib/sugarmilk-store";
import { BottomSheet, Numpad } from "./Sheet";

export const EXPENSE_PRESETS = [
  { emoji: "🥛", label: "Kulakan Susu Mentah", def: 225000 },
  { emoji: "🧊", label: "Beli Es Batu", def: 20000 },
  { emoji: "🍯", label: "Beli Gula / Sirup / Perasa", def: 50000 },
  { emoji: "🥚", label: "Beli Telur & Jahe", def: 70000 },
  { emoji: "🥤", label: "Beli Cup / Plastik / Sedotan", def: 90000 },
  { emoji: "⛽", label: "Bensin & Operasional Lapak", def: 20000 },
];

export function Kas() {
  const s = useApp();
  const [sel, setSel] = useState<(typeof EXPENSE_PRESETS)[number] | null>(null);
  const [amt, setAmt] = useState(0);
  const today = periodStart("hari");
  const list = s.expenses.filter((e) => e.ts >= today).sort((a, b) => b.ts - a.ts);
  const total = list.reduce((a, e) => a + e.amount, 0);

  return (
    <div className="space-y-4 pb-6">
      <h1 className="text-2xl font-extrabold">Kas & Pengeluaran</h1>
      <div className="rounded-3xl bg-destructive-soft p-5">
        <p className="text-sm font-bold text-destructive">Pengeluaran Hari Ini</p>
        <p className="text-3xl font-extrabold text-destructive">{formatRp(total)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {EXPENSE_PRESETS.map((p) => (
          <button key={p.label} onClick={() => { setSel(p); setAmt(p.def); }}
            className="flex min-h-[96px] flex-col items-start justify-between rounded-3xl bg-card p-4 text-left shadow-card active:scale-95">
            <span className="text-3xl">{p.emoji}</span>
            <span className="font-bold leading-tight">{p.label}</span>
          </button>
        ))}
      </div>

      <div>
        <h2 className="mb-2 text-lg font-extrabold">Catatan Hari Ini</h2>
        {list.length === 0 && <p className="text-muted-foreground">Belum ada pengeluaran.</p>}
        <div className="space-y-2">
          {list.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
              <div className="flex-1">
                <p className="font-bold">{e.cat}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} • {e.shift === "pagi" ? "☀️ Lapak" : "🌙 Kedai"}
                </p>
              </div>
              <span className="font-extrabold text-destructive">-{formatRp(e.amount)}</span>
              <button aria-label="Hapus" onClick={() => actions.deleteExpense(e.id)} className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <BottomSheet open={!!sel} onClose={() => setSel(null)} title={`${sel?.emoji} ${sel?.label}`}>
        <p className="mb-4 text-center text-4xl font-extrabold">{formatRp(amt)}</p>
        <Numpad value={amt} onChange={setAmt} />
        <button disabled={!amt} onClick={() => {
          actions.addExpense(sel!.label, amt);
          toast.success("Pengeluaran tercatat", { description: `${sel!.label} • ${formatRp(amt)}`, duration: 1500 });
          setSel(null);
        }} className="mt-3 h-16 w-full rounded-2xl bg-destructive text-lg font-extrabold text-destructive-foreground disabled:opacity-40">
          Konfirmasi {formatRp(amt)}
        </button>
      </BottomSheet>
    </div>
  );
}
