const express = require("express");
const {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
    assignUserToService,
    removeUserFromService
} = require("../controllers/service_controller");

const auth = require("../middlewares/auth_middleware");

const router = express.Router();

// Routes pour ADMIN_RH
router.post("/", auth(["ADMIN_RH"]), createService);
router.get("/", auth(["ADMIN_RH"]), getAllServices);
router.get("/:id", auth(["ADMIN_RH"]), getServiceById);
router.put("/:id", auth(["ADMIN_RH"]), updateService);
router.delete("/:id", auth(["ADMIN_RH"]), deleteService);
router.post("/:serviceId/assign/:userId", auth(["ADMIN_RH"]), assignUserToService);
router.post("/:serviceId/remove/:userId", auth(["ADMIN_RH"]), removeUserFromService);

module.exports = router;