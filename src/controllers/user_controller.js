// controllers/user_controller.js
const { User, Salarie, Stagiaire } = require("../models/user_model");
const Contrat = require("../models/contrat_model");
const Stage = require("../models/stage_model");
const bcrypt = require("bcryptjs");

// 🔹 Vérifier si un salarié peut être encadreur (a un contrat actif)
const verifierEncadreur = async (encadreurId) => {
  if (!encadreurId) return true; // Encadreur optionnel
  
  const encadreur = await User.findById(encadreurId);
  if (!encadreur || encadreur.role !== "SALARIE") {
    throw new Error("L'encadreur doit être un salarié existant");
  }

  // Vérifier si le salarié a un contrat actif
  const contratActif = await Contrat.findOne({ 
    user: encadreurId, 
    statut: 'Actif'
  });

  if (!contratActif) {
    throw new Error("Le salarié sélectionné n'a pas de contrat actif");
  }

  return true;
};

// 🔹 Récupérer les salariés disponibles (avec contrat actif) - UNIQUE FONCTION
exports.getSalariesDisponibles = async (req, res) => {
  try {
    // Récupérer tous les salariés actifs
    const tousLesSalaries = await Salarie.find({ actif: true })
      .select('nom prenom matricule email telephone dateEmbauche')
      .sort({ nom: 1, prenom: 1 });

    if (tousLesSalaries.length === 0) {
      return res.status(200).json({
        success: true,
        salaries: [],
        total: 0,
        message: "Aucun salarié trouvé"
      });
    }

    // Récupérer les contrats actifs pour ces salariés
    const contratsActifs = await Contrat.find({ 
      statut: 'Actif',
      user: { $in: tousLesSalaries.map(s => s._id) }
    })
    .populate('user', 'nom prenom')
    .populate('service', 'nomService');

    // Créer un Map des IDs des salariés avec contrat actif
    const salarieAvecContrat = new Map();
    contratsActifs.forEach(contrat => {
      if (contrat.user) {
        salarieAvecContrat.set(contrat.user._id.toString(), {
          contratId: contrat._id,
          typeContrat: contrat.typeContrat,
          dateDebut: contrat.dateDebut,
          dateFin: contrat.dateFin,
          posteContrat: contrat.poste,
          salaire: contrat.salaire,
          service: contrat.service
        });
      }
    });

    // Filtrer les salariés pour ne garder que ceux avec contrat actif
    const salariesDisponibles = tousLesSalaries.filter(s => 
      salarieAvecContrat.has(s._id.toString())
    ).map(salarie => {
      const infoContrat = salarieAvecContrat.get(salarie._id.toString());
      return {
        _id: salarie._id,
        nom: salarie.nom,
        prenom: salarie.prenom,
        matricule: salarie.matricule,
        email: salarie.email,
        telephone: salarie.telephone,
        dateEmbauche: salarie.dateEmbauche,
        // Informations du contrat
        contratId: infoContrat.contratId,
        typeContrat: infoContrat.typeContrat,
        dateDebutContrat: infoContrat.dateDebut,
        dateFinContrat: infoContrat.dateFin,
        salaire: infoContrat.salaire,
        service: infoContrat.service,
        posteActuel: infoContrat.posteContrat
      };
    });

    console.log(`📊 ${salariesDisponibles.length}/${tousLesSalaries.length} salariés disponibles (avec contrat actif)`);

    res.status(200).json({
      success: true,
      salaries: salariesDisponibles,
      total: salariesDisponibles.length,
      message: salariesDisponibles.length === 0 
        ? "Aucun salarié avec contrat actif trouvé" 
        : `${salariesDisponibles.length} salarié(s) disponible(s) trouvé(s)`
    });
  } catch (error) {
    console.error("❌ Erreur récupération salariés disponibles:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur lors de la récupération des salariés disponibles", 
      error: error.message 
    });
  }
};

