import { useState } from "react";
import { Copy, Gift, Pencil, Plus, RotateCcw, Search, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { actions, formatRp, MILK_ID, STAMP_GOAL, useApp, type Category, type Product } from "@/lib/sugarmilk-store";
import { BottomSheet, Numpad } from "./Sheet";

export function Kelola() {
  return (
    <div className="space-y-6 pb-6">
      <h1 className="text-2xl font-extrabold">Kelola & Marketing</h1>
      <WAGenerator />
      <Loyalty />
      <MenuManager />
      <Settings />
    </div>
  );
}

function WAGenerator() {
  const s = useApp();
  const milk = s.stock.find((x) => x.id === MILK_ID)!.qty;
  const liter = milk.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  const [which, setWhich] = useState(s.shift);
  const text = which === "pagi"
    ? `☀️ Selamat Pagi! Susu Sapi Murni segar baru turun dari peternakan! Kita sudah buka di Lapak Pagi. Sisa stok hari ini ${liter} Liter. Yuk merapat sebelum kehabisan! 🥛`
    : `🌧️ Sore-sore enaknya ngangetin badan pakai STMJ & Susu Murni Hangat di Kedai! Sisa stok susu tinggal ${liter} Liter lagi. Gas ke kedai sekarang! ☕`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast.success("Teks disalin!", { duration: 1500 }); } catch { /* ignore */ }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-extrabold">📣 Status WhatsApp Otomatis</h2>
      <div className="grid grid-cols-2 gap-2">
        {(["pagi", "malam"] as const).map((w) => (
          <button key={w} onClick={() => setWhich(w)} className={`h-12 rounded-2xl font-bold ${which === w ? "bg-foreground text-background" : "bg-card shadow-card"}`}>
            {w === "pagi" ? "☀️ Template Pagi" : "🌙 Template Malam"}
          </button>
        ))}
      </div>
      <div className={`rounded-3xl p-6 ${which === "pagi" ? "bg-warning-soft" : "bg-gradient-primary text-primary-foreground"}`}>
        <p className="text-xs font-extrabold uppercase tracking-widest opacity-70">SugarMilk 🐄</p>
        <p className="mt-3 text-lg font-bold leading-snug">{text}</p>
        <p className="mt-4 text-3xl font-extrabold">{liter} L</p>
        <p className="text-sm opacity-80">sisa stok susu segar</p>
      </div>
      <button onClick={copy} className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-success text-lg font-extrabold text-success-foreground">
        <Copy className="h-5 w-5" /> Salin Teks & Bagikan ke WA <Share2 className="h-5 w-5" />
      </button>
    </section>
  );
}

