# SembakoPOS — pemeriksaan dan migrasi data aman

Proyek masih berstatus **DEMO**, bukan POS siap produksi. Simpan data toko dan transaksi secara pribadi. GitHub publik hanya untuk kode; **jangan** commit cadangan data JSON.

## Langkah setelah perbaikan direview

1. Periksa hasil GitHub Actions dan preview branch, kemudian tinjau pull request sebelum menggabungkan ke `main`.
2. Buka `https://sembakopos-demo.lovable.app` menggunakan **browser/perangkat yang menyimpan data asli**. Buka **Pengaturan → Cadangkan / pulihkan data → Unduh cadangan JSON**. Fitur baru harus sudah tersedia di versi aplikasi tersebut sebelum langkah ini.
3. Simpan file cadangan JSON secara pribadi; file mungkin memuat data toko dan transaksi. Jangan unggah ke repository GitHub publik.
4. Hubungkan repository `hatimamirul/sembakopos-demo` pada Vercel melalui dashboard Vercel dan gunakan **preview deployment** terlebih dahulu. Aplikasi menggunakan TanStack Start/Vite dan konfigurasi Nitro Lovable. Gunakan build default dari proyek; jangan menambahkan plugin Nitro kedua.
5. Coba semua halaman aplikasi lewat HTTPS dan uji 5 pouch minyak Rp105.000, tunai Rp110.000, kembalian Rp5.000, stok 24 → 19 pada browser uji dengan data sampel.
6. Pada alamat Vercel yang baru, buka **Pengaturan → Pulihkan dari berkas** dan pilih backup JSON. Aplikasi meminta persetujuan sebelum mengganti data browser baru.
7. Lakukan tes fisik scanner kamera, printer, dan kertas thermal 58/80 mm sebelum benar-benar digunakan.

**Catatan:** data `localStorage` pada domain Lovable dan Vercel tidak otomatis sinkron. Backup JSON membantu migrasi satu arah, bukan sistem database multi-perangkat.

## Printer thermal

- Pilih **Pengaturan → Struk thermal**, lalu kertas **58 mm** atau **80 mm** dan lihat pratinjau.
- Sesuaikan ukuran kertas pada dialog cetak Chrome atau driver printer. Matikan header/footer browser, dan gunakan margin nol bila driver mendukung.
- Pencetakan memakai dialog browser; tidak ada pencetakan Bluetooth langsung atau silent print. Hasil printer sebenarnya tetap membutuhkan pemeriksaan perangkat.

Rujukan Vercel: https://vercel.com/changelog/you-can-now-deploy-lovable-apps-to-vercel
