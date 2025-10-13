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
        enum: ['En attente', 'Confirmé', 'En cours', 'Terminé', 'Annulé', 'Rejeté'],
        default: 'En attente'
    },
    // NOUVEAU: Statut de confirmation par l'encadreur
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
    objectifs: [{
        type: String,
        trim: true
    }],
    descriptifs: [{
        type: String,
        trim: true
    }]
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Stage', stageSchema);