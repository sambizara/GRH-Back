// routes/pdf_routes.js
const express = require("express");
const {
  generateContratPDF,
  generateContratsListPDF,
  generateAttestationPDF
} = require("../controllers/pdf_controller");

const auth = require("../middlewares/auth_middleware");

const router = express.Router();

router.get("/contrats/:id", auth(["ADMIN_RH", "SALARIE"]), generateContratPDF);
router.get("/contrats", auth(["ADMIN_RH"]), generateContratsListPDF);
router.get("/attestations/:id", auth(["ADMIN_RH", "SALARIE", "STAGIAIRE"]), generateAttestationPDF);

module.exports = router;