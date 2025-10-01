const mongoose = require('mongoose');

const congeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    typeConge: {
        type: String,
        enum: ['Annuel', 'Maladie', 'Sans Solde', 'Maternité', 'Paternité'],
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
        enum: ['En Attente', 'Approuvé', 'Rejeté'],
        default: 'En Attente'
    },
    motif: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Conge', congeSchema);