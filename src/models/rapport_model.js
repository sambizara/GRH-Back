const mongoose = require('mongoose');

const rapportSchema = new mongoose.Schema({
  // Auteur du rapport (stagiaire)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "L'auteur du rapport est requis"]
  },
  // Encadrant (salarié destinataire)
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le destinataire est requis']
  },
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    minlength: [3, 'Le titre doit contenir au moins 3 caractères'],
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
  },
  description: {
    type: String,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères'],
    trim: true
  },
  dateDepot: {
    type: Date,
    default: Date.now
  },
  fichier: {
    nom: {
      type: String,
      required: [true, 'Le nom du fichier est requis']
    },
    url: {
      type: String,
      required: [true, "L'URL du fichier est requise"]
    },
    taille: {
      type: Number,
      required: [true, 'La taille du fichier est requise'],
      min: [1, 'La taille du fichier doit être supérieure à 0']
    },
    type: {
      type: String,
      required: [true, 'Le type de fichier est requis']
    }
  },
  commentaireEncadrant: {
    type: String,
    trim: true,
    maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères']
  },
  statut: {
    type: String,
    enum: {
      values: ['Brouillon', 'Envoyé', 'Lu', 'Validé', 'Archivé', 'Correction demandée', 'Corrigé'],
      message: 'Le statut doit être: Brouillon, Envoyé, Lu, Validé, Archivé, Correction demandée ou Corrigé'
    },
    default: 'Brouillon'
  },
  dateLecture: Date,
  dateValidation: Date,
  
  // NOUVEAU : Système de remarques
  remarques: [{
    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['remarque', 'correction', 'suggestion', 'validation'],
      default: 'remarque'
    }
  }],
  
  // NOUVEAU : Suivi des versions
  version: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

// Index
rapportSchema.index({ user: 1, createdAt: -1 });
rapportSchema.index({ destinataire: 1, createdAt: -1 });
rapportSchema.index({ statut: 1 });

// Méthode pour marquer comme lu
rapportSchema.methods.marquerCommeLu = function() {
  this.statut = 'Lu';
  this.dateLecture = new Date();
  return this.save();
};

module.exports = mongoose.model('Rapport', rapportSchema);