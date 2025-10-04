// controllers/contrat_controller.js
const Contrat = require("../models/contrat_model");
const User = require("../models/user_model");
const Service = require("../models/service_model");

// 🔹 Créer un nouveau contrat
exports.createContrat = async (req, res) => {
  try {
    const { 
      user, typeContrat, dateDebut, dateFin, statut, salaire, 
      service, poste, dateDebutStage, dateFinStage, tuteurStage,
      periodeEssai, heuresSemaine, avantages 
    } = req.body;

    // ✅ Validation des champs obligatoires
    if (!user || !typeContrat || !dateDebut || !service) {
      return res.status(400).json({ 
        success: false,
        message: "user, typeContrat, dateDebut et service sont obligatoires" 
      });
    }

    // ✅ Vérifier que l'utilisateur existe
    const userExists = await User.findById(user);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // ✅ Vérifier que le service existe
    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé"
      });
    }

    // ✅ Validation spécifique selon le type de contrat
    if (typeContrat === "CDD" && !dateFin) {
      return res.status(400).json({ 
        success: false,
        message: "La date de fin est obligatoire pour un CDD" 
      });
    }

    if ((typeContrat === "CDI" || typeContrat === "CDD" || typeContrat === "Alternance") && !poste) {
      return res.status(400).json({ 
        success: false,
        message: "Le poste est obligatoire pour un " + typeContrat 
      });
    }

    if (typeContrat === "Stage") {
      if (!dateDebutStage || !dateFinStage) {
        return res.status(400).json({
          success: false,
          message: "dateDebutStage et dateFinStage sont obligatoires pour un stage"
        });
      }
      if (salaire) {
        return res.status(400).json({
          success: false,
          message: "Un stage ne peut pas avoir de salaire"
        });
      }
    }

    // ✅ Vérifier les conflits de dates
    const contratsExistants = await Contrat.find({
      user: user,
      statut: "Actif",
      $or: [
        { dateDebut: { $lte: dateFin || new Date('2100-01-01') }, dateFin: { $gte: dateDebut } },
        { dateDebut: { $lte: dateFin || new Date('2100-01-01') }, dateFin: null }
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
      dateFin,
      statut: statut || "Actif",
      salaire: typeContrat !== "Stage" ? salaire : undefined,
      service,
      poste: typeContrat !== "Stage" ? poste : undefined,
      dateDebutStage: typeContrat === "Stage" ? dateDebutStage : undefined,
      dateFinStage: typeContrat === "Stage" ? dateFinStage : undefined,
      tuteurStage: typeContrat === "Stage" ? tuteurStage : undefined,
      periodeEssai,
      heuresSemaine: heuresSemaine || 35,
      avantages: avantages || [],
      createdBy: req.user.id // ✅ Qui a créé le contrat
    });

    await nouveauContrat.save();
    
    // ✅ Peupler les références pour la réponse
    await nouveauContrat.populate("user", "nom prenom email role");
    await nouveauContrat.populate("service", "nomService");
    await nouveauContrat.populate("createdBy", "nom prenom");

    res.status(201).json({
      success: true,
      message: "Contrat créé avec succès",
      contrat: nouveauContrat
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

// 🔹 Récupérer tous les contrats (pour admin)
exports.getContrats = async (req, res) => {
  try {
    const { statut, typeContrat, service } = req.query;
    
    // ✅ Filtres optionnels
    const filter = { actif: true };
    if (statut) filter.statut = statut;
    if (typeContrat) filter.typeContrat = typeContrat;
    if (service) filter.service = service;

    const contrats = await Contrat.find(filter)
      .populate("user", "nom prenom email role")
      .populate("service", "nomService")
      .populate("createdBy", "nom prenom")
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

// 🔹 Récupérer un contrat par ID
exports.getContratById = async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id)
      .populate("user", "nom prenom email role dateNaissance telephone adresse")
      .populate("service", "nomService description postes")
      .populate("createdBy", "nom prenom");

    if (!contrat) {
      return res.status(404).json({
        success: false,
        message: "Contrat non trouvé"
      });
    }

    // ✅ Vérifier que l'utilisateur a le droit de voir ce contrat
    if (req.user.role !== "ADMIN_RH" && contrat.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à ce contrat"
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

// 🔹 Récupérer les contrats de l'utilisateur connecté
exports.getMesContrats = async (req, res) => {
  try {
    const userId = req.user.id;

    const contrats = await Contrat.find({ 
      user: userId,
      actif: true 
    })
      .populate("user", "nom prenom email role")
      .populate("service", "nomService")
      .populate("createdBy", "nom prenom")
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

// 🔹 Mettre à jour un contrat
exports.updateContrat = async (req, res) => {
  try {
    const { 
      service, poste, dateDebutStage, dateFinStage, tuteurStage,
      periodeEssai, heuresSemaine, avantages, ...updateData 
    } = req.body;

    // ✅ Empêcher la modification de certains champs
    delete updateData.user;
    delete updateData.createdBy;

    const contrat = await Contrat.findByIdAndUpdate(
      req.params.id,
      { 
        ...updateData, 
        service, 
        poste, 
        dateDebutStage, 
        dateFinStage, 
        tuteurStage,
        periodeEssai,
        heuresSemaine,
        avantages 
      },
      { new: true, runValidators: true }
    )
      .populate("user", "nom prenom email role")
      .populate("service", "nomService")
      .populate("createdBy", "nom prenom");

    if (!contrat) {
      return res.status(404).json({
        success: false,
        message: "Contrat non trouvé"
      });
    }

    res.status(200).json({
      success: true,
      message: "Contrat mis à jour avec succès",
      contrat
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

// 🔹 Supprimer un contrat (soft delete)
exports.deleteContrat = async (req, res) => {
  try {
    const contrat = await Contrat.findByIdAndUpdate(
      req.params.id,
      { actif: false, statut: "Terminé" },
      { new: true }
    );

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

// 🔹 NOUVEAU: Récupérer les contrats actifs d'un service
exports.getContratsByService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const contrats = await Contrat.find({
      service: serviceId,
      statut: "Actif",
      actif: true
    })
      .populate("user", "nom prenom email role poste")
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