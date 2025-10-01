const mongoose = require('mongoose');

const contratSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    typeContrat: {
        type: String,
        enum: ['CDI', 'CDD', 'Alternance'],
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
        enum: ['Actif', 'Terminé', 'Suspendu'],
        default: 'Actif'
    },
    poste: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Poste',
    },
    salaire: {
        type: Number,
        required: true,
        min: [0, 'Le salaire ne peut pas être négatif']
    }
}, { timestamps: true });

module.exports = mongoose.model('Contrat', contratSchema);