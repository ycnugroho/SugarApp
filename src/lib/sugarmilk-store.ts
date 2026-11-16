import { useSyncExternalStore } from "react";

export type Shift = "pagi" | "malam";
export type Category = "Susu Murni" | "Varian Rasa" | "STMJ & Hangat" | "Topping/Ekstra";
export type PayMethod = "tunai" | "qris";

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  emoji: string;
  /** liters of raw milk per item */
  milk: number;
  /** extra stock deductions: stockId -> qty */
  recipe: Record<string, number>;
}
export interface StockItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  max: number;
  low: number;
  cost: number; // cost per unit (Rp)
}
export interface TxItem { pid: string; name: string; qty: number; price: number }
export interface Transaction {
  id: string;
  ts: number;
  shift: Shift;
  method: PayMethod;
  items: TxItem[];
  total: number;
  batch?: boolean;
}
export interface Expense { id: string; ts: number; shift: Shift; cat: string; amount: number }
export interface Waste { id: string; ts: number; shift: Shift; liters: number; cost: number }
export interface Customer { id: string; name: string; stamps: number; rewards: number }

export interface AppState {
  shift: Shift;
  target: number;
  products: Product[];
  stock: StockItem[];
  transactions: Transaction[];
  expenses: Expense[];
  waste: Waste[];
  customers: Customer[];
}

export const MILK_ID = "susu";
export const CUP_ID = "cup";
export const STAMP_GOAL = 10;
const KEY = "sugarmilk-v1";

export const formatRp = (n: number) =>
  "Rp " + Math.round(n).toLocaleString("id-ID");

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function defaultProducts(): Product[] {
  return [
    { id: "p1", name: "Susu Murni Original", category: "Susu Murni", price: 8000, emoji: "🥛", milk: 0.25, recipe: { cup: 1, gula: 15 } },
    { id: "p2", name: "Susu Coklat", category: "Varian Rasa", price: 10000, emoji: "🍫", milk: 0.25, recipe: { cup: 1, coklat: 1, gula: 10 } },
    { id: "p3", name: "Susu Strawberry", category: "Varian Rasa", price: 10000, emoji: "🍓", milk: 0.25, recipe: { cup: 1, strawberry: 1, gula: 10 } },
    { id: "p4", name: "Susu Melon", category: "Varian Rasa", price: 10000, emoji: "🍈", milk: 0.25, recipe: { cup: 1, gula: 15 } },
    { id: "p5", name: "Susu Taro", category: "Varian Rasa", price: 11000, emoji: "🍠", milk: 0.25, recipe: { cup: 1, taro: 1, gula: 10 } },
    { id: "p6", name: "STMJ Original", category: "STMJ & Hangat", price: 13000, emoji: "☕", milk: 0.25, recipe: { cup: 1, jahe: 1, telur: 1, madu: 10 } },
    { id: "p7", name: "STMJ Madu Telur", category: "STMJ & Hangat", price: 16000, emoji: "🍯", milk: 0.25, recipe: { cup: 1, jahe: 1, telur: 1, madu: 25 } },
    { id: "p8", name: "Ekstra Telur Kampung", category: "Topping/Ekstra", price: 4000, emoji: "🥚", milk: 0, recipe: { telur: 1 } },
    { id: "p9", name: "Ekstra Madu", category: "Topping/Ekstra", price: 3000, emoji: "🐝", milk: 0, recipe: { madu: 15 } },
    { id: "p10", name: "Roti Bakar", category: "Topping/Ekstra", price: 12000, emoji: "🍞", milk: 0, recipe: {} },
  ];
}

function defaultStock(): StockItem[] {
  return [
    { id: MILK_ID, name: "Susu Segar Mentah", unit: "Liter", qty: 25, max: 25, low: 3, cost: 9000 },
    { id: CUP_ID, name: "Cup/Botol Plastik", unit: "Pcs", qty: 120, max: 150, low: 15, cost: 600 },
    { id: "coklat", name: "Bubuk Coklat", unit: "Porsi", qty: 40, max: 60, low: 8, cost: 700 },
    { id: "strawberry", name: "Bubuk Strawberry", unit: "Porsi", qty: 35, max: 60, low: 8, cost: 700 },
    { id: "taro", name: "Bubuk Taro", unit: "Porsi", qty: 30, max: 60, low: 8, cost: 800 },
    { id: "jahe", name: "Jahe & Rempah STMJ", unit: "Porsi", qty: 30, max: 40, low: 5, cost: 1200 },
    { id: "telur", name: "Telur Ayam Kampung", unit: "Butir", qty: 30, max: 40, low: 6, cost: 2500 },
    { id: "madu", name: "Madu Murni", unit: "Ml", qty: 800, max: 1000, low: 100, cost: 80 },
    { id: "gula", name: "Gula Cair", unit: "Ml", qty: 1500, max: 2000, low: 200, cost: 15 },
    { id: "es", name: "Es Batu", unit: "Pak", qty: 6, max: 10, low: 2, cost: 5000 },
  ];
}

