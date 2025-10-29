const Rapport = require('../models/rapport_model');
const { User } = require('../models/user_model');
const path = require('path');
const fs = require('fs');

// Déposer un rapport (STAGIAIRE → SALARIÉ)
exports.deposerRapport = async (req, res) => {
  try {
    console.log('=== DÉPÔT RAPPORT - DÉBUT ===');

    // Vérifications de base
    if (!req.file) {
      return res.status(400).json({ message: 'Veuillez sélectionner un fichier' });
    }

    const { titre, description } = req.body;
    if (!titre || !titre.trim()) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Le titre est requis' });
    }

    // Récupérer le stagiaire
    const stagiaire = await User.findById(req.user.id);
    
    if (!stagiaire) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "Stagiaire non trouvé" });
    }

    if (stagiaire.role !== 'STAGIAIRE') {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ message: "Accès réservé aux stagiaires" });
    }

    // Vérifier encadreur
    if (!stagiaire.encadreur) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        message: "Aucun encadreur assigné à votre compte. Contactez l'administration." 
      });
    }

    console.log('Stagiaire:', stagiaire.nom, stagiaire.prenom);
    console.log('Encadreur ID:', stagiaire.encadreur);

    // Création du rapport
    const rapport = new Rapport({
      user: req.user.id,
      destinataire: stagiaire.encadreur,
      titre: titre.trim(),
      description: description?.trim() || '',
      fichier: {
        nom: req.file.originalname,
        url: req.file.path,
        taille: req.file.size,
        type: req.file.mimetype
      },
      statut: 'Envoyé',
      dateDepot: new Date()
    });

    await rapport.save();
    
    // Populer pour la réponse
    await rapport.populate('destinataire', 'nom prenom email role');

    console.log('✅ Rapport déposé avec succès - ID:', rapport._id);
    console.log('📤 Destinataire:', rapport.destinataire);

    res.status(201).json({
      message: `Rapport envoyé à ${rapport.destinataire.prenom} ${rapport.destinataire.nom} avec succès`,
      rapport
    });

  } catch (error) {
    console.error('❌ Erreur dépôt rapport COMPLETE:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      message: "Erreur lors du dépôt du rapport", 
      error: error.message 
    });
  }
};

// Télécharger un rapport
exports.downloadRapport = async (req, res) => {
  try {
    const { rapportId } = req.params;
    const rapport = await Rapport.findById(rapportId);
    if (!rapport) return res.status(404).json({ message: 'Rapport non trouvé' });

    const userId = req.user.id;
    const isExpediteur = rapport.user.toString() === userId;
    const isDestinataire = rapport.destinataire.toString() === userId;
    const isAdmin = req.user.role === 'ADMIN_RH';

    if (!isExpediteur && !isDestinataire && !isAdmin)
      return res.status(403).json({ message: 'Accès non autorisé' });

    const filePath = rapport.fichier.url;
    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: 'Fichier non trouvé' });

    res.setHeader('Content-Disposition', `attachment; filename="${rapport.fichier.nom}"`);
    res.setHeader('Content-Type', rapport.fichier.type);
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Erreur téléchargement rapport:', error);
    res.status(500).json({ message: 'Erreur lors du téléchargement du rapport', error: error.message });
  }
};

// Mes rapports envoyés (STAGIAIRE)
exports.getMyRapports = async (req, res) => {
  try {
    const rapports = await Rapport.find({ user: req.user.id })
      .populate('destinataire', 'nom prenom email role poste')
      .populate('remarques.auteur', 'nom prenom role')
      .sort({ createdAt: -1 });
    res.status(200).json(rapports);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des rapports', error: error.message });
  }
};

// Rapports reçus (SALARIÉ)
exports.getRapportsRecus = async (req, res) => {
  try {
    const rapports = await Rapport.find({ destinataire: req.user.id })
      .populate('user', 'nom prenom email role poste')
      .populate('remarques.auteur', 'nom prenom role')
      .sort({ createdAt: -1 });
    res.status(200).json(rapports);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des rapports reçus', error: error.message });
  }
};