function Loyalty() {
  const { customers } = useApp();
  const [q, setQ] = useState("");
  const list = customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-extrabold">🎟️ Kartu Stempel Langganan</h2>
      <p className="text-sm text-muted-foreground">Beli {STAMP_GOAL} cup = gratis 1 cup.</p>
      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-card px-3 shadow-card">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari / nama baru…" className="h-14 flex-1 bg-transparent font-semibold outline-none" />
        </div>
        <button disabled={!q.trim()} onClick={() => { actions.addCustomer(q.trim()); setQ(""); toast.success("Pelanggan ditambah", { duration: 1500 }); }}
          aria-label="Tambah pelanggan" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-40">
          <Plus />
        </button>
      </div>
      <div className="space-y-2">
        {list.map((c) => (
          <div key={c.id} className="rounded-2xl bg-card p-3 shadow-card">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="font-extrabold">{c.name}</p>
                <div className="mt-1 flex gap-1">
                  {Array.from({ length: STAMP_GOAL }).map((_, i) => (
                    <span key={i} className={`h-4 w-4 rounded-full ${i < c.stamps ? "bg-primary" : "bg-muted"}`} />
                  ))}
                </div>
              </div>
              {c.rewards > 0 && (
                <button onClick={() => { actions.redeem(c.id); toast.success(`${c.name} klaim 1 cup gratis!`, { duration: 1500 }); }}
                  className="flex h-14 items-center gap-1 rounded-2xl bg-success-soft px-3 font-bold text-success">
                  <Gift className="h-5 w-5" /> {c.rewards}
                </button>
              )}
              <button onClick={() => {
                const earned = actions.stamp(c.id);
                toast.success(earned ? `🎉 ${c.name} dapat 1 cup GRATIS!` : `+1 stempel untuk ${c.name}`, { duration: 1500 });
              }} className="h-14 rounded-2xl bg-primary px-4 font-extrabold text-primary-foreground active:scale-95">+1 Cup</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const EMPTY: Product = { id: "", name: "", category: "Susu Murni", price: 10000, emoji: "🥛", milk: 0.25, recipe: { cup: 1 } };

function MenuManager() {
  const { products } = useApp();
  const [edit, setEdit] = useState<Product | null>(null);
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">🧾 Menu & Harga</h2>
        <button onClick={() => setEdit({ ...EMPTY })} className="flex h-12 items-center gap-1 rounded-2xl bg-secondary px-4 font-bold text-secondary-foreground">
          <Plus className="h-5 w-5" /> Menu
        </button>
      </div>
      <div className="space-y-2">
        {products.map((p) => (
          <button key={p.id} onClick={() => setEdit({ ...p })} className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-card">
            <span className="text-2xl">{p.emoji}</span>
            <span className="flex-1">
              <span className="block font-bold">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.category} • susu {p.milk * 1000} ml</span>
            </span>
            <span className="font-extrabold text-primary">{formatRp(p.price)}</span>
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
      {edit && <ProductEditor p={edit} onClose={() => setEdit(null)} />}
    </section>
  );
}

const CATS: Category[] = ["Susu Murni", "Varian Rasa", "STMJ & Hangat", "Topping/Ekstra"];
const EMOJIS = ["🥛", "🍫", "🍓", "🍈", "🍠", "☕", "🍯", "🥚", "🐝", "🍞", "🍌", "🧋"];

function ProductEditor({ p: initial, onClose }: { p: Product; onClose: () => void }) {
  const [p, setP] = useState(initial);
  return (
    <BottomSheet open onClose={onClose} title={p.id ? "Edit Menu" : "Menu Baru"}>
      <div className="space-y-4">
        <input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} placeholder="Nama menu"
          className="h-14 w-full rounded-2xl bg-muted px-4 text-lg font-bold outline-none focus:ring-2 focus:ring-ring" />
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setP({ ...p, emoji: e })} className={`h-12 w-12 rounded-xl text-2xl ${p.emoji === e ? "bg-primary" : "bg-muted"}`}>{e}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CATS.map((c) => (
            <button key={c} onClick={() => setP({ ...p, category: c })} className={`h-12 rounded-xl text-sm font-bold ${p.category === c ? "bg-foreground text-background" : "bg-muted"}`}>{c}</button>
          ))}
        </div>
        <div>
          <p className="mb-2 font-bold">Potong susu per item</p>
          <div className="grid grid-cols-5 gap-2">
            {[0, 0.15, 0.2, 0.25, 0.35].map((m) => (
              <button key={m} onClick={() => setP({ ...p, milk: m })} className={`h-12 rounded-xl text-sm font-bold ${p.milk === m ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m * 1000}ml</button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-center text-3xl font-extrabold">{formatRp(p.price)}</p>
          <Numpad value={p.price} onChange={(price) => setP({ ...p, price })} quick={[1000, 2000, 5000, 10000]} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {p.id ? (
            <button onClick={() => { actions.deleteProduct(p.id); onClose(); }} className="flex h-16 items-center justify-center rounded-2xl bg-destructive-soft text-destructive"><Trash2 /></button>
          ) : <span />}
          <button disabled={!p.name.trim() || !p.price} onClick={() => {
            actions.saveProduct({ ...p, recipe: { ...p.recipe, cup: p.milk ? 1 : 0 } });
            toast.success("Menu disimpan", { duration: 1500 }); onClose();
          }} className="col-span-2 h-16 rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground disabled:opacity-40">Simpan</button>
        </div>
      </div>
    </BottomSheet>
  );
}

function Settings() {
  const { target } = useApp();
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-extrabold">⚙️ Pengaturan</h2>
      <div className="flex items-center gap-2 rounded-2xl bg-card p-3 shadow-card">
        <span className="flex-1 font-bold">Target harian: {target} cup</span>
        <button onClick={() => actions.setTarget(Math.max(10, target - 10))} className="h-14 w-14 rounded-2xl bg-muted text-xl font-extrabold">−</button>
        <button onClick={() => actions.setTarget(target + 10)} className="h-14 w-14 rounded-2xl bg-muted text-xl font-extrabold">+</button>
      </div>
      <button onClick={() => {
        if (confirm("Hapus semua data & isi ulang data demo?")) { actions.resetDemo(); toast.success("Data demo diisi ulang", { duration: 1500 }); }
      }} className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl border-2 border-warning font-extrabold text-warning">
        <RotateCcw className="h-5 w-5" /> Reset / Isi Data Demo
      </button>
    </section>
  );
}
