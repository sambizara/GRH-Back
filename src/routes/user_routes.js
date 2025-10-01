const express = require('express');
const { createUser, getUsers, getUserById, updateUser, deleteUser } = require('../controllers/user_controller');
const auth = require('../middlewares/auth_middleware');

const router = express.Router();

// Routes pour la gestion des utilisateurs (protégées, accessibles uniquement par ADMIN_RH)
router.post('/', auth(['ADMIN_RH']), createUser);
router.get('/', auth(['ADMIN_RH']), getUsers);
router.get('/:id', auth(['ADMIN_RH']), getUserById);
router.put('/:id', auth(['ADMIN_RH']), updateUser);
router.delete('/:id', auth(['ADMIN_RH']), deleteUser);

module.exports = router;