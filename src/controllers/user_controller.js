// controllers/user_controller.js
const { User, Salarie, Stagiaire } = require("../models/user_model");
const Service = require("../models/service_model"); // Ajouter cette ligne
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
      const { ecole, filiere, niveau, dureeStage, poste } = req.body;
      
      if (!ecole || !filiere || !niveau || !dureeStage || !poste) {
        return res.status(400).json({ 
          message: "ecole, filiere, niveau, dureeStage et poste sont obligatoires pour un stagiaire." 
        });
      }

      // VÉRIFICATION DU POSTE - NOUVEAU
      // Récupérer tous les services pour vérifier si le poste existe
      const services = await Service.find({ actif: true });
      const postesExistants = services.flatMap(service => service.postes || []);
      
      if (!postesExistants.includes(poste.toUpperCase())) {
        return res.status(400).json({ 
          message: `Le poste "${poste}" n'existe pas. Postes disponibles: ${postesExistants.join(', ')}` 
        });
      }
      
      newUser = new Stagiaire({ 
        nom, prenom, email, password, sexe, dateNaissance, telephone, adresse, 
        ecole, filiere, niveau, dureeStage, poste: poste.toUpperCase() 
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

// 🔹 Récupérer tous les utilisateurs
exports.getUsers = async (req, res) => {
  try {
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
    const userId = req.params.id;

    // Empêcher la modification du rôle et email
    delete updateData.role;
    delete updateData.email;

    // Récupérer l'utilisateur pour connaître son type
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // VÉRIFICATION DU POSTE POUR STAGIAIRE - NOUVEAU
    if (existingUser.role === "STAGIAIRE" && updateData.poste) {
      const services = await Service.find({ actif: true });
      const postesExistants = services.flatMap(service => service.postes || []);
      
      if (!postesExistants.includes(updateData.poste.toUpperCase())) {
        return res.status(400).json({ 
          message: `Le poste "${updateData.poste}" n'existe pas. Postes disponibles: ${postesExistants.join(', ')}` 
        });
      }
      updateData.poste = updateData.poste.toUpperCase();
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