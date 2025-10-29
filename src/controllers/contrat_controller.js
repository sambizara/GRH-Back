// controllers/contrat_controller.js - AVEC FONCTIONNALITÉS DE RENOUVELLEMENT
const Contrat = require("../models/contrat_model");
const { User } = require("../models/user_model");
const Service = require("../models/service_model");

// Créer un nouveau contrat
exports.createContrat = async (req, res) => {
  try {
    const { user, typeContrat, dateDebut, dateFin, statut, salaire, service, poste } = req.body;

    console.log("📥 Données reçues:", req.body);

    // Validation des champs obligatoires
    if (!user || !typeContrat || !dateDebut || !service) {
      return res.status(400).json({ 
        success: false,
        message: "Utilisateur, type de contrat, date de début et service sont obligatoires" 
      });
    }

    // Validation conditionnelle
    if (typeContrat !== "Stage") {
      if (!salaire) {
        return res.status(400).json({ 
          success: false,
          message: "Le salaire est obligatoire pour ce type de contrat" 
        });
      }
      if (!poste) {
        return res.status(400).json({ 
          success: false,
          message: "Le poste est obligatoire pour ce type de contrat" 
        });
      }
    }

    // Validation CDD
    if (typeContrat === "CDD" && !dateFin) {
      return res.status(400).json({ 
        success: false,
        message: "La date de fin est obligatoire pour un CDD" 
      });
    }

    // Validation des dates
    if (dateFin && new Date(dateFin) <= new Date(dateDebut)) {
      return res.status(400).json({
        success: false,
        message: "La date de fin doit être après la date de début"
      });
    }

    // Vérifications utilisateur et service
    const userExists = await User.findById(user);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé"
      });
    }

    // Vérifier les conflits de dates
    const contratsExistants = await Contrat.find({
      user: user,
      statut: "Actif",
      $or: [
        { 
          dateDebut: { $lte: dateFin || new Date('2100-01-01') }, 
          dateFin: { $gte: dateDebut } 
        },
        { 
          dateDebut: { $lte: dateFin || new Date('2100-01-01') }, 
          dateFin: null 
        }
      ]
    });

    if (contratsExistants.length > 0) {
      return res.status(400).json({
        success: false,
        message: "L'utilisateur a déjà un contrat actif sur cette période"
      });
    }

    const nouveauContrat = new Contrat({
      user,
      typeContrat,
      dateDebut,
      dateFin: typeContrat === "CDI" ? null : dateFin,
      statut: statut || "Actif",
      salaire: typeContrat !== "Stage" ? salaire : undefined,
      service,
      poste: typeContrat !== "Stage" ? poste : undefined
    });

    await nouveauContrat.save();
    
    const contratPopule = await Contrat.findById(nouveauContrat._id)
      .populate("user", "nom prenom email role matricule")
      .populate("service", "nomService");

    res.status(201).json({
      success: true,
      message: "Contrat créé avec succès",
      contrat: contratPopule
    });
  } catch (error) {
    console.error("❌ Erreur création contrat:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la création du contrat", 
      error: error.message 
    });
  }
};

// Récupérer tous les contrats
exports.getContrats = async (req, res) => {
  try {
    const { statut, typeContrat, service } = req.query;
    
    const filter = {};
    if (statut) filter.statut = statut;
    if (typeContrat) filter.typeContrat = typeContrat;
    if (service) filter.service = service;

    const contrats = await Contrat.find(filter)
      .populate("user", "nom prenom email role matricule")
      .populate("service", "nomService")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contrats.length,
      contrats
    });
  } catch (error) {
    console.error("❌ Erreur récupération contrats:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des contrats", 
      error: error.message 
    });
  }
};

//  Récupérer un contrat par ID
exports.getContratById = async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id)
      .populate("user", "nom prenom email role dateNaissance telephone adresse matricule")
      .populate("service", "nomService description");

    if (!contrat) {
      return res.status(404).json({
        success: false,
        message: "Contrat non trouvé"
      });
    }

    res.status(200).json({
      success: true,
      contrat
    });
  } catch (error) {
    console.error("❌ Erreur récupération contrat:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération du contrat", 
      error: error.message 
    });
  }
};

