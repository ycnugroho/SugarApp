import * as React from "react";
import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Modal({ open, close, title, children, full = false }: { open: boolean; close: () => void; title: string; children: ReactNode; full?: boolean }) {
  return <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}><DialogContent className={full ? "qris-modal" : "sugar-modal"}><DialogTitle className="pr-6 text-xl font-bold">{title}</DialogTitle><DialogDescription className="sr-only">{title}</DialogDescription>{children}</DialogContent></Dialog>;
}
export function Segments<T extends string>({ options, value, change }: { options: { value: T; label: ReactNode }[]; value: T; change: (v: T) => void }) {
  return <div className="flex gap-1 rounded-lg bg-muted p-1">{options.map((o) => <Button key={o.value} variant="ghost" aria-pressed={value === o.value} onClick={() => change(o.value)} className={`h-11 min-w-0 flex-1 whitespace-normal px-2 text-xs font-semibold ${value === o.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{o.label}</Button>)}</div>;
}
export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="grid min-w-0 gap-2 text-sm font-medium">{label}{children}</label>; }
export const inputClass = "h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring";
export function safely(fn: () => void, message?: string) { try { fn(); if (message) toast.success(message); return true; } catch (error) { toast.error(error instanceof Error ? error.message : "Penyimpanan gagal / Unable to save"); return false; } }
/** Numeric input that keeps "" when cleared and strips leading zeros (09000 -> 9000). */
export function NumberInput({ value, onValue, ...rest }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & { value: number | string; onValue: (v: number) => void }) {
  const [text, setText] = React.useState(() => (value === "" || value === 0 ? "" : String(value)));
  React.useEffect(() => { if (Number(text || 0) !== Number(value || 0)) setText(value === 0 || value === "" ? "" : String(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <input {...rest} type="text" inputMode={rest.inputMode ?? "decimal"} value={text} onChange={(e) => { const raw = e.target.value.replace(",", ".").replace(/[^\d.]/g, ""); const clean = cleanNumber(raw); setText(clean); onValue(clean === "" ? 0 : Number(clean)); }} />;
}
export const cleanNumber = (raw: string) => raw === "" ? "" : raw.replace(/^0+(?=\d)/, "");

const TONES: [RegExp, string][] = [[/chocolatos|cokelat/i, "chocolate"], [/milo|moka|cappucino|kopi/i, "coffee"], [/stroberi/i, "strawberry"], [/melon|apel/i, "melon"], [/matcha|green tea/i, "matcha"], [/anggur/i, "grape"], [/taro/i, "taro"], [/durian|banana|mangga/i, "golden"], [/vanila|karamel|butterscotch/i, "caramel"], [/leci/i, "coral"], [/bluberry|bubble gum/i, "berry"]];
export const flavorTone = (name: string) => `flavor-${TONES.find(([r]) => r.test(name))?.[1] ?? "dairy"}`;
