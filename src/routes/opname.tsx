import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { meta, PageTitle } from "@/components/AppShell";
import { addOpname, formatDate, formatNum, parseIntStrict } from "@/lib/pos";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/opname")({
  head: () => meta("Stok Opname", "Hitung stok fisik, koreksi selisih, dan lihat riwayat opname."),
  component: Opname,
});

function Opname() {
  const { state, setState } = useStore();
  const [pid, setPid] = useState(state.products[0]?.id ?? "");
  const [count, setCount] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const p = state.products.find((x) => x.id === pid);
  const n = count === "" ? null : parseIntStrict(count, 0);

  const save = () => {
    if (!p) return;
    if (n === null) return setMsg({ ok: false, t: "Stok fisik harus angka bulat ≥ 0." });
    setState(addOpname(state, p.id, n, note.trim()));
    setMsg({ ok: true, t: `Stok ${p.name} dikoreksi menjadi ${formatNum(n)} ${p.baseUnit}.` });
    setCount(""); setNote("");
  };

  return (
    <>
      <PageTitle title="Stok Opname" sub="Cocokkan stok di aplikasi dengan hitungan fisik di rak/gudang (dalam satuan dasar)." />
      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="card p-4 space-y-3 h-fit">
          <div><label className="label">Barang</label>
            <select className="field" value={pid} onChange={(e) => setPid(e.target.value)}>
              {state.products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select></div>
          {p && <div className="text-sm">Stok tercatat: <b>{formatNum(p.stock)} {p.baseUnit}</b></div>}
          <div><label className="label">Stok fisik ({p?.baseUnit})</label><input className="field" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} /></div>
          {p && n !== null && (
            <div className={`text-sm font-semibold ${n - p.stock < 0 ? "text-destructive" : "text-success"}`}>
              Selisih: {n - p.stock > 0 ? "+" : ""}{formatNum(n - p.stock)} {p.baseUnit}
            </div>
          )}
          <div><label className="label">Catatan (mis. rusak, hilang, salah hitung)</label><input className="field" value={note} onChange={(e) => setNote(e.target.value)} /></div>
          {msg && <div className={`rounded-md p-2 text-sm font-semibold ${msg.ok ? "bg-secondary text-success" : "bg-destructive/10 text-destructive"}`}>{msg.t}</div>}
          <button className="btn btn-primary w-full" onClick={save}>Simpan koreksi stok</button>
        </div>
        <div className="card p-4 overflow-x-auto">
          <h2 className="font-bold mb-2">Riwayat stok opname</h2>
          {state.opnames.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada opname.</p> : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr><th>Waktu</th><th>Barang</th><th>Sebelum</th><th>Sesudah</th><th>Selisih</th><th>Catatan</th></tr></thead>
              <tbody>{state.opnames.map((x) => (
                <tr key={x.id} className="border-t"><td className="py-1.5">{formatDate(x.date)}</td><td>{x.name}</td><td>{formatNum(x.before)}</td><td>{formatNum(x.after)}</td>
                  <td className={x.diff < 0 ? "text-destructive font-semibold" : "text-success font-semibold"}>{x.diff > 0 ? "+" : ""}{formatNum(x.diff)}</td><td>{x.note || "–"}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
