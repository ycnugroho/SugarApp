import { useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { actions, CUP_ID, MILK_ID, useApp, type StockItem } from "@/lib/sugarmilk-store";
import { BottomSheet } from "./Sheet";

const fmt = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 2 });

export function Stok() {
  const { stock } = useApp();
  const milk = stock.find((s) => s.id === MILK_ID)!;
  const cup = stock.find((s) => s.id === CUP_ID)!;
  const [restock, setRestock] = useState<StockItem | null>(null);
  const [wasteOpen, setWasteOpen] = useState(false);
  const pct = Math.min(100, (milk.qty / milk.max) * 100);
  const milkLow = milk.qty < 3, cupLow = cup.qty < 15;
  const tone = milkLow ? "bg-destructive" : pct < 35 ? "bg-warning" : "bg-primary";

  return (
    <div className="space-y-4 pb-6">
      <h1 className="text-2xl font-extrabold">Stok & Bahan Baku</h1>

      {(milkLow || cupLow) && (
        <div className="flex items-start gap-3 rounded-2xl bg-destructive-soft p-4 text-destructive">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" />
          <div className="font-bold">
            {milkLow && <p>Susu tinggal {fmt(milk.qty)} L — segera kulakan!</p>}
            {cupLow && <p>Cup tinggal {cup.qty} pcs — beli cup!</p>}
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-card p-5 shadow-card">
        <p className="text-sm font-bold text-muted-foreground">🥛 Tangki Susu Sapi Segar</p>
        <p className="mt-1 text-3xl font-extrabold">
          Sisa: {fmt(milk.qty)} <span className="text-lg text-muted-foreground">/ {milk.max} Liter</span>
        </p>
        <div className="mt-3 h-6 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">≈ {Math.floor(milk.qty / 0.25)} cup lagi (250 ml/cup)</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => setRestock(milk)} className="flex h-14 items-center justify-center gap-1 rounded-2xl bg-primary font-extrabold text-primary-foreground">
            <Plus className="h-5 w-5" /> Tambah Stok Pagi
          </button>
          <button onClick={() => setWasteOpen(true)} className="flex h-14 items-center justify-center gap-1 rounded-2xl bg-warning-soft font-extrabold text-warning">
            ⚠️ Basi / Tumpah
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-extrabold">Inventaris Operasional</h2>
        {stock.filter((s) => s.id !== MILK_ID).map((s) => {
          const low = s.qty <= s.low;
          const p = Math.min(100, (s.qty / s.max) * 100);
          return (
            <button key={s.id} onClick={() => setRestock(s)}
              className={`flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-card ${low ? "ring-2 ring-warning" : ""}`}>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold">{s.name}</span>
                  <span className={`font-extrabold ${low ? "text-warning" : ""}`}>{fmt(s.qty)} {s.unit}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${low ? "bg-warning" : "bg-success"}`} style={{ width: `${p}%` }} />
                </div>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"><Plus /></span>
            </button>
          );
        })}
      </div>

      <RestockSheet item={restock} onClose={() => setRestock(null)} />
      <WasteSheet open={wasteOpen} onClose={() => setWasteOpen(false)} />
    </div>
  );
}

function RestockSheet({ item, onClose }: { item: StockItem | null; onClose: () => void }) {
  const [amt, setAmt] = useState(0);
  if (!item) return null;
  const steps = item.unit === "Liter" ? [5, 10, 15, 20] : item.unit === "Ml" ? [100, 250, 500, 1000] : [5, 10, 25, 50];
  return (
    <BottomSheet open onClose={() => { setAmt(0); onClose(); }} title={`Tambah ${item.name}`}>
      <p className="text-center text-4xl font-extrabold">+{fmt(amt)} <span className="text-lg">{item.unit}</span></p>
      <p className="mb-4 text-center text-sm text-muted-foreground">Sekarang: {fmt(item.qty)} {item.unit}</p>
      <div className="grid grid-cols-4 gap-2">
        {steps.map((s) => (
          <button key={s} onClick={() => setAmt(amt + s)} className="h-16 rounded-2xl bg-secondary text-lg font-extrabold text-secondary-foreground active:scale-95">+{s}</button>
        ))}
      </div>
      {item.id === MILK_ID && (
        <button onClick={() => setAmt(Math.max(0, +(item.max - item.qty).toFixed(2)))} className="mt-2 h-14 w-full rounded-2xl bg-muted font-bold">
          Isi Penuh Tangki ({item.max} L)
        </button>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button onClick={() => setAmt(0)} className="h-16 rounded-2xl bg-muted font-bold">Reset</button>
        <button disabled={!amt} onClick={() => {
          actions.restock(item.id, amt);
          toast.success(`${item.name} +${fmt(amt)} ${item.unit}`, { duration: 1500 });
          setAmt(0); onClose();
        }} className="col-span-2 h-16 rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground disabled:opacity-40">Simpan</button>
      </div>
    </BottomSheet>
  );
}

function WasteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const opts = [0.25, 0.5, 1, 2, 3, 5];
  return (
    <BottomSheet open={open} onClose={onClose} title="⚠️ Susu Basi / Tumpah">
      <p className="mb-4 text-sm text-muted-foreground">Ketuk jumlah yang terbuang. Kerugian dicatat ke laporan Anti-Boncos.</p>
      <div className="grid grid-cols-3 gap-2">
        {opts.map((l) => (
          <button key={l} onClick={() => {
            actions.recordWaste(l);
            toast.warning(`${fmt(l)} L susu dicatat terbuang`, { duration: 1500 });
            onClose();
          }} className="flex h-20 flex-col items-center justify-center rounded-2xl bg-destructive-soft text-destructive active:scale-95">
            <Trash2 className="h-5 w-5" />
            <span className="text-lg font-extrabold">{fmt(l)} L</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
