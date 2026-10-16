import { formatDate, formatNum, formatRp, type Tx } from "./pos";

export function printReceipt(tx: Tx) {
  const w = window.open("", "_blank", "width=380,height=600");
  if (!w) {
    alert("Pop-up diblokir browser. Izinkan pop-up untuk mencetak struk.");
    return;
  }
  const rows = tx.items
    .map(
      (i) => `<tr><td colspan="2">${i.name} – ${i.pkgName}</td></tr>
<tr><td>${formatNum(i.qty)} x ${formatRp(i.unitPrice)}${i.wholesale ? " (grosir)" : ""}</td><td class="r">${formatRp(i.subtotal)}</td></tr>`,
    )
    .join("");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Struk ${tx.id}</title>
<style>body{font-family:monospace;font-size:12px;width:280px;margin:8px auto}h1{font-size:15px;text-align:center;margin:0}
p{text-align:center;margin:2px 0}table{width:100%;border-collapse:collapse}.r{text-align:right}hr{border:0;border-top:1px dashed #000}</style>
</head><body><h1>SembakoPOS</h1><p>STRUK DEMO – bukan bukti pembayaran resmi</p><p>${tx.id}<br>${formatDate(tx.date)}</p><hr>
<table>${rows}</table><hr><table>
<tr><td>Subtotal</td><td class="r">${formatRp(tx.subtotal)}</td></tr>
${tx.discount ? `<tr><td>Diskon</td><td class="r">-${formatRp(tx.discount)}</td></tr>` : ""}
<tr><td><b>Total</b></td><td class="r"><b>${formatRp(tx.total)}</b></td></tr>
<tr><td>Tunai</td><td class="r">${formatRp(tx.paid)}</td></tr>
<tr><td>Kembali</td><td class="r">${formatRp(tx.change)}</td></tr></table><hr><p>Terima kasih!</p>
<script>window.onload=()=>{window.print()}</script></body></html>`);
  w.document.close();
}
