import { X } from "lucide-react";
import type { ReactNode } from "react";

export function BottomSheet({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-card p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button aria-label="Tutup" onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <X className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const QUICK = [10000, 20000, 50000, 100000];

/** Nominal entry with quick-add chips & keypad, no system keyboard */
export function Numpad({ value, onChange, quick = QUICK, step = "rb" }: {
  value: number; onChange: (n: number) => void; quick?: number[]; step?: "rb" | "raw";
}) {
  const press = (k: string) => {
    if (k === "C") return onChange(0);
    if (k === "⌫") return onChange(Math.floor(value / 10));
    onChange(Number(String(value) + k));
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {quick.map((q) => (
          <button key={q} onClick={() => onChange(value + q)}
            className="h-14 rounded-2xl bg-secondary text-base font-bold text-secondary-foreground active:scale-95">
            +{step === "rb" ? `${q / 1000}rb` : q}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((k) => (
          <button key={k} onClick={() => press(k)}
            className="h-14 rounded-2xl bg-muted text-xl font-bold active:scale-95 active:bg-border">
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
