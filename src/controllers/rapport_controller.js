const Rapport = require('../models/rapport_model');
const path = require('path');
const fs = require('fs');

// Déposer un rapport
exports.deposerRapport = async (req, res) => {
  try {
    console.log("📥 Requête reçue - Fichier:", req.file);
    console.log("📥 Corps de la requête:", req.body);
    console.log("👤 Utilisateur authentifié:", req.user);

    // Vérifier que l'utilisateur est bien authentifié
    if (!req.user || !req.user.id) {
      console.log("❌ Utilisateur non authentifié - req.user:", req.user);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(401).json({ 
        message: 'Utilisateur non authentifié' 
      });
    }

    const { titre } = req.body;
    
    // Vérifier si un fichier a été uploadé
    if (!req.file) {
      console.log("❌ Aucun fichier reçu");
      return res.status(400).json({ 
        message: 'Veuillez sélectionner un fichier' 
      });
    }

    // Validation des champs requis
    if (!titre || !titre.trim()) {
      // Supprimer le fichier uploadé si le titre est manquant
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        message: 'Le titre est requis' 
      });
    }

    console.log("💾 Création du rapport pour l'utilisateur:", req.user.id);
    
    const rapport = new Rapport({
      user: req.user.id, // ⭐⭐ CORRECTION : utiliser 'id' au lieu de 'userId'
      titre: titre.trim(),
      fichier: {
        nom: req.file.originalname,
        url: req.file.path,
        taille: req.file.size,
        type: req.file.mimetype
      }
    });
    
    await rapport.save();
    console.log("✅ Rapport sauvegardé en base:", rapport._id);
    
    res.status(201).json({ 
      message: 'Rapport déposé avec succès', 
      rapport: {
        _id: rapport._id,
        titre: rapport.titre,
        dateDepot: rapport.dateDepot,
        statut: rapport.statut,
        fichier: rapport.fichier
      }
    });
  } catch (error) {
    console.error('❌ Erreur dépôt rapport:', error);
    
    // Supprimer le fichier uploadé en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Gérer les erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Erreur lors du dépôt du rapport', 
      error: error.message 
    });
  }
};


// Télécharger un rapport
exports.downloadRapport = async (req, res) => {
    try {
        const { rapportId } = req.params;
        
        const rapport = await Rapport.findById(rapportId);
        if (!rapport) {
            return res.status(404).json({ message: 'Rapport non trouvé' });
        }

        // Vérifier que l'utilisateur a le droit de télécharger ce rapport
        if (rapport.user.toString() !== req.user.userId && !req.user.roles.includes('ADMIN_RH')) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const filePath = rapport.fichier.url;
        
        // Vérifier que le fichier existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Fichier non trouvé' });
        }

        // Définir les headers pour le téléchargement
        res.setHeader('Content-Disposition', `attachment; filename="${rapport.fichier.nom}"`);
        res.setHeader('Content-Type', rapport.fichier.type);

        // Envoyer le fichier
        res.sendFile(path.resolve(filePath));
    } catch (error) {
        console.error('Erreur téléchargement rapport:', error);
        res.status(500).json({ 
            message: 'Erreur lors du téléchargement du rapport', 
            error: error.message 
        });
    }
};

// Voir mes rapports
exports.getMyRapports = async (req, res) => {
  try {
    console.log("👤 Récupération des rapports pour l'utilisateur:", req.user.id);
    
    const rapports = await Rapport.find({ user: req.user.id }) // ⭐⭐ CORRECTION : utiliser 'id'
      .sort({ createdAt: -1 });
    
    console.log("✅ Rapports trouvés:", rapports.length);
    
    res.status(200).json(rapports);
  } catch (error) {
    console.error('❌ Erreur récupération rapports:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des rapports', 
      error: error.message 
    });
  }
};


// Voir tous les rapports (admin - reste inchangé)
exports.getAllRapports = async (req, res) => {
    try {
        const rapports = await Rapport.find()
            .populate({
                path: 'user',
                select: 'nom prenom email role service poste',
                populate: {
                    path: 'service',
                    select: 'nomService'
                }
            })
            .sort({ createdAt: -1 });
        
        res.status(200).json(rapports);
    } catch (error) {
        console.error('Erreur récupération tous rapports:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération des rapports', 
            error: error.message 
        });
    }
};

// Valider ou rejeter un rapport (admin - reste inchangé)
exports.updateRapport = async (req, res) => {
    try {
        const { rapportId } = req.params;
        const { statut } = req.body;

        if (!['Brouillon', 'Publié', 'Archivé'].includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const rapport = await Rapport.findByIdAndUpdate(
            rapportId, 
            { statut }, 
            { new: true }
        ).populate({
            path: 'user',
            select: 'nom prenom email role service poste',
            populate: {
                path: 'service',
                select: 'nomService'
            }
        });

        if (!rapport) {
            return res.status(404).json({ message: 'Rapport non trouvé' });
        }
        
        res.status(200).json({ 
            message: 'Statut du rapport mis à jour', 
            rapport 
        });
    } catch (error) {
        console.error('Erreur mise à jour rapport:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la mise à jour du statut du rapport', 
            error: error.message 
        });
    }
};