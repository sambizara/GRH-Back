// models/user_model.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const options = { discriminatorKey: "role", timestamps: true };

// --- Schéma de base User ---
const baseSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  prenom: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /.+\@.+\..+/
  },
  sexe: { type: String, enum: ["Homme", "Femme"], required: true },
  dateNaissance: { type: Date, required: true },
  telephone: { type: String, trim: true },
  adresse: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["ADMIN_RH", "SALARIE", "STAGIAIRE"],
    required: true
  },
  actif: { type: Boolean, default: true }
}, options);

// --- Middleware : hash du mot de passe ---
baseSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// --- Méthode pour comparer les mots de passe ---
baseSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// --- Modèle principal User ---
const User = mongoose.model("User", baseSchema);

// --- Schéma pour Salarié ---
const salarieSchema = new mongoose.Schema({
  dateEmbauche: { type: Date, required: true },
  matricule: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  situationFamiliale: { 
    type: String, 
    enum: ["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf(ve)"], 
    default: "Célibataire" 
  },
  nombreEnfants: { type: Number, default: 0 }
}, options);

// --- Schéma pour Stagiaire ---
const stagiaireSchema = new mongoose.Schema({
  ecole: { type: String, required: true },
  filiere: { type: String, required: true },
  niveau: { 
    type: String, 
    enum: ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2", "Doctorat"],
    required: true 
  },
  dateDebutStage: { type: Date, required: true },
  dateFinStage: { type: Date, required: true },
  tuteur: { type: String, trim: true }
}, options);

// --- Discriminators ---
const Salarie = User.discriminator("SALARIE", salarieSchema);
const Stagiaire = User.discriminator("STAGIAIRE", stagiaireSchema);

module.exports = { User, Salarie, Stagiaire };