// 🔹 Ajouter un nouvel utilisateur
exports.createUser = async (req, res) => {
  try {
    const { nom, prenom, email, password, sexe, dateNaissance, telephone, adresse, role } = req.body;

    // Vérifier si email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Validation du rôle
    if (!["ADMIN_RH", "SALARIE", "STAGIAIRE"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide." });
    }

    let newUser;

    if (role === "SALARIE") {
      const { dateEmbauche, matricule, situationFamiliale, nombreEnfants } = req.body;
      
      if (!dateEmbauche) {
        return res.status(400).json({ message: "dateEmbauche est obligatoire pour un salarié." });
      }

      if (!matricule) {
        return res.status(400).json({ message: "Le matricule est obligatoire pour un salarié." });
      }

      // Vérifier si le matricule existe déjà
      const existingMatricule = await Salarie.findOne({ matricule });
      if (existingMatricule) {
        return res.status(400).json({ message: "Matricule déjà utilisé" });
      }
      
      newUser = new Salarie({ 
        nom, prenom, email, password, sexe, dateNaissance, telephone, adresse, 
        dateEmbauche, matricule, situationFamiliale, nombreEnfants 
      });
    } 
    else if (role === "STAGIAIRE") {
      const { ecole, filiere, niveau, dureeStage, encadreur, poste } = req.body;
      
      if (!ecole || !filiere || !niveau || !dureeStage || !encadreur) {
        return res.status(400).json({ 
          message: "ecole, filiere, niveau, dureeStage et encadreur sont obligatoires pour un stagiaire." 
        });
      }

      // Vérifier si l'encadreur existe et a un contrat actif
      if (encadreur) {
        await verifierEncadreur(encadreur);
      }
      
      newUser = new Stagiaire({ 
        nom, prenom, email, password, sexe, dateNaissance, telephone, adresse, 
        ecole, filiere, niveau, dureeStage, encadreur, poste,
        statutConfirmation: 'en_attente'
      });

      await newUser.save();

      // 🔹 CRÉATION AUTOMATIQUE DU STAGE quand on crée un stagiaire
      const stage = new Stage({
        stagiaire: newUser._id,
        encadreur: encadreur,
        sujet: `Stage en ${poste || 'développement'} - ${filiere}`,
        dateDebut: new Date(),
        dateFin: new Date(new Date().setMonth(new Date().getMonth() + parseInt(dureeStage))),
        statut: 'En attente',
        confirmationEncadreur: {
          statut: 'en_attente'
        },
        objectifs: [
          `Acquérir des compétences en ${poste || 'développement'}`,
          `Mettre en pratique les connaissances acquises en ${filiere}`,
          `Contribuer aux projets de l'entreprise`
        ],
        descriptifs: [
          `Stage de ${dureeStage} mois en ${poste || 'développement'}`,
          `Étudiant en ${niveau} - ${filiere}`
        ]
      });

      await stage.save();
      console.log("✅ Stage créé automatiquement pour le stagiaire:", newUser._id);

      return res.status(201).json({ 
        message: "Stagiaire créé avec succès", 
        user: newUser,
        stage: stage 
      });
    } 
    else {
      // ADMIN_RH
      newUser = new User({ 
        nom, prenom, email, password, sexe, dateNaissance, telephone, adresse, role 
      });
    }

    await newUser.save();
    
    res.status(201).json({ 
      message: "Utilisateur créé avec succès", 
      user: newUser 
    });
  } catch (error) {
    console.error("❌ Erreur création utilisateur:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

// 🔹 Récupérer tous les utilisateurs (seulement les actifs)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ actif: true }).select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Erreur récupération utilisateurs:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

// 🔹 Récupérer un utilisateur par ID (seulement si actif)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, actif: true }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Erreur récupération utilisateur:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

// 🔹 Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const userId = req.params.id;

    // Empêcher la modification du rôle et email
    delete updateData.role;
    delete updateData.email;

    // Récupérer l'utilisateur pour connaître son type
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Hasher le mot de passe si fourni
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    let updatedUser;

    // Utiliser le modèle approprié selon le rôle
    if (existingUser.role === "SALARIE") {
      // Pour Salarié, utiliser le modèle Salarie
      updatedUser = await Salarie.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select("-password");
    } else if (existingUser.role === "STAGIAIRE") {
      // Pour Stagiaire, utiliser le modèle Stagiaire
      updatedUser = await Stagiaire.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select("-password");
    } else {
      // Pour ADMIN_RH, utiliser le modèle User de base
      updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select("-password");
    }

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({ 
      message: "Utilisateur mis à jour avec succès", 
      user: updatedUser 
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour:", error);
    
    // Gestion spécifique des erreurs de duplication
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.matricule) {
        return res.status(400).json({ message: "Ce matricule est déjà utilisé" });
      }
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }
    }
    
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

// 🔹 Supprimer un utilisateur (soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`🗑️ Tentative de suppression de l'utilisateur: ${userId}`);
    
    // Vérifier d'abord si l'utilisateur existe
    const userExist = await User.findById(userId);
    if (!userExist) {
      console.log(`❌ Utilisateur ${userId} non trouvé`);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    console.log(`📋 Utilisateur trouvé: ${userExist.nom} ${userExist.prenom} (${userExist.role})`);

    // Soft delete - marquer comme inactif
    const user = await User.findByIdAndUpdate(
      userId,
      { actif: false },
      { new: true }
    );

    if (!user) {
      console.log(`❌ Échec de la mise à jour de l'utilisateur ${userId}`);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    console.log(`✅ Utilisateur ${userId} désactivé avec succès`);

    res.status(200).json({ 
      success: true,
      message: "Utilisateur désactivé avec succès",
      user: {
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        actif: user.actif
      }
    });
  } catch (error) {
    console.error("❌ Erreur suppression:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur lors de la suppression", 
      error: error.message 
    });
  }
};

// 🔹 Réactiver un utilisateur
exports.activateUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      { actif: true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({ 
      message: "Utilisateur réactivé avec succès", 
      user 
    });
  } catch (error) {
    console.error("❌ Erreur activation:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

// 🔹 Récupérer l'utilisateur connecté
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Erreur récupération profil:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

// 🔹 Mettre à jour l'utilisateur connecté
exports.updateCurrentUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    // Empêcher la modification de champs sensibles
    const forbiddenFields = ["role", "dateEmbauche", "dateNaissance", "sexe", "email", "matricule"];
    forbiddenFields.forEach(field => delete updateData[field]);

    // Hasher le mot de passe si fourni
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id, 
      updateData, 
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({ 
      message: "Profil mis à jour avec succès", 
      user 
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour profil:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

// 🔹 Récupérer les utilisateurs désactivés (optionnel)
exports.getUsersDesactives = async (req, res) => {
  try {
    const users = await User.find({ actif: false }).select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Erreur récupération utilisateurs désactivés:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};