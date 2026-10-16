import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";

const NAV = [
  { to: "/", label: "Kasir", icon: "🧾" },
  { to: "/barang", label: "Barang", icon: "📦" },
  { to: "/kulakan", label: "Kulakan", icon: "🚚" },
  { to: "/opname", label: "Stok Opname", icon: "📋" },
  { to: "/laporan", label: "Laporan", icon: "📈" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { reset } = useStore();
  const [info, setInfo] = useState(false);
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex md:w-56 lg:w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground p-4 gap-1 sticky top-0 h-screen">
        <div className="mb-6 px-2">
          <div className="text-xl font-extrabold tracking-tight">Sembako<span className="text-sidebar-primary">POS</span></div>
          <div className="text-xs opacity-70">Kasir toko sembako</div>
        </div>
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
            className="rounded-lg px-3 py-2.5 font-medium hover:bg-sidebar-accent"
            activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary" }}>
            <span className="mr-2">{n.icon}</span>{n.label}
          </Link>
        ))}
        <div className="mt-auto text-xs opacity-70 px-2">Prototipe demo · data hanya di browser ini</div>
      </aside>
      <div className="flex-1 min-w-0 pb-20 md:pb-0">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b bg-card/95 backdrop-blur px-4 py-2.5">
          <span className="md:hidden font-extrabold">Sembako<span className="text-primary">POS</span></span>
          <span className="rounded-full bg-accent text-accent-foreground px-3 py-0.5 text-xs font-bold tracking-wide">MODE DEMO</span>
          <button className="text-xs underline text-muted-foreground" onClick={() => setInfo(!info)}>
            Demo belum sinkron antar perangkat
          </button>
          <button className="btn btn-danger ml-auto !py-1.5 text-xs"
            onClick={() => confirm("Reset semua data ke data sampel? Transaksi, kulakan & opname akan dihapus.") && reset()}>
            Reset data sampel
          </button>
          {info && (
            <div className="w-full rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Ini prototipe demo, <b>bukan aplikasi siap produksi</b>. Semua data disimpan di localStorage browser ini saja,
              tidak tersinkron ke HP/tablet/laptop lain, dan bisa hilang jika data browser dihapus. Tidak ada pembayaran nyata
              maupun integrasi printer/perangkat — struk dicetak lewat fitur cetak browser.
            </div>
          )}
        </header>
        <main className="p-3 sm:p-5 lg:p-6">{children}</main>
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-5 border-t bg-card">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
            className="flex flex-col items-center py-2 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary font-bold" }}>
            <span className="text-lg">{n.icon}</span>{n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function meta(title: string, description: string) {
  return {
    meta: [
      { title: `${title} · SembakoPOS Demo` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · SembakoPOS Demo` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