// Marquer un rapport comme lu (SALARIÉ)
exports.marquerCommeLu = async (req, res) => {
  try {
    const { rapportId } = req.params;
    const rapport = await Rapport.findById(rapportId);
    if (!rapport) return res.status(404).json({ message: 'Rapport non trouvé' });
    if (rapport.destinataire.toString() !== req.user.id)
      return res.status(403).json({ message: 'Accès non autorisé' });

    await rapport.marquerCommeLu();
    res.status(200).json({ message: 'Rapport marqué comme lu', rapport });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du marquage du rapport', error: error.message });
  }
};

// Valider un rapport (SALARIÉ)
exports.validerRapport = async (req, res) => {
  try {
    const { rapportId } = req.params;
    const { commentaire } = req.body;

    const rapport = await Rapport.findById(rapportId);
    if (!rapport) return res.status(404).json({ message: 'Rapport non trouvé' });

    if (rapport.destinataire.toString() !== req.user.id)
      return res.status(403).json({ message: 'Accès non autorisé' });

    rapport.statut = 'Validé';
    rapport.commentaireEncadrant = commentaire || '';
    rapport.dateValidation = new Date();

    await rapport.save();
    res.status(200).json({ message: 'Rapport validé avec succès', rapport });
  } catch (error) {
    console.error('Erreur validation rapport:', error);
    res.status(500).json({ message: 'Erreur lors de la validation du rapport', error: error.message });
  }
};

// NOUVEAU : Ajouter une remarque à un rapport (SALARIÉ)
exports.ajouterRemarque = async (req, res) => {
  try {
    const { rapportId } = req.params;
    const { message, type = 'remarque' } = req.body;

    const rapport = await Rapport.findById(rapportId);
    if (!rapport) {
      return res.status(404).json({ message: 'Rapport non trouvé' });
    }

    // Vérifier que l'utilisateur est le destinataire
    if (rapport.destinataire.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const nouvelleRemarque = {
      auteur: req.user.id,
      message: message.trim(),
      type: type,
      date: new Date()
    };

    rapport.remarques.push(nouvelleRemarque);
    
    // Si c'est une remarque de correction, on change le statut
    if (type === 'correction') {
      rapport.statut = 'Correction demandée';
    }

    await rapport.save();
    
    // Populer les informations de l'auteur
    await rapport.populate('remarques.auteur', 'nom prenom role');

    res.status(201).json({
      message: 'Remarque ajoutée avec succès',
      remarque: nouvelleRemarque,
      rapport
    });

  } catch (error) {
    console.error('Erreur ajout remarque:', error);
    res.status(500).json({ 
      message: "Erreur lors de l'ajout de la remarque", 
      error: error.message 
    });
  }
};

// NOUVEAU : Obtenir les remarques d'un rapport
exports.getRemarques = async (req, res) => {
  try {
    const { rapportId } = req.params;

    const rapport = await Rapport.findById(rapportId)
      .populate('remarques.auteur', 'nom prenom role')
      .select('remarques titre');

    if (!rapport) {
      return res.status(404).json({ message: 'Rapport non trouvé' });
    }

    // Vérifier les permissions
    const userId = req.user.id;
    const isExpediteur = rapport.user.toString() === userId;
    const isDestinataire = rapport.destinataire.toString() === userId;
    const isAdmin = req.user.role === 'ADMIN_RH';

    if (!isExpediteur && !isDestinataire && !isAdmin) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    res.status(200).json({
      remarques: rapport.remarques,
      titre: rapport.titre
    });

  } catch (error) {
    console.error('Erreur récupération remarques:', error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des remarques", 
      error: error.message 
    });
  }
};

