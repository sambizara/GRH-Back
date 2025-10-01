const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
    stagiaire : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    encadreur : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sujet : {
        type: String,   
        required: true
    },
    dateDebut : {
        type: Date,
        required: true
    },
    dateFin : {
        type: Date,
        required: true  
    },
    statut : {
        type: String,
        enum: ['En cours', 'Terminé', 'Annulé'],
        default: 'En cours'
    }
}, { timestamps: true });

module.exports = mongoose.model('Stage', stageSchema);