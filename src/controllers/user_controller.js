// controllers/user_controller.js
const { User, Salarie, Stagiaire } = require("../models/user_model");
const bcrypt = require("bcryptjs");

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

    // ✅ CORRECTION: Supprimé les références à service et poste qui n'existent pas dans le modèle
    if (role === "SALARIE") {
      const { dateEmbauche, matricule, situationFamiliale, nombreEnfants } = req.body;
      
      if (!dateEmbauche) {
        return res.status(400).json({ message: "dateEmbauche est obligatoire pour un salarié." });
      }

      // ✅ CORRECTION: Génération automatique du matricule si non fourni
      const finalMatricule = matricule || `SAL${Date.now()}`;
      
      newUser = new Salarie({ 
        nom, prenom, email, password, sexe, dateNaissance, telephone, adresse, 
        dateEmbauche, matricule: finalMatricule, situationFamiliale, nombreEnfants 
      });
    } 
    else if (role === "STAGIAIRE") {
      const { ecole, filiere, niveau, dateDebutStage, dateFinStage, tuteur } = req.body;
      
      if (!ecole || !filiere || !niveau || !dateDebutStage || !dateFinStage) {
        return res.status(400).json({ 
          message: "ecole, filiere, niveau, dateDebutStage et dateFinStage sont obligatoires pour un stagiaire." 
        });
      }
      
      newUser = new Stagiaire({ 
        nom, prenom, email, password, sexe, dateNaissance, telephone, adresse, 
        ecole, filiere, niveau, dateDebutStage, dateFinStage, tuteur 
      });
    } 
    else {
      // ADMIN_RH
      newUser = new User({ 
        nom, prenom, email, password, sexe, dateNaissance, telephone, adresse, role 
      });
    }

    await newUser.save();
    
    // ✅ CORRECTION: Supprimé le populate qui causait une erreur
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

// 🔹 Récupérer tous les utilisateurs
exports.getUsers = async (req, res) => {
  try {
    // ✅ CORRECTION: Supprimé le populate qui causait une erreur
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Erreur récupération utilisateurs:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

// 🔹 Récupérer un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    // ✅ CORRECTION: Supprimé le populate
    const user = await User.findById(req.params.id).select("-password");
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

    // Empêcher la modification du rôle et email
    delete updateData.role;
    delete updateData.email;

    // Hasher le mot de passe si fourni
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // ✅ CORRECTION: Utilisation de findOneAndUpdate pour éviter les problèmes de discriminator
    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({ 
      message: "Utilisateur mis à jour avec succès", 
      user 
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

// 🔹 Supprimer un utilisateur (soft delete)
exports.deleteUser = async (req, res) => {
  try {
    // ✅ AMÉLIORATION: Soft delete au lieu de suppression physique
    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      { actif: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({ 
      message: "Utilisateur désactivé avec succès" 
    });
  } catch (error) {
    console.error("❌ Erreur suppression:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
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