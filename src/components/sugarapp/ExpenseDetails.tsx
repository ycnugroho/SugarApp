import { useWords, type Expense, type Language } from "@/lib/sugarapp-store";

export const operationalCategories: [string, string][] = [
  ["Listrik & Air", "Electricity & water"],
  ["Gas / LPG", "Gas / LPG"],
  ["Transportasi & Bensin", "Transport & fuel"],
  ["Gaji / Operasional", "Wages / operations"],
  ["Sewa", "Rent"],
  ["Lain-lain", "Other"],
];

export function expenseCategory(expense: Expense, language: Language) {
  return operationalCategories.find(([name]) => name === expense.category)?.[language === "id" ? 0 : 1] ?? expense.category;
}

export function ExpenseDetails({ expense, language }: { expense: Expense; language: Language }) {
  const t = useWords();
  return <div className="min-w-0 space-y-1 [overflow-wrap:anywhere]">
    <p className="text-sm font-semibold">{expenseCategory(expense, language)}</p>
    <p className="text-xs text-muted-foreground">{new Date(expense.ts).toLocaleString(language === "id" ? "id-ID" : "en-US")}</p>
    {expense.restock && <p className="text-xs text-muted-foreground">{t("Stok masuk", "Incoming stock")}: +{expense.restock.qty.toLocaleString(language === "id" ? "id-ID" : "en-US")} {expense.restock.unit}</p>}
    {expense.note.trim() && <p className="whitespace-pre-wrap text-xs text-muted-foreground">{expense.note}</p>}
  </div>;
}