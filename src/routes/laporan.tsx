import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { meta, PageTitle } from "@/components/AppShell";
import { formatDate, formatNum, formatRp, type Tx } from "@/lib/pos";
import { printReceipt } from "@/lib/receipt";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/laporan")({
  head: () => meta("Laporan", "Ringkasan omzet, harga pokok dan laba kotor serta riwayat transaksi."),
  component: Laporan,
});

const sum = (txs: Tx[]) => {
  const omzet = txs.reduce((s, t) => s + t.total, 0);
  const hpp = txs.reduce((s, t) => s + t.items.reduce((a, i) => a + i.cost, 0), 0);
  return { omzet, hpp, laba: omzet - hpp, n: txs.length };
};

function Laporan() {
  const { state } = useStore();
  const [range, setRange] = useState<"hari" | "semua">("hari");
  const today = new Date().toDateString();
  const txs = range === "hari" ? state.txs.filter((t) => new Date(t.date).toDateString() === today) : state.txs;
  const s = sum(txs);
  const low = state.products.filter((p) => p.stock <= 10);

  const stats = [
    { l: "Omzet", v: formatRp(s.omzet), c: "text-primary" },
    { l: "Harga pokok (modal)", v: formatRp(s.hpp), c: "" },
    { l: "Laba kotor", v: formatRp(s.laba), c: s.laba >= 0 ? "text-success" : "text-destructive" },
    { l: "Jumlah transaksi", v: formatNum(s.n), c: "" },
  ];

  return (
    <>
      <PageTitle title="Laporan" sub="Laba kotor = omzet (setelah diskon) − harga modal barang terjual." />
      <div className="flex gap-2 mb-4">
        {(["hari", "semua"] as const).map((r) => (
          <button key={r} className={`btn ${range === r ? "btn-primary" : "btn-soft"}`} onClick={() => setRange(r)}>{r === "hari" ? "Hari ini" : "Semua waktu"}</button>
        ))}
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-5">
        {stats.map((x) => (
          <div key={x.l} className="card p-4"><div className="text-xs text-muted-foreground font-semibold">{x.l}</div><div className={`text-xl sm:text-2xl font-extrabold mt-1 ${x.c}`}>{x.v}</div></div>
        ))}
      </div>
      {low.length > 0 && (
        <div className="card p-4 mb-5 border-accent">
          <div className="font-bold mb-1">⚠️ Stok menipis</div>
          <div className="text-sm text-muted-foreground">{low.map((p) => `${p.name}: ${formatNum(p.stock)} ${p.baseUnit}`).join(" · ")}</div>
        </div>
      )}
      <div className="card p-4 overflow-x-auto">
        <h2 className="font-bold mb-2">Riwayat transaksi</h2>
        {txs.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada transaksi pada periode ini.</p> : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr><th>Waktu</th><th>No.</th><th>Barang</th><th>Total</th><th>Laba kotor</th><th></th></tr></thead>
            <tbody>{txs.map((t) => (
              <tr key={t.id} className="border-t align-top">
                <td className="py-2 whitespace-nowrap">{formatDate(t.date)}</td>
                <td className="text-xs">{t.id}</td>
                <td>{t.items.map((i) => `${i.qty} ${i.pkgName} ${i.name}`).join(", ")}</td>
                <td className="font-semibold whitespace-nowrap">{formatRp(t.total)}</td>
                <td className="whitespace-nowrap">{formatRp(t.total - t.items.reduce((a, i) => a + i.cost, 0))}</td>
                <td><button className="text-primary underline text-xs" onClick={() => printReceipt(t)}>Struk</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}
