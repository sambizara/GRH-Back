const express = require('express');
const {
  deposerRapport,
  getMyRapports,
  getRapportsRecus,
  getAllRapports,
  downloadRapport,
  marquerCommeLu,
  validerRapport,
  archiverRapport,
  getStats,
  debugEncadreur,
  ajouterRemarque,
  getRemarques,
  marquerCorrige
} = require('../controllers/rapport_controller');

const auth = require('../middlewares/auth_middleware');
const { upload, handleUploadErrors } = require('../middlewares/upload_middleware');

const router = express.Router();

// STAGIAIRE
router.post('/', auth(['STAGIAIRE']), upload.single('fichier'), handleUploadErrors, deposerRapport);
router.get('/mes-rapports', auth(['STAGIAIRE']), getMyRapports);
router.put('/:rapportId/corrige', auth(['STAGIAIRE']), marquerCorrige);

// SALARIÉ
router.get('/recus', auth(['SALARIE']), getRapportsRecus);
router.put('/:rapportId/lu', auth(['SALARIE']), marquerCommeLu);
router.put('/:rapportId/valider', auth(['SALARIE']), validerRapport);
router.post('/:rapportId/remarques', auth(['SALARIE']), ajouterRemarque);

// ADMIN + commun
router.get('/download/:rapportId', auth(['STAGIAIRE', 'SALARIE', 'ADMIN_RH']), downloadRapport);
router.get('/:rapportId/remarques', auth(['STAGIAIRE', 'SALARIE', 'ADMIN_RH']), getRemarques);
router.put('/:rapportId/archiver', auth(['ADMIN_RH']), archiverRapport);
router.get('/stats', auth(['STAGIAIRE', 'SALARIE', 'ADMIN_RH']), getStats);
router.get('/all', auth(['ADMIN_RH']), getAllRapports);

// Debug routes
router.get('/debug-encadreur', auth(['STAGIAIRE']), debugEncadreur);

module.exports = router;