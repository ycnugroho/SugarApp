import { useMemo, useState } from "react";
import { Banknote, Minus, QrCode, Zap } from "lucide-react";
import { toast } from "sonner";
import { actions, formatRp, useApp, type Category, type PayMethod } from "@/lib/sugarmilk-store";
import { BottomSheet } from "./Sheet";

const CATS: ("Semua" | Category)[] = ["Semua", "Susu Murni", "Varian Rasa", "STMJ & Hangat", "Topping/Ekstra"];

function ProductGrid({ cart, setCart, cat }: {
  cart: Record<string, number>; setCart: (c: Record<string, number>) => void; cat: string;
}) {
  const { products } = useApp();
  const list = products.filter((p) => cat === "Semua" || p.category === cat);
  return (
    <div className="grid grid-cols-2 gap-3">
      {list.map((p) => {
        const q = cart[p.id] ?? 0;
        return (
          <div key={p.id} className="relative">
            <button
              onClick={() => setCart({ ...cart, [p.id]: q + 1 })}
              className={`flex min-h-[132px] w-full flex-col items-start justify-between rounded-3xl border-2 bg-card p-4 text-left shadow-card transition active:scale-95 ${q ? "border-primary" : "border-transparent"}`}
            >
              <span className="text-4xl leading-none">{p.emoji}</span>
              <span>
                <span className="block text-base font-bold leading-tight">{p.name}</span>
                <span className="mt-1 block text-lg font-extrabold text-primary">{formatRp(p.price)}</span>
              </span>
            </button>
            {q > 0 && (
              <>
                <span key={q} className="animate-pop pointer-events-none absolute right-2 top-2 flex h-11 min-w-11 items-center justify-center rounded-full bg-primary px-2 text-lg font-extrabold text-primary-foreground">
                  +{q}
                </span>
                <button
                  aria-label={`Kurangi ${p.name}`}
                  onClick={() => setCart({ ...cart, [p.id]: q - 1 })}
                  className="absolute bottom-2 right-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive-soft text-destructive active:scale-90"
                >
                  <Minus className="h-6 w-6" strokeWidth={3} />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function useTotals(cart: Record<string, number>) {
  const { products } = useApp();
  return useMemo(() => {
    let items = 0, total = 0;
    for (const [id, q] of Object.entries(cart)) {
      const p = products.find((x) => x.id === id);
      if (p) { items += q; total += q * p.price; }
    }
    return { items, total };
  }, [cart, products]);
}

function CatPills({ cat, setCat }: { cat: string; setCat: (c: string) => void }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {CATS.map((c) => (
        <button key={c} onClick={() => setCat(c)}
          className={`h-12 shrink-0 rounded-full px-5 text-sm font-bold ${cat === c ? "bg-foreground text-background" : "bg-card text-foreground shadow-card"}`}>
          {c}
        </button>
      ))}
    </div>
  );
}

export function Kasir() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cat, setCat] = useState("Semua");
  const [batchOpen, setBatchOpen] = useState(false);
  const { items, total } = useTotals(cart);

  const pay = (m: PayMethod) => {
    actions.checkout(cart, m);
    setCart({});
    toast.success("Transaksi Tersimpan!", { description: `${items} item • ${formatRp(total)} • ${m === "qris" ? "QRIS" : "Tunai"}`, duration: 1500 });
  };

  return (
    <div className="space-y-4 pb-48">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Kasir Kilat</h1>
        <button onClick={() => setBatchOpen(true)}
          className="flex h-14 items-center gap-2 rounded-2xl bg-warning-soft px-4 font-extrabold text-warning">
          <Zap className="h-5 w-5" fill="currentColor" /> Catat Cepat / Susulan
        </button>
      </div>
      <CatPills cat={cat} setCat={setCat} />
      <ProductGrid cart={cart} setCart={setCart} cat={cat} />

      {items > 0 && (
        <div className="fixed bottom-[76px] left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 px-3">
          <div className="rounded-3xl bg-card p-3 shadow-float">
            <div className="mb-2 flex items-center justify-between px-1">
              <button onClick={() => setCart({})} className="h-10 text-sm font-bold text-destructive">Batal</button>
              <span className="text-xl font-extrabold">{items} Item • {formatRp(total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => pay("tunai")} className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-success text-lg font-extrabold text-success-foreground active:scale-95">
                <Banknote className="h-6 w-6" /> Tunai / Cash
              </button>
              <button onClick={() => pay("qris")} className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground active:scale-95">
                <QrCode className="h-6 w-6" /> QRIS
              </button>
            </div>
          </div>
        </div>
      )}

      <BatchSheet open={batchOpen} onClose={() => setBatchOpen(false)} />
    </div>
  );
}

function BatchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cat, setCat] = useState("Semua");
  const [method, setMethod] = useState<PayMethod>("tunai");
  const { items, total } = useTotals(cart);
  const save = () => {
    actions.checkout(cart, method, true);
    toast.success("Catatan susulan tersimpan!", { description: `${items} item • ${formatRp(total)}`, duration: 1500 });
    setCart({});
    onClose();
  };
  return (
    <BottomSheet open={open} onClose={onClose} title="⚡ Catat Susulan">
      <p className="mb-3 text-sm text-muted-foreground">Ketuk semua item yang terjual barusan, lalu simpan sekaligus.</p>
      <div className="space-y-3">
        <CatPills cat={cat} setCat={setCat} />
        <ProductGrid cart={cart} setCart={setCart} cat={cat} />
      </div>
      <div className="sticky bottom-0 mt-4 space-y-2 bg-card pt-3">
        <div className="grid grid-cols-2 gap-2">
          {(["tunai", "qris"] as PayMethod[]).map((m) => (
            <button key={m} onClick={() => setMethod(m)}
              className={`h-14 rounded-2xl font-bold ${method === m ? "bg-foreground text-background" : "bg-muted"}`}>
              {m === "tunai" ? "Tunai" : "QRIS"}
            </button>
          ))}
        </div>
        <button disabled={!items} onClick={save}
          className="h-16 w-full rounded-2xl bg-gradient-primary text-lg font-extrabold text-primary-foreground disabled:opacity-40">
          Simpan {items} Item • {formatRp(total)}
        </button>
      </div>
    </BottomSheet>
  );
}
