const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user_model");

// 🔹 Enregistrement (optionnel : surtout utile pour ADMIN_RH ou premier compte)
exports.register = async (req, res) => {
  const { nom, prenom, email, password, sexe, dateNaissance, adresse, role } = req.body;

  try {
    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Création nouvel utilisateur (par défaut User simple)
    const newUser = new User({
      nom,
      prenom,
      email,
      password,
      sexe,
      dateNaissance,
      adresse,
      role: role || "ADMIN_RH" // par défaut si tu veux créer ton premier admin
    });

    await newUser.save();

    res.status(201).json({ message: "Utilisateur enregistré avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message || error });
  }
};

// 🔹 Connexion
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: user._id.toString(), 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log("🔑 Token généré pour:", {
      id: user._id.toString(),
      role: user.role,
      email: user.email
    });

    // Retourner token + infos utiles
    res.status(200).json({
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message || error });
  }
};

// 🔹 Vérifier le mot de passe actuel
exports.verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    console.log("🔐 Vérification du mot de passe pour l'utilisateur:", req.user.id);
    console.log("📝 Mot de passe reçu:", password ? `Longueur: ${password.length} caractères` : "Non fourni");
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log("❌ Utilisateur non trouvé");
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    console.log("🔍 Comparaison avec le mot de passe hashé de l'utilisateur:", user.email);
    
    // Vérifier le mot de passe avec bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    
    console.log("✅ Résultat de la comparaison:", isMatch);
    
    res.status(200).json({ isValid: isMatch });
  } catch (error) {
    console.error("❌ Erreur vérification mot de passe:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};