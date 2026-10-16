import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { meta, PageTitle } from "@/components/AppShell";
import { checkout, formatNum, formatRp, parseIntStrict, priceCart, stockProblems, uid, unitPriceFor, type CartLine, type Product, type Tx } from "@/lib/pos";
import { printReceipt } from "@/lib/receipt";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => meta("Kasir", "Kasir demo toko sembako: keranjang, harga grosir otomatis, pembayaran tunai dan struk."),
  component: Kasir,
});

function ProductCard({ p, onAdd }: { p: Product; onAdd: (pkgId: string, qty: number) => void }) {
  const [pkgId, setPkg] = useState(p.packages[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  const pkg = p.packages.find((x) => x.id === pkgId);
  const q = parseIntStrict(qty, 1);
  return (
    <div className="card p-3 flex flex-col gap-2">
      <div className="flex justify-between gap-2">
        <div className="font-bold leading-tight">{p.name}</div>
        <span className={`text-xs whitespace-nowrap font-semibold ${p.stock <= 10 ? "text-destructive" : "text-muted-foreground"}`}>
          Stok {formatNum(p.stock)} {p.baseUnit}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {p.packages.map((k) => (
          <button key={k.id} onClick={() => setPkg(k.id)}
            className={`rounded-md border px-2 py-1 text-xs font-semibold ${k.id === pkgId ? "bg-primary text-primary-foreground border-primary" : "bg-muted"}`}>
            {k.name}
          </button>
        ))}
      </div>
      {pkg && (
        <div className="text-xs text-muted-foreground">
          Ecer <b className="text-foreground">{formatRp(pkg.retail)}</b>
          {pkg.wholesale > 0 && <> · Grosir <b className="text-primary">{formatRp(pkg.wholesale)}</b> mulai {pkg.wholesaleMin}</>}
        </div>
      )}
      <div className="flex gap-2 mt-auto">
        <input className="field !w-20 text-center" inputMode="numeric" value={qty} aria-label="Jumlah"
          onChange={(e) => setQty(e.target.value)} />
        <button className="btn btn-primary flex-1" disabled={!q || !pkg}
          onClick={() => { if (q && pkg) { onAdd(pkg.id, q); setQty("1"); } }}>
          + Tambah
        </button>
      </div>
      {qty && !q && <div className="text-xs text-destructive">Jumlah harus angka bulat ≥ 1</div>}
    </div>
  );
}

function Kasir() {
  const { state, setState } = useStore();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [discountS, setDiscount] = useState("");
  const [paidS, setPaid] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<Tx | null>(null);

  const items = useMemo(() => priceCart(state.products, cart), [state.products, cart]);
  const problems = useMemo(() => stockProblems(state.products, cart), [state.products, cart]);
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const discount = discountS === "" ? 0 : parseIntStrict(discountS);
  const paid = paidS === "" ? null : parseIntStrict(paidS);
  const total = subtotal - (discount ?? 0);
  const change = paid !== null ? paid - total : null;

  const add = (productId: string, pkgId: string, qty: number) => {
    setCart((c) => [...c, { uid: uid(), productId, pkgId, qty }]);
    setError("");
  };
  const setGroupQty = (productId: string, pkgId: string, qty: number) =>
    setCart((c) => {
      const rest = c.filter((l) => !(l.productId === productId && l.pkgId === pkgId));
      return qty > 0 ? [...rest, { uid: uid(), productId, pkgId, qty }] : rest;
    });

  const pay = () => {
    if (discount === null) return setError("Diskon harus angka bulat (Rupiah).");
    if (paid === null) return setError("Isi jumlah uang tunai dengan angka.");
    const r = checkout(state, cart, discount, paid);
    if (!r.ok) return setError(r.error);
    setState(r.state);
    setDone(r.tx);
    setCart([]); setDiscount(""); setPaid(""); setError("");
  };

  const list = state.products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const quick = [total, Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000]
    .filter((v, i, a) => v > 0 && a.indexOf(v) === i);

  return (
    <>
      <PageTitle title="Kasir" sub="Pilih barang, kemasan dan jumlah. Harga grosir otomatis dihitung dari total jumlah di keranjang." />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <section>
          <input className="field mb-3" placeholder="Cari barang…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => <ProductCard key={p.id} p={p} onAdd={(k, q) => add(p.id, k, q)} />)}
            {list.length === 0 && <p className="text-muted-foreground text-sm">Barang tidak ditemukan.</p>}
          </div>
        </section>

        <aside className="card p-4 h-fit lg:sticky lg:top-20 flex flex-col gap-3">
          <h2 className="font-bold text-lg">Keranjang</h2>
          {items.length === 0 && <p className="text-sm text-muted-foreground">Belum ada barang.</p>}
          <ul className="divide-y">
            {items.map((i) => {
              const p = state.products.find((x) => x.id === i.productId)!;
              const pkg = p.packages.find((x) => x.name === i.pkgName)!;
              const next = pkg.wholesale > 0 && !i.wholesale ? pkg.wholesaleMin - i.qty : 0;
              return (
                <li key={i.productId + pkg.id} className="py-2">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="font-semibold">{i.name} <span className="text-muted-foreground font-normal">· {i.pkgName}</span></span>
                    <span className="font-bold">{formatRp(i.subtotal)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <button className="btn btn-soft !px-2.5 !py-1" onClick={() => setGroupQty(p.id, pkg.id, i.qty - 1)}>−</button>
                    <span className="w-8 text-center font-bold">{i.qty}</span>
                    <button className="btn btn-soft !px-2.5 !py-1" onClick={() => setGroupQty(p.id, pkg.id, i.qty + 1)}>+</button>
                    <span className="text-muted-foreground">× {formatRp(i.unitPrice)}</span>
                    {i.wholesale && <span className="rounded bg-secondary text-secondary-foreground px-1.5 font-bold">GROSIR</span>}
                    <button className="ml-auto text-destructive" onClick={() => setGroupQty(p.id, pkg.id, 0)}>Hapus</button>
                  </div>
                  {next > 0 && <div className="text-[11px] text-muted-foreground mt-1">Tambah {next} lagi untuk harga grosir {formatRp(unitPriceFor(pkg, pkg.wholesaleMin).price)}</div>}
                </li>
              );
            })}
          </ul>
          {problems.map((e) => <div key={e} className="text-xs text-destructive font-semibold">{e}</div>)}
          <div className="border-t pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatRp(subtotal)}</span></div>
            <div>
              <label className="label">Diskon (Rp, opsional)</label>
              <input className="field" inputMode="numeric" value={discountS} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
              {discount === null && <div className="text-xs text-destructive">Diskon harus angka bulat.</div>}
            </div>
            <div className="flex justify-between text-xl font-extrabold"><span>Total</span><span className="text-primary">{formatRp(total)}</span></div>
            <div>
              <label className="label">Uang tunai diterima (Rp)</label>
              <input className="field text-lg font-bold" inputMode="numeric" value={paidS} onChange={(e) => setPaid(e.target.value)} placeholder="0" />
              {paidS !== "" && paid === null && <div className="text-xs text-destructive">Harus angka bulat.</div>}
              <div className="flex flex-wrap gap-1 mt-2">
                {quick.map((v) => <button key={v} className="btn btn-soft !py-1 !px-2 text-xs" onClick={() => setPaid(String(v))}>{v === total ? "Uang pas" : formatRp(v)}</button>)}
              </div>
            </div>
            <div className="flex justify-between font-bold">
              <span>Kembalian</span>
              <span className={change !== null && change < 0 ? "text-destructive" : "text-success"}>
                {change === null ? "–" : change < 0 ? `Kurang ${formatRp(-change)}` : formatRp(change)}
              </span>
            </div>
          </div>
          {error && <div className="rounded-md bg-destructive/10 text-destructive text-sm p-2 font-semibold">{error}</div>}
          <button className="btn btn-primary !py-3 text-base" disabled={items.length === 0} onClick={pay}>Bayar Tunai</button>
          {items.length > 0 && <button className="text-xs text-muted-foreground underline" onClick={() => setCart([])}>Kosongkan keranjang</button>}
        </aside>
      </div>

      {done && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div className="card p-5 w-full max-w-sm text-center space-y-2">
            <div className="text-4xl">✅</div>
            <h3 className="text-lg font-bold">Transaksi berhasil</h3>
            <p className="text-sm text-muted-foreground">{done.id}</p>
            <div className="text-sm">Total <b>{formatRp(done.total)}</b> · Tunai {formatRp(done.paid)}</div>
            <div className="text-2xl font-extrabold text-success">Kembali {formatRp(done.change)}</div>
            <div className="flex gap-2 pt-2">
              <button className="btn btn-soft flex-1" onClick={() => printReceipt(done)}>Cetak Struk</button>
              <button className="btn btn-primary flex-1" onClick={() => setDone(null)}>Transaksi Baru</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
