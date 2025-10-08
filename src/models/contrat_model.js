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
    enum: ["CDI", "CDD", "Alternance", "Stage"],
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
    enum: ["Actif", "Terminé", "Suspendu", "Résilié"],
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
}, { timestamps: true });

contratSchema.index({ user: 1, dateDebut: -1 });
contratSchema.index({ service: 1 });
contratSchema.index({ statut: 1 });

module.exports = mongoose.model("Contrat", contratSchema);