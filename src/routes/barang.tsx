import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { meta, PageTitle } from "@/components/AppShell";
import { formatNum, formatRp, parseIntStrict, uid, type Product } from "@/lib/pos";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/barang")({
  head: () => meta("Master Barang", "Kelola barang, kemasan ecer/grosir, harga modal, harga jual dan stok."),
  component: Barang,
});

type PkgForm = { id: string; name: string; factor: string; retail: string; wholesale: string; wholesaleMin: string };
type Form = { id: string | null; name: string; baseUnit: string; cost: string; stock: string; packages: PkgForm[] };
const emptyPkg = (): PkgForm => ({ id: uid(), name: "", factor: "1", retail: "", wholesale: "0", wholesaleMin: "0" });
const empty = (): Form => ({ id: null, name: "", baseUnit: "pcs", cost: "", stock: "0", packages: [emptyPkg()] });

function Barang() {
  const { state, setState } = useStore();
  const [f, setF] = useState<Form>(empty);
  const [err, setErr] = useState("");

  const edit = (p: Product) => {
    setF({ id: p.id, name: p.name, baseUnit: p.baseUnit, cost: String(p.cost), stock: String(p.stock),
      packages: p.packages.map((k) => ({ id: k.id, name: k.name, factor: String(k.factor), retail: String(k.retail), wholesale: String(k.wholesale), wholesaleMin: String(k.wholesaleMin) })) });
    setErr("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const setPkg = (i: number, key: keyof PkgForm, v: string) =>
    setF({ ...f, packages: f.packages.map((k, j) => (j === i ? { ...k, [key]: v } : k)) });

  const save = () => {
    const cost = parseIntStrict(f.cost, 0), stock = parseIntStrict(f.stock, 0);
    if (!f.name.trim() || !f.baseUnit.trim()) return setErr("Nama barang dan satuan dasar wajib diisi.");
    if (cost === null) return setErr("Harga modal harus angka bulat ≥ 0.");
    if (stock === null) return setErr("Stok harus angka bulat ≥ 0.");
    if (f.packages.length === 0) return setErr("Minimal satu kemasan.");
    const packages = [];
    for (const k of f.packages) {
      const factor = parseIntStrict(k.factor, 1), retail = parseIntStrict(k.retail, 1), ws = parseIntStrict(k.wholesale, 0), min = parseIntStrict(k.wholesaleMin, 0);
      if (!k.name.trim()) return setErr("Nama kemasan wajib diisi.");
      if (factor === null || retail === null || ws === null || min === null) return setErr(`Angka kemasan "${k.name}" tidak valid (isi ≥1, harga ecer ≥1).`);
      if (ws > 0 && min < 2) return setErr(`Ambang grosir "${k.name}" minimal 2 jika ada harga grosir.`);
      if (ws > retail) return setErr(`Harga grosir "${k.name}" tidak boleh lebih mahal dari ecer.`);
      packages.push({ id: k.id, name: k.name.trim(), factor, retail, wholesale: ws, wholesaleMin: ws > 0 ? min : 0 });
    }
    const p: Product = { id: f.id ?? uid(), name: f.name.trim(), baseUnit: f.baseUnit.trim(), cost, stock, packages };
    setState({ ...state, products: f.id ? state.products.map((x) => (x.id === f.id ? p : x)) : [...state.products, p] });
    setF(empty()); setErr("");
  };

  return (
    <>
      <PageTitle title="Master Barang" sub="Stok selalu dicatat dalam satuan dasar. Kemasan (karton, karung, dus) memakai faktor konversi." />
      <div className="card p-4 mb-5">
        <h2 className="font-bold mb-3">{f.id ? "Ubah barang" : "Tambah barang baru"}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div><label className="label">Nama barang</label><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><label className="label">Satuan dasar</label><input className="field" value={f.baseUnit} onChange={(e) => setF({ ...f, baseUnit: e.target.value })} placeholder="pouch / kg / sachet" /></div>
          <div><label className="label">Harga modal / satuan dasar (Rp)</label><input className="field" inputMode="numeric" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} /></div>
          <div><label className="label">Stok (satuan dasar){f.id && " — ubah via Stok Opname disarankan"}</label><input className="field" inputMode="numeric" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /></div>
        </div>
        <h3 className="font-semibold mt-4 mb-2 text-sm">Kemasan / varian jual</h3>
        <div className="space-y-2">
          {f.packages.map((k, i) => (
            <div key={k.id} className="grid gap-2 grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-end rounded-lg bg-muted p-2">
              <div><label className="label">Nama kemasan</label><input className="field" value={k.name} onChange={(e) => setPkg(i, "name", e.target.value)} /></div>
              <div><label className="label">Isi ({f.baseUnit || "satuan"})</label><input className="field" inputMode="numeric" value={k.factor} onChange={(e) => setPkg(i, "factor", e.target.value)} /></div>
              <div><label className="label">Harga ecer</label><input className="field" inputMode="numeric" value={k.retail} onChange={(e) => setPkg(i, "retail", e.target.value)} /></div>
              <div><label className="label">Harga grosir</label><input className="field" inputMode="numeric" value={k.wholesale} onChange={(e) => setPkg(i, "wholesale", e.target.value)} /></div>
              <div><label className="label">Grosir mulai</label><input className="field" inputMode="numeric" value={k.wholesaleMin} onChange={(e) => setPkg(i, "wholesaleMin", e.target.value)} /></div>
              <button className="btn btn-danger" onClick={() => setF({ ...f, packages: f.packages.filter((_, j) => j !== i) })}>Hapus</button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Isi harga grosir 0 jika tidak ada harga grosir.</p>
        {err && <div className="mt-3 rounded-md bg-destructive/10 text-destructive text-sm p-2 font-semibold">{err}</div>}
        <div className="flex flex-wrap gap-2 mt-3">
          <button className="btn btn-soft" onClick={() => setF({ ...f, packages: [...f.packages, emptyPkg()] })}>+ Kemasan</button>
          <button className="btn btn-primary" onClick={save}>{f.id ? "Simpan perubahan" : "Simpan barang"}</button>
          {f.id && <button className="btn btn-soft" onClick={() => setF(empty())}>Batal</button>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {state.products.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-bold">{p.name}</div>
                <div className="text-xs text-muted-foreground">Modal {formatRp(p.cost)} / {p.baseUnit}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold">{formatNum(p.stock)} <span className="text-sm font-medium">{p.baseUnit}</span></div>
                <button className="text-xs text-primary underline" onClick={() => edit(p)}>Ubah</button>
              </div>
            </div>
            <table className="w-full text-sm mt-3">
              <thead className="text-xs text-muted-foreground text-left"><tr><th>Kemasan</th><th>Isi</th><th>Ecer</th><th>Grosir</th></tr></thead>
              <tbody>
                {p.packages.map((k) => (
                  <tr key={k.id} className="border-t">
                    <td className="py-1">{k.name}</td><td>{k.factor} {p.baseUnit}</td><td>{formatRp(k.retail)}</td>
                    <td>{k.wholesale ? `${formatRp(k.wholesale)} (≥${k.wholesaleMin})` : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  );
}
