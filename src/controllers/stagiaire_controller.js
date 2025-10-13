// controllers/stagiaire_controller.js
const User = require('../models/user_model');
const Stage = require('../models/stage_model');
const Notification = require('../models/notification_model');

// 🔹 Récupérer les stagiaires en attente de confirmation (pour les salariés)
exports.getStagiairesEnAttente = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un salarié
    if (req.user.role !== 'SALARIE') {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux salariés"
      });
    }

    // Récupérer le poste du salarié
    const salarie = await User.findById(req.user.id);
    
    // Trouver les stagiaires avec le même poste et en attente de confirmation
    const stagiaires = await User.find({
      role: 'STAGIAIRE',
      poste: salarie.poste,
      statutConfirmation: 'en_attente',
      actif: true
    })
    .select('nom prenom email ecole filiere niveau dureeStage poste telephone dateNaissance adresse')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: stagiaires.length,
      stagiaires
    });

  } catch (error) {
    console.error("❌ Erreur récupération stagiaires en attente:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des stagiaires en attente",
      error: error.message
    });
  }
};

// 🔹 Confirmer un stagiaire et créer son stage
exports.confirmerStagiaire = async (req, res) => {
  try {
    const { stagiaireId } = req.params;
    const { theme, competencesRequises, objectifs, dateDebut, dateFin, commentaires } = req.body;

    // Vérifier que l'utilisateur est un salarié
    if (req.user.role !== 'SALARIE') {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux salariés"
      });
    }

    // Vérifier les données obligatoires
    if (!theme || !dateDebut || !dateFin) {
      return res.status(400).json({
        success: false,
        message: "Le thème, la date de début et la date de fin sont obligatoires"
      });
    }

    // Vérifier les dates
    if (new Date(dateDebut) >= new Date(dateFin)) {
      return res.status(400).json({
        success: false,
        message: "La date de fin doit être postérieure à la date de début"
      });
    }

    // Récupérer le stagiaire
    const stagiaire = await User.findById(stagiaireId);
    if (!stagiaire || stagiaire.role !== 'STAGIAIRE') {
      return res.status(404).json({
        success: false,
        message: "Stagiaire non trouvé"
      });
    }

    // Récupérer le salarié
    const salarie = await User.findById(req.user.id);

    // Vérifier que le stagiaire a le même poste que le salarié
    if (stagiaire.poste !== salarie.poste) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez encadrer que les stagiaires de votre poste"
      });
    }

    // Vérifier que le stagiaire est en attente de confirmation
    if (stagiaire.statutConfirmation !== 'en_attente') {
      return res.status(400).json({
        success: false,
        message: "Ce stagiaire a déjà été traité"
      });
    }

    // Vérifier s'il n'y a pas déjà un stage pour ce stagiaire
    const stageExistant = await Stage.findOne({
      stagiaire: stagiaireId,
      statut: { $in: ['En attente', 'Confirmé', 'En cours'] }
    });

    if (stageExistant) {
      return res.status(400).json({
        success: false,
        message: "Ce stagiaire a déjà un stage en cours"
      });
    }

    // Mettre à jour le statut du stagiaire
    stagiaire.statutConfirmation = 'confirmé';
    stagiaire.encadreur = req.user.id;
    stagiaire.dateConfirmation = new Date();
    stagiaire.commentairesEncadreur = commentaires;
    await stagiaire.save();

    // Créer le stage
    const nouveauStage = new Stage({
      stagiaire: stagiaireId,
      encadreur: req.user.id,
      sujet: theme,
      theme: theme,
      competencesRequises: competencesRequises || [],
      objectifs: objectifs || [],
      dateDebut,
      dateFin,
      statut: 'Confirmé',
      confirmationEncadreur: {
        statut: 'confirmé',
        dateConfirmation: new Date(),
        commentaires: commentaires
      }
    });

    await nouveauStage.save();

    // Populer les données pour la réponse
    const stagePopule = await Stage.findById(nouveauStage._id)
      .populate('stagiaire', 'nom prenom email ecole filiere niveau poste dureeStage')
      .populate('encadreur', 'nom prenom email role matricule');

    // Notification au stagiaire
    const notificationStagiaire = new Notification({
      user: stagiaireId,
      type: 'Stage confirmé',
      message: `Votre stage a été confirmé par ${salarie.prenom} ${salarie.nom}. Thème: ${theme}`
    });
    await notificationStagiaire.save();

    res.status(200).json({
      success: true,
      message: "Stagiaire confirmé et stage créé avec succès",
      stage: stagePopule
    });

  } catch (error) {
    console.error("❌ Erreur confirmation stagiaire:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la confirmation du stagiaire",
      error: error.message
    });
  }
};

