const express = require('express');
const { register, login, verifyPassword } = require('../controllers/auth_controller');
const auth = require("../middlewares/auth_middleware");

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-password', auth(["ADMIN_RH", "SALARIE", "STAGIAIRE"]), verifyPassword);

module.exports = router;