/** Deterministic PRNG for demo data */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function makeDemoState(): AppState {
  const products = defaultProducts();
  const r = rng(42);
  const transactions: Transaction[] = [];
  const expenses: Expense[] = [];
  const waste: Waste[] = [];
  const now = new Date();
  const pagiPool = ["p1", "p1", "p1", "p2", "p2", "p3", "p4", "p5"];
  const malamPool = ["p6", "p6", "p7", "p7", "p1", "p2", "p5", "p8", "p9", "p10"];

  for (let d = 29; d >= 0; d--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    const isToday = d === 0;
    const curHour = now.getHours();
    for (const shift of ["pagi", "malam"] as Shift[]) {
      const startH = shift === "pagi" ? 6 : 15;
      const endH = shift === "pagi" ? 11 : 22;
      const count = Math.floor((shift === "pagi" ? 22 : 18) + r() * 14);
      for (let i = 0; i < count; i++) {
        const h = startH + r() * (endH - startH);
        if (isToday && h > curHour) continue;
        const ts = new Date(day).setHours(Math.floor(h), Math.floor((h % 1) * 60));
        const pool = shift === "pagi" ? pagiPool : malamPool;
        const n = 1 + Math.floor(r() * 3);
        const map = new Map<string, number>();
        for (let k = 0; k < n; k++) {
          const pid = pool[Math.floor(r() * pool.length)]!;
          map.set(pid, (map.get(pid) ?? 0) + 1);
        }
        const items: TxItem[] = [...map].map(([pid, qty]) => {
          const p = products.find((x) => x.id === pid)!;
          return { pid, name: p.name, qty, price: p.price };
        });
        transactions.push({
          id: uid(), ts, shift,
          method: r() < 0.55 ? "tunai" : "qris",
          items, total: items.reduce((s, it) => s + it.qty * it.price, 0),
        });
      }
    }
    const at = (h: number) => new Date(day).setHours(h, 0);
    if (!isToday || curHour >= 5) {
      expenses.push({ id: uid(), ts: at(5), shift: "pagi", cat: "Kulakan Susu Mentah", amount: 225000 });
      expenses.push({ id: uid(), ts: at(5), shift: "pagi", cat: "Beli Es Batu", amount: 20000 });
      expenses.push({ id: uid(), ts: at(5), shift: "pagi", cat: "Bensin & Operasional Lapak", amount: 20000 });
    }
    if (d % 3 === 0 && (!isToday || curHour >= 14)) {
      expenses.push({ id: uid(), ts: at(14), shift: "malam", cat: "Beli Telur & Jahe", amount: 70000 });
      expenses.push({ id: uid(), ts: at(14), shift: "malam", cat: "Beli Gula / Sirup / Perasa", amount: 50000 });
    }
    if (d % 5 === 0 && !isToday) {
      expenses.push({ id: uid(), ts: at(14), shift: "malam", cat: "Beli Cup / Plastik / Sedotan", amount: 90000 });
    }
    if (d % 4 === 1) {
      waste.push({ id: uid(), ts: at(21), shift: "malam", liters: 1, cost: 9000 });
    }
  }

  // Today's stock reflects today's sales
  const stock = defaultStock();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  for (const t of transactions.filter((t) => t.ts >= today0)) {
    for (const it of t.items) applyRecipe(stock, products.find((p) => p.id === it.pid)!, it.qty);
  }

  return {
    shift: now.getHours() < 13 ? "pagi" : "malam",
    target: 100,
    products,
    stock,
    transactions,
    expenses,
    waste,
    customers: [
      { id: uid(), name: "Mas Budi", stamps: 7, rewards: 1 },
      { id: uid(), name: "Mba Rina", stamps: 4, rewards: 0 },
      { id: uid(), name: "Pak RT Joko", stamps: 9, rewards: 2 },
      { id: uid(), name: "Dek Sinta", stamps: 2, rewards: 0 },
      { id: uid(), name: "Bang Ucok", stamps: 6, rewards: 0 },
    ],
  };
}

function applyRecipe(stock: StockItem[], p: Product, qty: number) {
  const deduct = (id: string, amt: number) => {
    const s = stock.find((x) => x.id === id);
    if (s) s.qty = Math.max(0, +(s.qty - amt).toFixed(3));
  };
  if (p.milk) deduct(MILK_ID, p.milk * qty);
  for (const [id, amt] of Object.entries(p.recipe)) deduct(id, amt * qty);
}

// ---------- store ----------
let state: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as AppState) : makeDemoState();
  } catch {
    state = makeDemoState();
  }
  return state;
}
function set(next: AppState) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota */ }
  listeners.forEach((l) => l());
}
const update = (fn: (s: AppState) => AppState) => set(fn(structuredClone(load())));