// Mettre à jour un contrat
exports.updateContrat = async (req, res) => {
  try {
    const { dateDebut, dateFin, typeContrat, ...updateData } = req.body;

    const contrat = await Contrat.findById(req.params.id);
    if (!contrat) {
      return res.status(404).json({
        success: false,
        message: "Contrat non trouvé"
      });
    }

    // Validation manuelle des dates
    if (dateFin && dateDebut) {
      if (new Date(dateFin) <= new Date(dateDebut)) {
        return res.status(400).json({
          success: false,
          message: "La date de fin doit être après la date de début"
        });
      }
    }

    if (dateFin && !dateDebut) {
      if (new Date(dateFin) <= contrat.dateDebut) {
        return res.status(400).json({
          success: false,
          message: "La date de fin doit être après la date de début existante"
        });
      }
    }

    // Mettre à jour les champs
    if (dateDebut) contrat.dateDebut = dateDebut;
    if (dateFin) contrat.dateFin = dateFin;
    if (typeContrat) {
      contrat.typeContrat = typeContrat;
      if (typeContrat === "CDI") {
        contrat.dateFin = null;
      }
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        contrat[key] = updateData[key];
      }
    });

    await contrat.save({ validateBeforeSave: false });

    const contratMisAJour = await Contrat.findById(req.params.id)
      .populate("user", "nom prenom email role matricule")
      .populate("service", "nomService");

    res.status(200).json({
      success: true,
      message: "Contrat mis à jour avec succès",
      contrat: contratMisAJour
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour contrat:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la mise à jour du contrat", 
      error: error.message 
    });
  }
};

// Supprimer un contrat
exports.deleteContrat = async (req, res) => {
  try {
    const contrat = await Contrat.findByIdAndDelete(req.params.id);

    if (!contrat) {
      return res.status(404).json({
        success: false,
        message: "Contrat non trouvé"
      });
    }

    res.status(200).json({
      success: true,
      message: "Contrat supprimé avec succès"
    });
  } catch (error) {
    console.error("❌ Erreur suppression contrat:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la suppression du contrat", 
      error: error.message 
    });
  }
};

// Récupérer les contrats de l'utilisateur connecté
exports.getMesContrats = async (req, res) => {
  try {
    const userId = req.user.id;

    const contrats = await Contrat.find({ user: userId })
      .populate("user", "nom prenom email role")
      .populate("service", "nomService")
      .sort({ dateDebut: -1 });

    res.status(200).json({
      success: true,
      count: contrats.length,
      contrats
    });
  } catch (error) {
    console.error("❌ Erreur récupération mes contrats:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération de vos contrats", 
      error: error.message 
    });
  }
};

// Récupérer les contrats actifs d'un service
exports.getContratsByService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const contrats = await Contrat.find({
      service: serviceId,
      statut: "Actif"
    })
      .populate("user", "nom prenom email role poste matricule")
      .populate("service", "nomService")
      .sort({ "user.nom": 1, "user.prenom": 1 });

    res.status(200).json({
      success: true,
      count: contrats.length,
      contrats
    });
  } catch (error) {
    console.error("❌ Erreur récupération contrats par service:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des contrats", 
      error: error.message 
    });
  }
};

// Renouveler un contrat
exports.renouvelerContrat = async (req, res) => {
  try {
    const { contratId } = req.params;
    const { dateDebut, dateFin, typeContrat, salaire, poste, service, raisonRenouvellement } = req.body;

    console.log(`🔄 Demande de renouvellement pour contrat: ${contratId}`);

    // Vérification des champs obligatoires
    if (!dateDebut) {
      return res.status(400).json({
        success: false,
        message: "La date de début est obligatoire pour le renouvellement"
      });
    }

    if (typeContrat === "CDD" && !dateFin) {
      return res.status(400).json({
        success: false,
        message: "La date de fin est obligatoire pour un CDD"
      });
    }

    // Récupérer le contrat original
    const contratOriginal = await Contrat.findById(contratId)
      .populate("user", "nom prenom email matricule")
      .populate("service", "nomService");

    if (!contratOriginal) {
      return res.status(404).json({
        success: false,
        message: "Contrat original non trouvé"
      });
    }

    if (contratOriginal.typeContrat === "CDI") {
      return res.status(400).json({
        success: false,
        message: "Impossible de renouveler un CDI"
      });
    }

    // Vérifier que l'utilisateur n'a pas déjà un contrat actif sur la période
    const conflitContrat = await Contrat.findOne({
      user: contratOriginal.user._id,
      statut: "Actif",
      _id: { $ne: contratId },
      $or: [
        { 
          dateDebut: { $lte: dateFin || new Date('2100-01-01') }, 
          dateFin: { $gte: dateDebut } 
        },
        { 
          dateDebut: { $lte: dateFin || new Date('2100-01-01') }, 
          dateFin: null 
        }
      ]
    });

    if (conflitContrat) {
      return res.status(400).json({
        success: false,
        message: "L'utilisateur a déjà un contrat actif sur cette période"
      });
    }

    // Marquer l'ancien contrat comme "Terminé"
    contratOriginal.statut = "Terminé";
    await contratOriginal.save();

    // Créer le nouveau contrat (renouvellement)
    const nouveauContrat = new Contrat({
      user: contratOriginal.user._id,
      typeContrat: typeContrat || contratOriginal.typeContrat,
      dateDebut: dateDebut,
      dateFin: typeContrat === "CDI" ? null : dateFin,
      statut: "Actif",
      salaire: salaire || contratOriginal.salaire,
      service: service || contratOriginal.service,
      poste: poste || contratOriginal.poste,
      estRenouvelement: true,
      contratOriginal: contratId,
      raisonRenouvellement: raisonRenouvellement || "Renouvellement standard"
    });

    await nouveauContrat.save();

    // Mettre à jour l'historique des renouvellements
    await Contrat.findByIdAndUpdate(contratId, {
      $push: {
        historiqueRenouvellements: {
          dateRenouvellement: new Date(),
          ancienContratId: contratId,
          nouveauContratId: nouveauContrat._id,
          raison: raisonRenouvellement || "Renouvellement standard"
        }
      }
    });

    // Peupler les données pour la réponse
    const contratPopule = await Contrat.findById(nouveauContrat._id)
      .populate("user", "nom prenom email role matricule")
      .populate("service", "nomService")
      .populate("contratOriginal", "typeContrat dateDebut dateFin");

    console.log(`✅ Contrat renouvelé avec succès. Nouveau contrat: ${nouveauContrat._id}`);

    res.status(200).json({
      success: true,
      message: "Contrat renouvelé avec succès",
      ancienContrat: contratOriginal,
      nouveauContrat: contratPopule
    });

  } catch (error) {
    console.error("❌ Erreur renouvellement contrat:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erreur lors du renouvellement du contrat",
      error: error.message
    });
  }
};

