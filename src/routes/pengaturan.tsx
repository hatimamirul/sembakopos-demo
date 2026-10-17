import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Printer, Save } from 'lucide-react';
import { meta, PageTitle } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ImageUpload';
import { useStore } from '@/lib/store';
import { defaultProfile, defaultReceipt, receiptElements, type ReceiptElement } from '@/lib/settings';
import { printReceipt, receiptDocument, sampleReceipt } from '@/lib/receipt';
export const Route = createFileRoute('/pengaturan')({ head: () => meta('Pengaturan Toko & Struk', 'Profil toko opsional dan pengaturan cetak struk thermal 58mm atau 80mm untuk SembakoPOS demo.'), component: Pengaturan });
const labels: Record<ReceiptElement, string> = { logo: 'Logo toko', phone: 'Nomor HP', whatsapp: 'WhatsApp', transaction: 'Nomor transaksi', date: 'Tanggal & waktu', items: 'Rincian barang', total: 'Subtotal, diskon & total', paid: 'Uang tunai', change: 'Kembalian', footer: 'Teks footer' };
function Pengaturan() {
  const { state, setState, ready } = useStore();
  const [profile, setProfile] = useState(state.profile ?? defaultProfile);
  const [receipt, setReceipt] = useState(state.receipt ?? defaultReceipt);
  const [tab, setTab] = useState<'profile' | 'receipt'>('profile'), [message, setMessage] = useState('');
  const [previewTx, setPreviewTx] = useState<'last' | 'sample'>('last');
  const tx = previewTx === 'last' ? state.txs[0] ?? sampleReceipt : sampleReceipt;
  const save = () => { setMessage(''); if (setState({ ...state, profile, receipt })) setMessage('Pengaturan tersimpan di browser ini.'); };
  const profileField = (key: 'name' | 'address' | 'phone' | 'whatsapp' | 'note', label: string) => <div key={key}><label className="label" htmlFor={`profile-${key}`}>{label}</label><input id={`profile-${key}`} className="field" value={profile[key]} type={key === 'phone' || key === 'whatsapp' ? 'tel' : 'text'} onChange={e => { setProfile({ ...profile, [key]: e.target.value }); setMessage(''); }} /></div>;
  return <><PageTitle title="Pengaturan" sub="Profil toko opsional · struk dicetak lewat dialog browser" />
    <div className="flex flex-wrap gap-2 mb-5"><Button variant={tab === 'profile' ? 'default' : 'secondary'} onClick={() => setTab('profile')}>Profil toko</Button><Button variant={tab === 'receipt' ? 'default' : 'secondary'} onClick={() => setTab('receipt')}>Struk thermal</Button></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
      <section className="space-y-4">
        {tab === 'profile' ? <><h2 className="font-bold text-lg">Profil toko</h2><p className="text-sm text-muted-foreground">Tidak wajib mengisi data pribadi untuk mencoba demo.</p><ImageUpload label="Logo toko" value={profile.logo} onChange={logo => { setProfile({ ...profile, logo }); setMessage(''); }} />
          {profileField('name', 'Nama toko')}{profileField('address', 'Alamat (opsional)')}<div className="grid sm:grid-cols-2 gap-3">{profileField('phone', 'Nomor HP (opsional)')}{profileField('whatsapp', 'WhatsApp (opsional)')}</div>{profileField('note', 'Catatan tambahan (opsional)')}
        </> : <><h2 className="font-bold text-lg">Struk thermal</h2><div className="grid sm:grid-cols-3 gap-3"><div><label htmlFor="paper" className="label">Lebar kertas</label><select id="paper" className="field" value={receipt.paper} onChange={e => setReceipt({ ...receipt, paper: e.target.value === '80' ? '80' : '58' })}><option value="58">58 mm</option><option value="80">80 mm</option></select></div>
          <div><label htmlFor="alignment" className="label">Posisi header/footer</label><select id="alignment" className="field" value={receipt.align} onChange={e => setReceipt({ ...receipt, align: e.target.value === 'left' ? 'left' : 'center' })}><option value="center">Tengah</option><option value="left">Kiri</option></select></div>
          <div><label htmlFor="font-size" className="label">Ukuran tulisan</label><select id="font-size" className="field" value={receipt.fontSize} onChange={e => setReceipt({ ...receipt, fontSize: e.target.value as 'small' | 'medium' | 'large' })}><option value="small">Kecil (9 pt)</option><option value="medium">Sedang (10 pt)</option><option value="large">Besar (12 pt)</option></select></div></div>
          <fieldset><legend className="font-semibold mb-2">Elemen yang dicetak</legend><div className="grid sm:grid-cols-2 gap-1">{receiptElements.map(key => <label key={key} className="flex items-center gap-3 min-h-11 text-sm"><input type="checkbox" className="size-5 accent-primary" checked={receipt.visible[key]} onChange={e => setReceipt({ ...receipt, visible: { ...receipt.visible, [key]: e.target.checked } })} />{labels[key]}</label>)}</div></fieldset>
          <div><label htmlFor="footer-text" className="label">Teks terima kasih / footer</label><textarea id="footer-text" className="field" rows={3} value={receipt.footerText} onChange={e => setReceipt({ ...receipt, footerText: e.target.value })} /></div>
          <p className="text-sm text-muted-foreground">Pilih printer/driver dan ukuran kertas yang sesuai di dialog cetak browser. Tidak ada cetak Bluetooth langsung atau cetak tanpa dialog.</p>
        </>}
        <Button disabled={!ready} onClick={save}><Save />Simpan pengaturan</Button>{message && <p role="status" className="text-success text-sm">{message}</p>}
      </section>
      <section className="space-y-3 min-w-0"><div className="flex flex-wrap justify-between items-center gap-2"><h2 className="font-bold">Pratinjau struk · {receipt.paper} mm</h2><select aria-label="Transaksi pratinjau" className="field !w-auto" value={previewTx} onChange={e => setPreviewTx(e.target.value === 'sample' ? 'sample' : 'last')}><option value="last">{state.txs.length ? 'Transaksi terakhir' : 'Transaksi contoh'}</option><option value="sample">Transaksi contoh</option></select></div>
        <iframe title="Pratinjau struk thermal" sandbox="" srcDoc={receiptDocument(tx, profile, receipt)} className="w-full h-[560px] border rounded-md bg-card" />
        <Button variant="outline" onClick={() => printReceipt(tx, profile, receipt)}><Printer />Cetak uji struk</Button>
      </section>
    </div>
  </>;
}
