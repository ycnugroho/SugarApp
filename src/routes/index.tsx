import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Boxes, Milk, Settings as SettingsIcon, ShoppingCart, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { sugar, useSugar, useWords } from "@/lib/sugarapp-store";
import { Pos } from "@/components/sugarapp/Pos";
import { Inventory } from "@/components/sugarapp/Inventory";
import { Expenses } from "@/components/sugarapp/Expenses";
import { Reports } from "@/components/sugarapp/Reports";
import { Settings } from "@/components/sugarapp/Settings";
import logoAsset from "@/assets/sugarapp-fixed-cow-logo.jpg.asset.json";
const logo = logoAsset.url;
import { startSync } from "@/lib/sugarapp-sync";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SugarApp — Kasir Susu Segar, STMJ & Keuangan" },
      { name: "description", content: "Kasir susu segar dan STMJ dengan harga per ukuran, pengelolaan inventaris, pengeluaran, dan laporan laba bersih dalam satu alur." },
      { property: "og:title", content: "SugarApp — Smart POS, Inventory & Accounting" },
      { property: "og:description", content: "Catat pesanan susu, kelola stok dan HPP, serta pantau keuangan usaha setiap hari." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TABS = [
  { id: "kasir", label: "Kasir", en: "Cashier", icon: ShoppingCart, C: Pos },
  { id: "stok", label: "Stok & Kelola", en: "Stock & Menu", icon: Boxes, C: Inventory },
  { id: "kas", label: "Pengeluaran", en: "Expenses", icon: Wallet, C: Expenses },
  { id: "laporan", label: "Laporan", en: "Reports", icon: BarChart3, C: Reports },
  { id: "settings", label: "Pengaturan", en: "Settings", icon: SettingsIcon, C: Settings },
] as const;

function Index() {
  return (
    <div className="app-shell mx-auto min-h-screen w-full max-w-[480px] bg-background">
      <ClientOnly fallback={<div className="flex h-screen items-center justify-center gap-2 text-2xl font-bold text-primary"><img src={logo} alt="" width={40} height={40} />SugarApp</div>}>
        <App />
      </ClientOnly>
      <Toaster position="top-center" richColors />
    </div>
  );
}

function App() {
  const { theme, language, sales } = useSugar(); const t = useWords();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("kasir");
  const Active = TABS.find((t) => t.id === tab)?.C ?? Pos;
  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); document.documentElement.lang = language; }, [theme, language]);
  useEffect(() => startSync(sugar), []);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const revenue = sales.filter((x) => x.ts >= today.getTime()).reduce((a, x) => a + x.total, 0);
  return (
    <>
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between gap-2 border-b bg-card/95 px-5 backdrop-blur">
        <div className="flex items-center gap-2.5"><span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card ring-1 ring-border"><img src={logo} alt="SugarApp" width={48} height={48} className="h-12 w-12 object-contain" /></span><div><p className="text-xl font-bold">Sugar<span className="text-primary">App</span></p><p className="mt-0.5 text-[10px] text-muted-foreground">FRESH MILK & STMJ</p></div></div>
        <div className="text-right"><p className="text-[10px] text-muted-foreground">{t("OMZET HARI INI", "TODAY'S REVENUE")}</p><p className="mt-1 text-sm font-bold">Rp {revenue.toLocaleString("id-ID")}</p></div>
      </header>
      <main className="px-5 pb-24 pt-5">
        <div className={tab === "kasir" ? "page-enter" : "hidden"}><Pos /></div>
        {tab !== "kasir" && <div key={tab} className="page-enter"><Active /></div>}
      </main>
      <nav aria-label={t("Navigasi utama", "Main navigation")} className="bottom-nav fixed bottom-0 left-1/2 z-40 grid w-full max-w-[480px] -translate-x-1/2 grid-cols-5 border-t bg-card">
        {TABS.map((t) => (
          <Button variant="ghost" aria-current={tab === t.id ? "page" : undefined} key={t.id} onClick={() => { setTab(t.id); window.scrollTo(0, 0); }}
            className={`h-full flex-col gap-1.5 whitespace-normal rounded-none px-0.5 text-[10px] font-medium ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}>
            <t.icon className="!h-5 !w-5" strokeWidth={tab === t.id ? 2.5 : 1.8} />
            {language === "id" ? t.label : t.en}
          </Button>
        ))}
      </nav>
    </>
  );
}
