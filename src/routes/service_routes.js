// routes/service_routes.js
const express = require("express");
const {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deactivateService, // ✅ Changé de deleteService
    activateService,   // ✅ Nouveau
    assignUserToService,
    removeUserFromService,
    getServiceUsers    // ✅ Nouveau
} = require("../controllers/service_controller");

const auth = require("../middlewares/auth_middleware");

const router = express.Router();

// Routes pour ADMIN_RH
router.post("/", auth(["ADMIN_RH"]), createService);
router.get("/", auth(["ADMIN_RH", "SALARIE", "STAGIAIRE"]), getAllServices); // ✅ SALARIE peut voir les services
router.get("/:id", auth(["ADMIN_RH", "SALARIE"]), getServiceById);
router.put("/:id", auth(["ADMIN_RH"]), updateService);
router.patch("/:id/deactivate", auth(["ADMIN_RH"]), deactivateService); // ✅ Soft delete
router.patch("/:id/activate", auth(["ADMIN_RH"]), activateService);     // ✅ Activation

// Gestion des utilisateurs dans les services
router.post("/:serviceId/assign/:userId", auth(["ADMIN_RH"]), assignUserToService);
router.post("/:serviceId/remove/:userId", auth(["ADMIN_RH"]), removeUserFromService);
router.get("/:serviceId/users", auth(["ADMIN_RH", "SALARIE"]), getServiceUsers); // ✅ Nouveau

module.exports = router;