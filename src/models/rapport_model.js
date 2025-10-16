const mongoose = require('mongoose');

const rapportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis']
  },
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    minlength: [3, 'Le titre doit contenir au moins 3 caractères'],
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
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
      required: [true, 'L\'URL du fichier est requise']
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
  statut: {
    type: String,
    enum: {
      values: ['Brouillon', 'Publié', 'Archivé'],
      message: 'Le statut doit être: Brouillon, Publié ou Archivé'
    },
    default: 'Brouillon'
  }
}, { 
  timestamps: true 
});

// Index pour améliorer les performances
rapportSchema.index({ user: 1, createdAt: -1 });
rapportSchema.index({ statut: 1 });

module.exports = mongoose.model('Rapport', rapportSchema);