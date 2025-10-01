const mongoose = require('mongoose');

const rapportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    titre: {
        type: String,
        required: true
    },
    dateDepot: {
        type: Date,
        default: Date.now
    },
    fichier: {
        type: String,
        required: true
    },
    statut: {
        type: String,
        enum: ['Brouillon', 'Publié', 'Archivé'],
        default: 'Brouillon'
    }
}, { timestamps: true });

module.exports = mongoose.model('Rapport', rapportSchema);