// Vérifier si un contrat peut être renouvelé
exports.verifierRenouvellement = async (req, res) => {
  try {
    const { contratId } = req.params;

    const contrat = await Contrat.findById(contratId);
    
    if (!contrat) {
      return res.status(404).json({
        success: false,
        peutRenouveler: false,
        raison: "Contrat non trouvé"
      });
    }

    if (contrat.typeContrat === "CDI") {
      return res.status(200).json({
        success: true,
        peutRenouveler: false,
        raison: "Un CDI ne peut pas être renouvelé"
      });
    }

    if (contrat.statut !== "Actif") {
      return res.status(200).json({
        success: true,
        peutRenouveler: false,
        raison: "Seuls les contrats actifs peuvent être renouvelés"
      });
    }

    // Vérifier si la date de fin est dans le futur
    if (contrat.dateFin && new Date(contrat.dateFin) < new Date()) {
      return res.status(200).json({
        success: true,
        peutRenouveler: false,
        raison: "Le contrat est déjà expiré"
      });
    }

    res.status(200).json({
      success: true,
      peutRenouveler: true,
      raison: "Peut être renouvelé"
    });

  } catch (error) {
    console.error("❌ Erreur vérification renouvellement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du renouvellement",
      error: error.message
    });
  }
};

//  Obtenir l'historique des renouvellements
exports.getHistoriqueRenouvellements = async (req, res) => {
  try {
    const { contratId } = req.params;

    const contrat = await Contrat.findById(contratId)
      .populate("historiqueRenouvellements.ancienContratId", "typeContrat dateDebut dateFin statut")
      .populate("historiqueRenouvellements.nouveauContratId", "typeContrat dateDebut dateFin statut");

    if (!contrat) {
      return res.status(404).json({
        success: false,
        message: "Contrat non trouvé"
      });
    }

    res.status(200).json({
      success: true,
      historique: contrat.historiqueRenouvellements || []
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

//  Obtenir les contrats éligibles au renouvellement
exports.getContratsEligiblesRenouvellement = async (req, res) => {
  try {
    const aujourdhui = new Date();
    const dans30Jours = new Date(aujourdhui);
    dans30Jours.setDate(aujourdhui.getDate() + 30);

    // Contrats CDD actifs qui expirent dans les 30 prochains jours
    const contratsEligibles = await Contrat.find({
      typeContrat: { $in: ["CDD", "Alternance"] },
      statut: "Actif",
      dateFin: {
        $gte: aujourdhui,
        $lte: dans30Jours
      },
      estRenouvelement: false // Exclure les contrats déjà renouvelés
    })
    .populate("user", "nom prenom email matricule")
    .populate("service", "nomService")
    .sort({ dateFin: 1 });

    res.status(200).json({
      success: true,
      contratsEligibles,
      count: contratsEligibles.length
    });

  } catch (error) {
    console.error("❌ Erreur récupération contrats éligibles:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des contrats éligibles",
      error: error.message
    });
  }
};