// 🔹 Rejeter un stagiaire
exports.rejeterStagiaire = async (req, res) => {
  try {
    const { stagiaireId } = req.params;
    const { motifRejet, commentaires } = req.body;

    if (!motifRejet) {
      return res.status(400).json({
        success: false,
        message: "Le motif du rejet est obligatoire"
      });
    }

    // Vérifier que l'utilisateur est un salarié
    if (req.user.role !== 'SALARIE') {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux salariés"
      });
    }

    // Récupérer le stagiaire
    const stagiaire = await User.findById(stagiaireId);
    if (!stagiaire || stagiaire.role !== 'STAGIAIRE') {
      return res.status(404).json({
        success: false,
        message: "Stagiaire non trouvé"
      });
    }

    // Récupérer le salarié
    const salarie = await User.findById(req.user.id);

    // Vérifier que le stagiaire a le même poste que le salarié
    if (stagiaire.poste !== salarie.poste) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez traiter que les stagiaires de votre poste"
      });
    }

    // Vérifier que le stagiaire est en attente de confirmation
    if (stagiaire.statutConfirmation !== 'en_attente') {
      return res.status(400).json({
        success: false,
        message: "Ce stagiaire a déjà été traité"
      });
    }

    // Mettre à jour le statut du stagiaire
    stagiaire.statutConfirmation = 'rejeté';
    stagiaire.dateConfirmation = new Date();
    stagiaire.motifRejet = motifRejet;
    stagiaire.commentairesEncadreur = commentaires;
    await stagiaire.save();

    // Notification au stagiaire
    const notificationStagiaire = new Notification({
      user: stagiaireId,
      type: 'Candidature rejetée',
      message: `Votre candidature pour le poste ${stagiaire.poste} a été rejetée par ${salarie.prenom} ${salarie.nom}. Motif: ${motifRejet}`
    });
    await notificationStagiaire.save();

    // Notification à l'admin RH
    const adminRH = await User.findOne({ role: 'ADMIN_RH' });
    if (adminRH) {
      const notificationAdmin = new Notification({
        user: adminRH._id,
        type: 'Stagiaire rejeté',
        message: `Le stagiaire ${stagiaire.prenom} ${stagiaire.nom} a été rejeté par ${salarie.prenom} ${salarie.nom} pour le poste ${stagiaire.poste}. Motif: ${motifRejet}`
      });
      await notificationAdmin.save();
    }

    res.status(200).json({
      success: true,
      message: "Stagiaire rejeté avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur rejet stagiaire:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du rejet du stagiaire",
      error: error.message
    });
  }
};

// 🔹 Récupérer l'historique des confirmations/rejets
exports.getHistoriqueConfirmations = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un salarié
    if (req.user.role !== 'SALARIE') {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux salariés"
      });
    }

    // Récupérer le salarié
    const salarie = await User.findById(req.user.id);

    // Trouver les stagiaires traités par ce salarié
    const stagiaires = await User.find({
      role: 'STAGIAIRE',
      poste: salarie.poste,
      statutConfirmation: { $in: ['confirmé', 'rejeté'] },
      $or: [
        { encadreur: req.user.id },
        { dateConfirmation: { $exists: true } }
      ]
    })
    .select('nom prenom email ecole filiere niveau dureeStage poste statutConfirmation dateConfirmation motifRejet commentairesEncadreur')
    .sort({ dateConfirmation: -1 });

    res.status(200).json({
      success: true,
      count: stagiaires.length,
      stagiaires
    });

  } catch (error) {
    console.error("❌ Erreur récupération historique:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique",
      error: error.message
    });
  }
};

// 🔹 Récupérer mes stagiaires encadrés (pour les salariés)
exports.getMesStagiairesEncadres = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un salarié
    if (req.user.role !== 'SALARIE') {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux salariés"
      });
    }

    // Trouver les stagiaires confirmés par ce salarié
    const stagiaires = await User.find({
      role: 'STAGIAIRE',
      encadreur: req.user.id,
      statutConfirmation: 'confirmé',
      actif: true
    })
    .select('nom prenom email ecole filiere niveau dureeStage poste dateConfirmation')
    .sort({ dateConfirmation: -1 });

    res.status(200).json({
      success: true,
      count: stagiaires.length,
      stagiaires
    });

  } catch (error) {
    console.error("❌ Erreur récupération stagiaires encadrés:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des stagiaires encadrés",
      error: error.message
    });
  }
};