// NOUVEAU : Marquer un rapport comme "Corrigé" (STAGIAIRE)
exports.marquerCorrige = async (req, res) => {
  try {
    const { rapportId } = req.params;

    const rapport = await Rapport.findById(rapportId);
    if (!rapport) {
      return res.status(404).json({ message: 'Rapport non trouvé' });
    }

    // Vérifier que l'utilisateur est l'auteur du rapport
    if (rapport.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    rapport.statut = 'Corrigé';
    rapport.version += 1;

    await rapport.save();

    res.status(200).json({
      message: 'Rapport marqué comme corrigé',
      rapport
    });

  } catch (error) {
    console.error('Erreur marquage corrigé:', error);
    res.status(500).json({ 
      message: "Erreur lors du marquage du rapport", 
      error: error.message 
    });
  }
};

// Tous les rapports (ADMIN_RH)
exports.getAllRapports = async (req, res) => {
  try {
    const rapports = await Rapport.find({ statut: 'Validé' })
      .populate('user', 'nom prenom email role service poste')
      .populate('destinataire', 'nom prenom email role service poste')
      .populate('remarques.auteur', 'nom prenom role')
      .sort({ createdAt: -1 });
    res.status(200).json(rapports);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des rapports', error: error.message });
  }
};

// Archiver un rapport (ADMIN_RH)
exports.archiverRapport = async (req, res) => {
  try {
    const { rapportId } = req.params;

    const rapport = await Rapport.findById(rapportId);
    if (!rapport) {
      return res.status(404).json({ message: 'Rapport non trouvé' });
    }

    if (rapport.statut !== 'Validé') {
      return res.status(400).json({ 
        message: 'Seuls les rapports validés peuvent être archivés' 
      });
    }

    rapport.statut = 'Archivé';
    await rapport.save();

    res.status(200).json({
      message: 'Rapport archivé avec succès',
      rapport
    });
  } catch (error) {
    console.error('Erreur archivage rapport:', error);
    res.status(500).json({
      message: "Erreur lors de l'archivage du rapport",
      error: error.message
    });
  }
};

// Statistiques
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    let stats = {};

    if (userRole === 'ADMIN_RH') {
      stats = {
        total: await Rapport.countDocuments(),
        envoyes: await Rapport.countDocuments({ statut: 'Envoyé' }),
        lus: await Rapport.countDocuments({ statut: 'Lu' }),
        valides: await Rapport.countDocuments({ statut: 'Validé' }),
        archives: await Rapport.countDocuments({ statut: 'Archivé' }),
        corrections: await Rapport.countDocuments({ statut: 'Correction demandée' }),
        corriges: await Rapport.countDocuments({ statut: 'Corrigé' })
      };
    } else if (userRole === 'SALARIE') {
      stats = {
        recus: await Rapport.countDocuments({ destinataire: userId }),
        nonLus: await Rapport.countDocuments({ destinataire: userId, statut: 'Envoyé' }),
        lus: await Rapport.countDocuments({ destinataire: userId, statut: 'Lu' }),
        valides: await Rapport.countDocuments({ destinataire: userId, statut: 'Validé' }),
        corrections: await Rapport.countDocuments({ destinataire: userId, statut: 'Correction demandée' })
      };
    } else if (userRole === 'STAGIAIRE') {
      stats = {
        envoyes: await Rapport.countDocuments({ user: userId }),
        brouillons: await Rapport.countDocuments({ user: userId, statut: 'Brouillon' }),
        valides: await Rapport.countDocuments({ user: userId, statut: 'Validé' }),
        corrections: await Rapport.countDocuments({ user: userId, statut: 'Correction demandée' }),
        corriges: await Rapport.countDocuments({ user: userId, statut: 'Corrigé' })
      };
    }

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques', error: error.message });
  }
};

// Route de debug pour vérifier l'encadreur
exports.debugEncadreur = async (req, res) => {
  try {
    const stagiaire = await User.findById(req.user.id);
    
    if (!stagiaire) {
      return res.status(404).json({ message: "Stagiaire non trouvé" });
    }

    let encadreurInfo = null;
    if (stagiaire.encadreur) {
      const encadreur = await User.findById(stagiaire.encadreur);
      if (encadreur) {
        encadreurInfo = {
          id: encadreur._id,
          nom: encadreur.nom,
          prenom: encadreur.prenom,
          role: encadreur.role,
          email: encadreur.email
        };
      }
    }

    res.json({
      stagiaire: {
        id: stagiaire._id,
        nom: stagiaire.nom,
        prenom: stagiaire.prenom,
        role: stagiaire.role,
        encadreur: encadreurInfo
      }
    });

  } catch (error) {
    console.error('❌ Erreur debug encadreur:', error);
    res.status(500).json({ 
      error: error.message
    });
  }
};