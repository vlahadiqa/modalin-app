const User = require("../models/User");

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/scoring  (butuh login)
// Hitung credit scoring berdasarkan data profil bisnis user
// ══════════════════════════════════════════════════════════════════════════════
exports.getScoring = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Pastikan data bisnis sudah lengkap
    if (!user.omzetBulanan || !user.pengeluaranBulanan) {
      return res.status(400).json({
        status: "error",
        message: "Lengkapi data bisnis terlebih dahulu untuk melihat scoring.",
      });
    }

    // ── Kalkulasi skor (sederhana, bisa diganti dengan model AI/ML) ──────────
    const omzet = parseFloat(user.omzetBulanan.replace(/\D/g, "")) || 0;
    const pengeluaran = parseFloat(user.pengeluaranBulanan.replace(/\D/g, "")) || 0;
    const hutang = parseFloat(user.totalHutang.replace(/\D/g, "")) || 0;
    const aset = parseFloat(user.totalAset.replace(/\D/g, "")) || 0;
    const lamaBerdiri = parseInt(user.lamaBerdiri) || 0;
    const frekuensi = parseInt(user.frekuensiTransaksi) || 0;

    // Capacity: rasio pendapatan vs pengeluaran
    const rasioKas = pengeluaran > 0 ? (omzet - pengeluaran) / omzet : 0;
    const skorCapacity = Math.min(100, Math.max(0, Math.round(rasioKas * 100)));

    // Capital: rasio aset vs hutang
    const rasioModal = aset > 0 ? Math.min(1, (aset - hutang) / aset) : 0;
    const skorCapital = Math.min(100, Math.max(0, Math.round(rasioModal * 100)));

    // Character: lama berdiri & frekuensi transaksi
    const skorCharacter = Math.min(100, Math.round(
      (Math.min(lamaBerdiri, 60) / 60) * 50 + (Math.min(frekuensi, 30) / 30) * 50
    ));

    // Collateral: estimasi aset
    const skorCollateral = aset >= 50_000_000 ? 80 : aset >= 10_000_000 ? 60 : 40;

    // Condition: jenis usaha (disesuaikan dengan pilihan dropdown frontend)
    // Frontend dropdown: "Bisnis Kuliner", "Produk Kreatif", "Toko & E-commerce", "Jasa & Freelancer", "Produk Digital"
    const jenisUsahaBagus = ["kuliner", "makanan", "teknologi", "digital", "jasa", "freelancer", "perdagangan", "e-commerce", "kreatif"];
    const skorCondition = jenisUsahaBagus.some((j) =>
      (user.jenisUsaha || "").toLowerCase().includes(j)
    ) ? 75 : 55;

    // Total skor — 4C: Capacity (35%), Capital (25%), Character (25%), Condition (15%)
    const totalSkor = Math.round(
      skorCapacity * 0.35 +
      skorCapital * 0.25 +
      skorCharacter * 0.25 +
      skorCondition * 0.15
    );

    // Kategori
    let kategori, warna;
    if (totalSkor >= 75) { kategori = "Sangat Baik"; warna = "#22c55e"; }
    else if (totalSkor >= 60) { kategori = "Baik"; warna = "#84cc16"; }
    else if (totalSkor >= 45) { kategori = "Cukup"; warna = "#fbbf24"; }
    else { kategori = "Perlu Ditingkatkan"; warna = "#ef4444"; }

    res.json({
      status: "success",
      data: {
        totalSkor,
        kategori,
        warna,
        detail: [
          { label: "Character", score: skorCharacter, desc: "Rekam jejak dan konsistensi transaksi." },
          { label: "Capacity", score: skorCapacity, desc: "Kemampuan menghasilkan pendapatan vs pengeluaran." },
          { label: "Capital", score: skorCapital, desc: "Perbandingan aset dan hutang bisnis." },
          { label: "Condition", score: skorCondition, desc: "Kondisi dan jenis usaha." },
        ],
      },
    });
  } catch (error) {
    console.error("Scoring error:", error);
    res.status(500).json({ status: "error", message: "Terjadi kesalahan server." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/scoring/anomali  (butuh login)
// Deteksi anomali arus kas
// ══════════════════════════════════════════════════════════════════════════════
exports.getAnomali = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const omzet = parseFloat(user.omzetBulanan?.replace(/\D/g, "")) || 0;
    const pengeluaran = parseFloat(user.pengeluaranBulanan?.replace(/\D/g, "")) || 0;
    const rasio = omzet > 0 ? pengeluaran / omzet : 0;

    const anomali = [];

    if (rasio > 0.9) {
      anomali.push({
        tipe: "Kritis",
        warna: "#ef4444",
        pesan: "Pengeluaran melebihi 90% dari omzet. Risiko arus kas sangat tinggi.",
      });
    } else if (rasio > 0.75) {
      anomali.push({
        tipe: "Peringatan",
        warna: "#fbbf24",
        pesan: "Pengeluaran antara 75-90% dari omzet. Perlu pemantauan lebih ketat.",
      });
    }

    if (parseFloat(user.totalHutang?.replace(/\D/g, "")) > omzet * 12) {
      anomali.push({
        tipe: "Peringatan",
        warna: "#fbbf24",
        pesan: "Total hutang melebihi pendapatan tahunan. Pertimbangkan restrukturisasi.",
      });
    }

    res.json({
      status: "success",
      data: {
        omzet,
        pengeluaran,
        arus_kas_bersih: omzet - pengeluaran,
        rasio_pengeluaran: `${(rasio * 100).toFixed(1)}%`,
        anomali,
        total_anomali: anomali.length,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Terjadi kesalahan server." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/scoring/rekomendasi  (butuh login)
// Rekomendasi pinjaman / produk keuangan
// ══════════════════════════════════════════════════════════════════════════════
exports.getRekomendasi = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const omzet = parseFloat(user.omzetBulanan?.replace(/\D/g, "")) || 0;

    // Rekomendasi pinjaman berdasarkan omzet
    let rekomendasiPinjaman;
    if (omzet >= 50_000_000) {
      rekomendasiPinjaman = { min: 100_000_000, max: 500_000_000, label: "Rp 100 jt – Rp 500 jt" };
    } else if (omzet >= 10_000_000) {
      rekomendasiPinjaman = { min: 25_000_000, max: 100_000_000, label: "Rp 25 jt – Rp 100 jt" };
    } else {
      rekomendasiPinjaman = { min: 5_000_000, max: 25_000_000, label: "Rp 5 jt – Rp 25 jt" };
    }

    res.json({
      status: "success",
      data: {
        rekomendasiPinjaman,
        produk: [
          {
            nama: "Kredit Usaha Rakyat (KUR)",
            bunga: "6% per tahun",
            tenor: "3-5 tahun",
            cocok: omzet < 50_000_000,
          },
          {
            nama: "Pinjaman Modal Kerja",
            bunga: "8-12% per tahun",
            tenor: "1-3 tahun",
            cocok: true,
          },
          {
            nama: "Invoice Financing",
            bunga: "1-2% per bulan",
            tenor: "1-6 bulan",
            cocok: omzet >= 20_000_000,
          },
        ].filter((p) => p.cocok),
        tips: [
          "Pastikan laporan keuangan selalu diperbarui setiap bulan.",
          "Pisahkan rekening pribadi dan bisnis.",
          "Catat setiap transaksi untuk meningkatkan skor kredit.",
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Terjadi kesalahan server." });
  }
};
