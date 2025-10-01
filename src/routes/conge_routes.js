const express = require('express');
const { createConge, getMesConges, getAllConges, updateCongeStatus, deleteConge } = require('../controllers/conge_controller');
const auth = require('../middlewares/auth_middleware');

const router = express.Router();

// Routes pour demander un congé (protégées, accessibles par Salarié)
router.post('/', auth(['SALARIE']), createConge);

// Routes pour voir les congés (protégées, accessibles au Salarié)
router.get('/:id', auth(['SALARIE']), getMesConges);

// Routes pour voir toutes les demandes de congé (protégées, accessibles uniquement par ADMIN_RH)
router.get('/', auth(['ADMIN_RH']), getAllConges);

// Routes pour valider/refuser une demande de congé (protégées, accessibles uniquement par ADMIN_RH)
router.put('/:id', auth(['ADMIN_RH']), updateCongeStatus);

// Routes pour supprimer une demande de congé (protégées, accessibles au Salarié et ADMIN_RH)
router.delete('/:id', auth(['SALARIE', 'ADMIN_RH']), deleteConge);

module.exports = router;