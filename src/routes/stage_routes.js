const express = require("express");
const {
    assignerEncadreur,
    getAllStages,
    getStageById,
    updateStageStatus,
    deleteStage,
    notifyUser
} = require("../controllers/stage_controller");

const auth = require("../middlewares/auth_middleware");

const router = express.Router();

// Routes pour ADMIN_RH
router.post("/", auth(["ADMIN_RH"]), assignerEncadreur);
router.get("/", auth(["ADMIN_RH"]), getAllStages);

// Routes pour ADMIN_RH et STAGIAIRE et SALARIE
router.get("/:id", auth(["ADMIN_RH", "STAGIAIRE", "SALARIE"]), getStageById);
router.put("/:id", auth(["ADMIN_RH"]), updateStageStatus);
router.delete("/:id", auth(["ADMIN_RH"]), deleteStage);
router.post("/:id/notify", auth(["ADMIN_RH"]), notifyUser);


module.exports = router;