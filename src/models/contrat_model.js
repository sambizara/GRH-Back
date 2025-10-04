// models/contrat_model.js
const mongoose = require("mongoose");

const contratSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  typeContrat: { 
    type: String, 
    enum: ["CDI", "CDD", "Alternance", "Stage"], // ✅ Ajout de "Stage"
    required: true 
  },
  dateDebut: { 
    type: Date, 
    required: true 
  },
  dateFin: { 
    type: Date,
    validate: {
      validator: function(value) {
        // ✅ Validation: dateFin doit être après dateDebut
        return !value || value > this.dateDebut;
      },
      message: "La date de fin doit être après la date de début"
    }
  },
  statut: { 
    type: String, 
    enum: ["Actif", "Terminé", "Suspendu", "Résilié"], // ✅ Ajout "Résilié"
    default: "Actif" 
  },
  salaire: { 
    type: Number, 
    required: function() {
      // ✅ Salaire requis seulement pour CDI, CDD, Alternance
      return this.typeContrat !== "Stage";
    },
    min: 0 // ✅ Validation positive
  },
  service: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Service", 
    required: true 
  },
  poste: { 
    type: String,
    required: function() {
      // ✅ Poste requis seulement pour CDI, CDD, Alternance
      return this.typeContrat !== "Stage";
    },
    trim: true,
    uppercase: true
  },
  
  // ✅ AMÉLIORATION: Champs spécifiques pour stagiaires
  dateDebutStage: { 
    type: Date,
    required: function() {
      return this.typeContrat === "Stage";
    }
  },
  dateFinStage: { 
    type: Date,
    required: function() {
      return this.typeContrat === "Stage";
    },
    validate: {
      validator: function(value) {
        return !this.dateDebutStage || value > this.dateDebutStage;
      },
      message: "La date de fin de stage doit être après la date de début"
    }
  },
  tuteurStage: {
    type: String,
    trim: true
  },
  
  // ✅ NOUVEAU: Informations complémentaires
  periodeEssai: {
    duree: { type: Number, default: 0 }, // en jours
    dateFin: { type: Date }
  },
  heuresSemaine: {
    type: Number,
    default: 35
  },
  avantages: [{
    type: String,
    trim: true
  }],
  
  // ✅ Historique et métadonnées
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  actif: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true // ✅ Utilisation des timestamps automatiques
});

// ✅ Middleware pour mettre à jour updatedAt
contratSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

// ✅ Index pour améliorer les performances
contratSchema.index({ user: 1, dateDebut: -1 });
contratSchema.index({ service: 1 });
contratSchema.index({ statut: 1 });

module.exports = mongoose.model("Contrat", contratSchema);