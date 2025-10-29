const mongoose = require('mongoose');

const attestationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  typeAttestation: {
    type: String,
    enum: ['Travail', 'Salaire', 'Stage', 'Autre'],
    required: true
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  statut: {
    type: String,
    enum: ['En Attente', 'Approuvé', 'Rejeté', 'Automatique'],
    default: 'En Attente'
  },
  contenu: {
    type: String,
    trim: true
  },
  generePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin RH ou système
  }
}, { timestamps: true });

module.exports = mongoose.model('Attestation', attestationSchema);
