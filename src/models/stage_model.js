// models/stage_model.js
const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
    stagiaire: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    encadreur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sujet: {
        type: String,
        required: true
    },
    dateDebut: {
        type: Date,
        required: true
    },
    dateFin: {
        type: Date,
        required: true
    },
    statut: {
        type: String,
        enum: ['Proposé', 'En attente', 'Confirmé', 'En cours', 'Terminé', 'Annulé', 'Rejeté'],
        default: 'Proposé'  // ✅ Changé de 'En attente' à 'Proposé'
    },
    confirmationEncadreur: {
        statut: {
            type: String,
            enum: ['en_attente', 'confirmé', 'rejeté'],
            default: 'en_attente'
        },
        dateConfirmation: Date,
        motifRejet: String,
        commentaires: String
    },
    theme: {
        type: String,
        trim: true
    },
    competencesRequises: [{
        type: String,
        trim: true
    }],
    objectifs: [{
        type: String,
        trim: true
    }]
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Stage', stageSchema);