import { useRef, useState } from "react";
import { ImagePlus, Languages, Moon, QrCode, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { sugar, useSugar, useWords } from "@/lib/sugarapp-store";
import { Field, Modal, Segments, inputClass, safely } from "./shared";
import { flushSync, fullSyncEvents, validWebhook } from "@/lib/sugarapp-sync";
import { toast } from "sonner";

export function Settings() {
  const s = useSugar(); const t = useWords(); const file = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(s.webhookUrl ?? "");
  const [show, setShow] = useState(false);
  const upload = async (image?: File) => {
    if (!image) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) { toast.error(t("Gunakan JPG, PNG, atau WebP", "Use JPG, PNG, or WebP")); return; }
    try {
      const bitmap = await createImageBitmap(image); const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas"); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Unable to load image");
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      const data = canvas.toDataURL("image/jpeg", 0.9);
      safely(() => sugar.update((prev) => ({ ...prev, qris: data })), t("Gambar QRIS tersimpan", "QRIS image saved"));
    } catch { toast.error(t("Gambar tidak dapat dibuka", "Unable to open image")); }
  };
  return <div className="space-y-6 pb-8"><div><p className="section-eyebrow">PREFERENCES</p><h1 className="mt-1 text-2xl font-bold">{t("Pengaturan", "Settings")}</h1></div>
    <section className="space-y-4 border-b pb-6"><h2 className="flex items-center gap-2 text-sm font-semibold"><QrCode className="h-5 w-5 text-primary" />{t("QRIS Toko", "Store QRIS")}</h2>{s.qris ? <div className="flex items-center gap-4"><img src={s.qris} width={88} height={88} alt="QRIS" className="h-22 w-22 rounded-lg border bg-card object-contain" /><div><p className="text-sm font-semibold">{t("QRIS tersimpan", "QRIS saved")}</p><Button variant="link" className="mt-1 h-auto px-0" onClick={() => file.current?.click()}><ImagePlus />{t("Ganti gambar", "Replace image")}</Button></div></div> : <Button variant="outline" className="h-28 w-full flex-col gap-3 border-dashed text-muted-foreground" onClick={() => file.current?.click()}><Upload className="!h-6 !w-6" />{t("Upload gambar QRIS", "Upload QRIS image")}</Button>}<input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} /><Button className="h-12 w-full" disabled={!s.qris} onClick={() => setShow(true)}><QrCode />{t("Tampilkan QRIS", "Show QRIS")}</Button></section>
    <section className="space-y-5 border-b pb-6"><h2 className="text-sm font-semibold">{t("Preferensi Aplikasi", "App preferences")}</h2><div className="flex items-center gap-3"><Moon className="h-5 w-5 text-muted-foreground" /><label htmlFor="dark-mode" className="flex-1 text-sm">{t("Mode Gelap", "Dark mode")}</label><Switch id="dark-mode" checked={s.theme === "dark"} onCheckedChange={(checked) => safely(() => sugar.update((prev) => ({ ...prev, theme: checked ? "dark" : "light" })))} /></div><div className="flex items-center gap-3"><Languages className="h-5 w-5 text-muted-foreground" /><span className="text-sm">{t("Bahasa", "Language")}</span></div><Segments value={s.language} change={(language) => safely(() => sugar.update((prev) => ({ ...prev, language })))} options={[{ value: "id", label: "Indonesia" }, { value: "en", label: "English" }]} /></section>
    <section className="space-y-4 border-b pb-6"><h2 className="text-sm font-semibold">Integrasi Google Sheets (SPS)</h2><Field label="Google Sheets Webhook URL"><input type="url" className={inputClass} value={url} placeholder="https://script.google.com/macros/s/…/exec" onChange={e => setUrl(e.target.value)} /></Field><Button variant="outline" className="w-full" disabled={!!url.trim() && !validWebhook(url.trim())} onClick={() => safely(() => sugar.update(prev => ({ ...prev, webhookUrl: url.trim() })), t("URL tersimpan", "URL saved"))}>{t("Simpan URL", "Save URL")}</Button><p role="status" className="text-sm text-muted-foreground">{(s.syncQueue?.length ?? 0) > 0 ? `${s.syncQueue?.length} ${t("data menunggu pengiriman", "records waiting to send")}` : s.lastDispatch ? t("Antrean terkirim otomatis", "Queue dispatched automatically") : t("Belum ada pengiriman", "No dispatch yet")}{s.syncStatus === "sending" ? t(" · Mengirim…", " · Sending…") : s.syncStatus === "failed" ? t(" · Gagal, akan dicoba kembali", " · Failed, will retry") : ""}</p><p className="text-xs text-muted-foreground">{!s.webhookUrl ? t("URL belum tersimpan", "URL not saved") : t("Penerimaan di Google Sheets belum dapat dikonfirmasi (no-cors).", "Receipt in Google Sheets cannot be confirmed (no-cors).")}</p><Button variant="outline" className="h-10" onClick={async () => {
      if (!validWebhook((sugar.get().webhookUrl ?? "").trim())) { toast.error(t("Simpan URL Google Sheets yang valid terlebih dahulu", "Save a valid Google Sheets URL first")); return; }
      if (!safely(() => sugar.update(prev => ({ ...prev, syncQueue: [...(prev.syncQueue ?? []), ...fullSyncEvents(prev)] })))) return;
      await flushSync(sugar).catch(() => toast.error(t("Pengiriman gagal", "Dispatch failed")));
      const current = sugar.get();
      if (!current.syncQueue?.length && current.syncStatus !== "failed") toast.success(t("Sinkronisasi berhasil dikirim ke Google Sheets!", "Sync successfully sent to Google Sheets!"));
      else toast.info(t("Data tersimpan dalam antrean dan akan dicoba kembali", "Data queued and will be retried"));
    }}>Test / Sync Sekarang</Button></section><p className="text-center text-xs text-muted-foreground">SugarApp · Smart POS, Inventory & Accounting</p>
    <Modal open={show} close={() => setShow(false)} title="QRIS" full><img src={s.qris} alt={t("Kode QRIS toko", "Store QRIS code")} className="min-h-0 h-full max-h-[80dvh] w-full object-contain" /></Modal>
  </div>;
}