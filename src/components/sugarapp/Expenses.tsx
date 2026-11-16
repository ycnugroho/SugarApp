import { useState } from "react";
import { Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { id, rp, sugar, useSugar, useWords, type Expense } from "@/lib/sugarapp-store";
import { Field, Modal, NumberInput, cleanNumber, inputClass, safely } from "./shared";
import { ExpenseDetails, operationalCategories } from "./ExpenseDetails";

export function Expenses() {
  const s = useSugar();
  const t = useWords();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [selection, setSelection] = useState(s.inventory[0] ? `stock:${s.inventory[0].id}` : "ops:Lain-lain");
  const [note, setNote] = useState("");
  const [remove, setRemove] = useState<string | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [stockQty, setStockQty] = useState(0);
  const isStock = selection.startsWith("stock:");
  const stock = isStock ? s.inventory.find((item) => item.id === selection.slice(6)) : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const openEditor = (expense?: Expense) => {
    setEditing(expense ?? null);
    setAmount(expense ? String(expense.amount) : "");
    setNote(expense?.note ?? "");
    setSelection(expense?.restock ? `stock:${expense.restock.id}` : expense ? `ops:${expense.category}` : s.inventory[0] ? `stock:${s.inventory[0].id}` : "ops:Lain-lain");
    if (expense?.restock) {
      const item = s.inventory.find((inventoryItem) => inventoryItem.id === expense.restock?.id);
      const factor = (unit: string) => /^(liter|kg)$/i.test(unit) ? 1000 : 1;
      setStockQty(expense.restock.qty * factor(expense.restock.unit) / factor(item?.unit ?? expense.restock.unit));
    } else setStockQty(0);
    setOpen(true);
  };
  const legacyCategory = editing && !editing.restock && !operationalCategories.some(([name]) => name === editing.category) ? editing.category : null;

  return <div className="space-y-5">
    <div><p className="section-eyebrow">CASH & EXPENSES</p><h1 className="mt-1 text-2xl font-bold">{t("Pengeluaran", "Expenses")}</h1></div>
    <div className="border-y py-5"><p className="text-sm text-muted-foreground">{t("Pengeluaran hari ini", "Today's expenses")}</p><p className="mt-2 text-3xl font-bold">{rp(s.expenses.filter((expense) => expense.ts >= today.getTime()).reduce((total, expense) => total + expense.amount, 0))}</p></div>
    <Button className="h-12 w-full" onClick={() => openEditor()}><Plus />{t("Catat Pengeluaran", "Record expense")}</Button>
    <h2 className="text-sm font-semibold">{t("Riwayat pengeluaran", "Expense history")}</h2>
    <div className="divide-y">{[...s.expenses].reverse().map((expense) => <div key={expense.id} className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 py-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-soft text-warning"><Receipt className="h-5 w-5" /></span>
      <ExpenseDetails expense={expense} language={s.language} />
      <div className="col-start-2 flex flex-wrap items-center gap-1"><strong className="mr-auto text-sm">{rp(expense.amount)}</strong>
      <Button variant="ghost" size="icon" title={t("Edit pengeluaran", "Edit expense")} aria-label={t("Edit pengeluaran", "Edit expense")} onClick={() => openEditor(expense)}><Pencil /></Button>
      <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={t("Hapus pengeluaran", "Delete expense")} onClick={() => setRemove(expense.id)}><Trash2 /></Button></div>
    </div>)}</div>
    {!s.expenses.length && <p className="py-10 text-center text-sm text-muted-foreground">{t("Belum ada pengeluaran", "No expenses recorded")}</p>}

    <Modal open={open} close={() => setOpen(false)} title={editing ? t("Edit Pengeluaran", "Edit expense") : t("Catat Pengeluaran", "Record expense")}>
      <Field label={t("Nominal (Rp)", "Amount (Rp)")}><input className={inputClass} inputMode="numeric" placeholder="0" value={amount} onChange={(event) => setAmount(cleanNumber(event.target.value.replace(/\D/g, "")))} /></Field>
      <Field label={t("Kategori / Nama Barang", "Category / Item name")}>
        <select className={inputClass} value={selection} onChange={(event) => setSelection(event.target.value)}>
          <optgroup label={t("Stok Bahan Baku", "Raw material stock")}>{s.inventory.map((item) => <option key={item.id} value={`stock:${item.id}`}>{item.name} ({item.unit})</option>)}</optgroup>
          <optgroup label={t("Operasional Non-Stok", "Non-stock operations")}>
            {operationalCategories.map(([indonesian, english]) => <option key={indonesian} value={`ops:${indonesian}`}>{t(indonesian, english)}</option>)}
            {legacyCategory && <option value={`ops:${legacyCategory}`}>{legacyCategory}</option>}
          </optgroup>
        </select>
      </Field>
      {isStock && <div className="space-y-2"><Field label={`${t("Jumlah Stok Masuk", "Incoming stock quantity")} (${stock?.unit ?? ""})`}><NumberInput aria-describedby="incoming-stock-info" className={inputClass} value={stockQty} onValue={setStockQty} /></Field><p id="incoming-stock-info" className="text-xs text-muted-foreground">{t("Stok di Inventaris akan otomatis bertambah sesuai jumlah ini", "Inventory stock will automatically increase by this quantity")}</p></div>}
      <Field label={t("Catatan", "Note")}><input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} /></Field>
      <Button className="h-12" disabled={!(Number(amount) > 0) || (isStock && (!stock || !(stockQty > 0)))} onClick={() => {
        if (safely(() => {
          if (isStock && !stock) throw new Error("Barang inventaris tidak ditemukan / Inventory item missing");
          sugar.expense({
            id: editing?.id ?? id(),
            ts: editing?.ts ?? Date.now(),
            category: stock?.name ?? selection.replace(/^ops:/, ""),
            note,
            amount: Number(amount),
            ...(stock ? { restock: { id: stock.id, qty: stockQty, unit: stock.unit, previousUnitCost: 0, unitCost: 0 } } : {}),
          });
        }, t("Pengeluaran tersimpan", "Expense saved"))) setOpen(false);
      }}>{t("Simpan Pengeluaran", "Save expense")}</Button>
    </Modal>
    <Modal open={!!remove} close={() => setRemove(null)} title={t("Hapus pengeluaran?", "Delete expense?")}>
      <Button variant="destructive" className="h-12" onClick={() => { if (safely(() => remove ? sugar.removeExpense(remove) : undefined)) setRemove(null); }}><Trash2 />{t("Hapus", "Delete")}</Button>
    </Modal>
  </div>;
}
