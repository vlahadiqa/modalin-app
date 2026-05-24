const path = require("path");
const Upload = require("../models/Upload");

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/upload/data  (butuh login)
// Upload file mutasi rekening / laporan keuangan (PDF, CSV, XLS)
// ══════════════════════════════════════════════════════════════════════════════
exports.uploadData = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Tidak ada file yang diupload.",
      });
    }

    // Simpan info setiap file ke database
    const filesSaved = await Promise.all(
      req.files.map(async (file) => {
        const ext = path.extname(file.originalname).replace(".", "").toLowerCase();
        const upload = await Upload.create({
          userId: req.user._id,
          namaFile: file.originalname,
          namaDisimpan: file.filename,
          tipeFile: ext,
          ukuranFile: file.size,
          path: file.path,
          status: "uploaded",
        });
        return {
          id: upload._id,
          namaFile: upload.namaFile,
          tipeFile: upload.tipeFile,
          ukuranFile: `${(upload.ukuranFile / 1024).toFixed(1)} KB`,
          status: upload.status,
          uploadedAt: upload.createdAt,
        };
      })
    );

    res.status(201).json({
      status: "success",
      message: `${req.files.length} file berhasil diupload!`,
      data: { files: filesSaved },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ status: "error", message: "Terjadi kesalahan saat upload." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/upload/riwayat  (butuh login)
// Ambil riwayat upload file milik user
// ══════════════════════════════════════════════════════════════════════════════
exports.getRiwayat = async (req, res) => {
  try {
    const uploads = await Upload.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.json({
      status: "success",
      data: {
        total: uploads.length,
        files: uploads.map((u) => ({
          id: u._id,
          namaFile: u.namaFile,
          tipeFile: u.tipeFile,
          ukuranFile: `${(u.ukuranFile / 1024).toFixed(1)} KB`,
          status: u.status,
          uploadedAt: u.createdAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Terjadi kesalahan server." });
  }
};
