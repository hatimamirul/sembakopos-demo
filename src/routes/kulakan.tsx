import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { meta, PageTitle } from "@/components/AppShell";
import { addPurchase, formatDate, formatNum, formatRp, parseIntStrict } from "@/lib/pos";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/kulakan")({
  head: () => meta("Kulakan", "Catat pembelian dari pemasok; stok bertambah otomatis dengan konversi kemasan."),
  component: Kulakan,
});

function Kulakan() {
  const { state, setState } = useStore();
  const [pid, setPid] = useState(state.products[0]?.id ?? "");
  const p = state.products.find((x) => x.id === pid);
  const [pkgId, setPkg] = useState("");
  const pkg = p?.packages.find((x) => x.id === pkgId) ?? p?.packages[p.packages.length - 1];
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const q = parseIntStrict(qty, 1);

  const save = () => {
    const pr = parseIntStrict(price, 1);
    if (!p || !pkg) return;
    if (q === null) return setMsg({ ok: false, t: "Jumlah harus angka bulat ≥ 1." });
    if (pr === null) return setMsg({ ok: false, t: "Harga beli per kemasan harus angka bulat ≥ 1." });
    const r = addPurchase(state, p.id, pkg.id, q, pr, supplier.trim());
    if (!r.ok) return setMsg({ ok: false, t: r.error });
    if (!setState(r.state)) return;
    setMsg({ ok: true, t: `Stok ${p.name} bertambah ${formatNum(q * pkg.factor)} ${p.baseUnit}.` });
    setQty("1"); setPrice("");
  };

  return (
    <>
      <PageTitle title="Kulakan" sub="Belanja stok dari pemasok. Contoh: 1 karton minyak = 12 pouch otomatis masuk stok." />
      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="card p-4 space-y-3 h-fit">
          <div><label className="label">Barang</label>
            <select className="field" value={pid} onChange={(e) => { setPid(e.target.value); setPkg(""); }}>
              {state.products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select></div>
          <div><label className="label">Kemasan dibeli</label>
            <select className="field" value={pkg?.id ?? ""} onChange={(e) => setPkg(e.target.value)}>
              {p?.packages.map((k) => <option key={k.id} value={k.id}>{k.name} (isi {k.factor} {p.baseUnit})</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Jumlah</label><input className="field" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
            <div><label className="label">Harga beli / kemasan</label><input className="field" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Rp" /></div>
          </div>
          <div><label className="label">Pemasok (opsional)</label><input className="field" value={supplier} onChange={(e) => setSupplier(e.target.value)} /></div>
          {p && pkg && q && (
            <div className="rounded-lg bg-secondary text-secondary-foreground p-3 text-sm">
              {formatNum(q)} × {pkg.name} = <b>+{formatNum(q * pkg.factor)} {p.baseUnit}</b><br />
              Stok: {formatNum(p.stock)} → <b>{formatNum(p.stock + q * pkg.factor)} {p.baseUnit}</b>
              <div className="text-xs mt-1 opacity-80">Harga modal diperbarui dengan rata-rata tertimbang.</div>
            </div>
          )}
          {msg && <div className={`rounded-md p-2 text-sm font-semibold ${msg.ok ? "bg-secondary text-success" : "bg-destructive/10 text-destructive"}`}>{msg.t}</div>}
          <button className="btn btn-primary w-full" onClick={save}>Simpan kulakan</button>
        </div>
        <div className="card p-4 overflow-x-auto">
          <h2 className="font-bold mb-2">Riwayat kulakan</h2>
          {state.purchases.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada kulakan.</p> : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr><th>Waktu</th><th>Barang</th><th>Jumlah</th><th>Masuk stok</th><th>Harga/kemasan</th><th>Pemasok</th></tr></thead>
              <tbody>{state.purchases.map((x) => {
                const unit = state.products.find((p) => p.id === x.productId)?.baseUnit ?? "";
                return (<tr key={x.id} className="border-t"><td className="py-1.5">{formatDate(x.date)}</td><td>{x.name}</td><td>{x.qty} {x.pkgName}</td><td>+{formatNum(x.addedBase)} {unit}</td><td>{formatRp(x.costPerPkg)}</td><td>{x.supplier || "–"}</td></tr>);
              })}</tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
