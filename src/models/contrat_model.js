// models/contrat_model.js - AVEC CHAMPS DE RENOUVELLEMENT
const mongoose = require("mongoose");

const contratSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  typeContrat: { 
    type: String, 
    enum: ["CDI", "CDD", "Alternance"],
    required: true 
  },
  dateDebut: { 
    type: Date, 
    required: true 
  },
  dateFin: { 
    type: Date
  },
  statut: { 
    type: String, 
    enum: ["Actif", "Terminé", "Suspendu", "Résilié", "À renouveler"],
    default: "Actif", 
  },
  salaire: { 
    type: Number, 
    required: function () {
      return this.typeContrat !== "Stage";
    },
    min: 0,
  },
  service: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Service", 
    required: true,
  },
  poste: { 
    type: String,
    required: function () {
      return this.typeContrat !== "Stage";
    },
    trim: true,
  },
  // NOUVEAUX CHAMPS POUR LE RENOUVELLEMENT
  estRenouvelement: {
    type: Boolean,
    default: false
  },
  contratOriginal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contrat"
  },
  raisonRenouvellement: {
    type: String,
    trim: true
  },
  historiqueRenouvellements: [{
    dateRenouvellement: Date,
    ancienContratId: mongoose.Schema.Types.ObjectId,
    nouveauContratId: mongoose.Schema.Types.ObjectId,
    raison: String
  }]
}, { timestamps: true });

contratSchema.index({ user: 1, dateDebut: -1 });
contratSchema.index({ service: 1 });
contratSchema.index({ statut: 1 });
contratSchema.index({ estRenouvelement: 1 });

module.exports = mongoose.model("Contrat", contratSchema);