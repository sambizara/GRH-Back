const express = require('express');
const {
  deposerRapport,
  getMyRapports,
  getAllRapports,
  updateRapport,
  downloadRapport
} = require('../controllers/rapport_controller');

const auth = require('../middlewares/auth_middleware');
const { upload, handleUploadErrors } = require('../middlewares/upload_middleware');

const router = express.Router();

// Routes pour STAGIAIRE
router.post('/', 
  auth(['STAGIAIRE']), 
  upload.single('fichier'),
  handleUploadErrors,
  deposerRapport
);

router.get('/mes-rapports', auth(['STAGIAIRE']), getMyRapports);
router.get('/download/:rapportId', auth(['STAGIAIRE', 'ADMIN_RH']), downloadRapport);

// Routes pour ADMIN_RH
router.get('/all', auth(['ADMIN_RH']), getAllRapports);
router.put('/:rapportId', auth(['ADMIN_RH']), updateRapport);

module.exports = router;