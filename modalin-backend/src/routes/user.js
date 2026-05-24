const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getProfile,
  updatePersonal,
  updateBusiness,
  changePassword,
} = require("../controllers/userController");

// Semua route di sini butuh login (protect)
router.use(protect);

// GET /api/user/profile
router.get("/profile", getProfile);

// PUT /api/user/profile/personal
router.put("/profile/personal", updatePersonal);

// PUT /api/user/profile/business
router.put("/profile/business", updateBusiness);

// PUT /api/user/profile/password
router.put("/profile/password", changePassword);

module.exports = router;