export function useApp(): AppState {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    load,
    load,
  );
}

export const actions = {
  setShift: (shift: Shift) => update((s) => ({ ...s, shift })),
  setTarget: (target: number) => update((s) => ({ ...s, target })),
  checkout(cart: Record<string, number>, method: PayMethod, batch = false) {
    update((s) => {
      const items: TxItem[] = Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([pid, qty]) => {
          const p = s.products.find((x) => x.id === pid)!;
          return { pid, name: p.name, qty, price: p.price };
        });
      if (!items.length) return s;
      for (const it of items) applyRecipe(s.stock, s.products.find((p) => p.id === it.pid)!, it.qty);
      s.transactions.push({
        id: uid(), ts: Date.now(), shift: s.shift, method, items, batch,
        total: items.reduce((a, it) => a + it.qty * it.price, 0),
      });
      return s;
    });
  },
  restock(id: string, amount: number) {
    update((s) => {
      const it = s.stock.find((x) => x.id === id);
      if (it) it.qty = +(it.qty + amount).toFixed(3);
      return s;
    });
  },
  recordWaste(liters: number) {
    update((s) => {
      const milk = s.stock.find((x) => x.id === MILK_ID)!;
      const l = Math.min(liters, milk.qty);
      milk.qty = +(milk.qty - l).toFixed(3);
      s.waste.push({ id: uid(), ts: Date.now(), shift: s.shift, liters: l, cost: l * milk.cost });
      return s;
    });
  },
  addExpense(cat: string, amount: number) {
    update((s) => {
      s.expenses.push({ id: uid(), ts: Date.now(), shift: s.shift, cat, amount });
      return s;
    });
  },
  deleteExpense(id: string) {
    update((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
  },
  saveProduct(p: Product) {
    update((s) => {
      const i = s.products.findIndex((x) => x.id === p.id);
      if (i >= 0) s.products[i] = p; else s.products.push({ ...p, id: uid() });
      return s;
    });
  },
  deleteProduct(id: string) {
    update((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
  },
  addCustomer(name: string) {
    update((s) => {
      s.customers.unshift({ id: uid(), name, stamps: 0, rewards: 0 });
      return s;
    });
  },
  /** returns true if this stamp earned a free cup */
  stamp(id: string): boolean {
    let earned = false;
    update((s) => {
      const c = s.customers.find((x) => x.id === id);
      if (c) {
        c.stamps += 1;
        if (c.stamps >= STAMP_GOAL) { c.stamps = 0; c.rewards += 1; earned = true; }
      }
      return s;
    });
    return earned;
  },
  redeem(id: string) {
    update((s) => {
      const c = s.customers.find((x) => x.id === id);
      if (c && c.rewards > 0) c.rewards -= 1;
      return s;
    });
  },
  resetDemo: () => set(makeDemoState()),
};

// ---------- reporting ----------
export type Period = "hari" | "minggu" | "bulan";
export function periodStart(p: Period, now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === "minggu") d.setDate(d.getDate() - 6);
  if (p === "bulan") d.setDate(d.getDate() - 29);
  return d.getTime();
}
export const cupsOf = (t: Transaction, products: Product[]) =>
  t.items.reduce((a, it) => {
    const p = products.find((x) => x.id === it.pid);
    return a + (p && p.recipe[CUP_ID] ? it.qty : 0);
  }, 0);

export function summarize(s: AppState, from: number) {
  const tx = s.transactions.filter((t) => t.ts >= from);
  const exp = s.expenses.filter((e) => e.ts >= from);
  const ws = s.waste.filter((w) => w.ts >= from);
  const cash = tx.filter((t) => t.method === "tunai").reduce((a, t) => a + t.total, 0);
  const qris = tx.filter((t) => t.method === "qris").reduce((a, t) => a + t.total, 0);
  const expense = exp.reduce((a, e) => a + e.amount, 0);
  const wasteCost = ws.reduce((a, w) => a + w.cost, 0);
  const byShift = (sh: Shift) => {
    const list = tx.filter((t) => t.shift === sh);
    const counts = new Map<string, number>();
    list.forEach((t) => t.items.forEach((it) => counts.set(it.name, (counts.get(it.name) ?? 0) + it.qty)));
    const best = [...counts].sort((a, b) => b[1] - a[1])[0];
    return {
      revenue: list.reduce((a, t) => a + t.total, 0),
      cups: list.reduce((a, t) => a + cupsOf(t, s.products), 0),
      best: best ? best[0] : "-",
    };
  };
  return {
    cash, qris, omzet: cash + qris, expense, wasteCost,
    totalOut: expense + wasteCost,
    profit: cash + qris - expense - wasteCost,
    cups: tx.reduce((a, t) => a + cupsOf(t, s.products), 0),
    txCount: tx.length,
    pagi: byShift("pagi"),
    malam: byShift("malam"),
  };
}
