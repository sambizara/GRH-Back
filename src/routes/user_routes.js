// routes/user_routes.js
const express = require("express");
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getCurrentUser,
  updateCurrentUser,
  activateUser,
  getSalariesDisponibles,
  getUsersDesactives // AJOUTER CETTE LIGNE
} = require("../controllers/user_controller");
const auth = require("../middlewares/auth_middleware");

const router = express.Router();

// 🔹 Routes pour l'utilisateur connecté
router.get("/me", auth(["ADMIN_RH", "SALARIE", "STAGIAIRE"]), getCurrentUser);
router.put("/me", auth(["ADMIN_RH", "SALARIE", "STAGIAIRE"]), updateCurrentUser);

// 🔹 Routes pour l'admin RH
router.post("/", auth(["ADMIN_RH"]), createUser);
router.get("/", auth(["ADMIN_RH"]), getUsers);
router.get("/:id", auth(["ADMIN_RH"]), getUserById);
router.put("/:id", auth(["ADMIN_RH"]), updateUser);
router.delete("/:id", auth(["ADMIN_RH"]), deleteUser);
router.patch("/:id/activate", auth(["ADMIN_RH"]), activateUser);

// 🔹 ROUTE UNIQUE : Récupérer les salariés disponibles (pour encadrement OU autres affectations)
router.get("/salaries/disponibles", auth(["ADMIN_RH"]), getSalariesDisponibles);

// 🔹 NOUVELLE ROUTE : Récupérer les utilisateurs désactivés
router.get("/admin/desactives", auth(["ADMIN_RH"]), getUsersDesactives);

module.exports = router;