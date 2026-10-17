# Sembakopos Demo

Bangun website demo bernama SembakoPOS, aplikasi kasir toko sembako berbahasa Indonesia dengan antarmuka responsif yang nyaman digunakan di tablet Samsung (Chrome desktop mode), HP dan laptop. Buat demo langsung bisa dipakai tanpa login menggunakan data contoh dan state localStorage; jangan meminta database atau backend untuk versi demo, jangan menyatakan siap produksi. Fitur penting: 1) POS kasir pilih barang, jumlah, satuan, daftar keranjang, diskon opsional jika masuk akal, pembayaran tunai, kembalian, struk cetak HTML, riwayat transaksi; 2) pencatatan master barang, varian kemasan ecer/grosir, harga modal, harga ecer, harga grosir dan ambang grosir, jumlah stok dalam satuan dasar; 3) kulakan menambah stok otomatis dan memakai faktor konversi karton ke pouch; 4) stok opname dengan koreksi stok dan riwayat; 5) ringkasan omzet & laba kotor berbasis harga modal; 6) navigasi sederhana Kasir, Barang, Kulakan, Stok Opname, Laporan; 7) indikator jelas DEMO dan reset data sampel. Data awal minyak goreng pouch 1 liter: 1 karton=12 pouch, stok contoh 24 pouch, harga ecer Rp21.000/pouch untuk 1-11 pouch, harga grosir contoh Rp19.500/pouch mulai 12 pouch (dan kelipatannya boleh mendapat harga grosir sesuai threshold); jika 5 pouch terjual harga Rp105.000, bayar Rp110.000, kembali Rp5.000, stok tinggal 19 pouch. Produk sampel lain: beras medium kg dan karung 25kg, gula kg dan karung 50kg, bumbu sachet dan dus 20. Pastikan harga grosir dihitung secara konsisten berdasar total kuantitas item di keranjang termasuk jika item ditambah terpisah, tolak penjualan jika stok tidak cukup, transaksi mengurangi stok setelah checkout sukses, transaksi gagal tidak mengubah stok, validasi input angka ketat, label jelas bahasa Indonesia, format Rupiah id-ID. Estetika dashboard kasir bersih, modern, informatif dan mudah dipahami untuk pelaku usaha baru; tanpa klaim integrasi asli, tanpa transaksi pembayaran nyata; data disimpan hanya lokal per browser. Siapkan juga penjelasan 'Demo belum sinkron antar perangkat' di aplikasi. Buat semuanya berjalan langsung sebagai prototipe interaktif.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sembakopos-demo.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/20c02af8-ec80-468e-85d0-e822320da800).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
