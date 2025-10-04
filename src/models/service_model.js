// models/service_model.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    nomService: {
        type: String,
        required: true,
        unique: true, // ✅ Ajout pour éviter les doublons
        trim: true,
        uppercase: true // ✅ Recommandé pour la cohérence
    },
    description: {
        type: String,
        trim: true
    },
    postes: [{ 
        type: String,
        trim: true,
        uppercase: true // ✅ Cohérence avec nomService
    }],
    responsable: { // ✅ Ajout recommandé
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    actif: { // ✅ Pour soft delete
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true 
});

// ✅ Index pour améliorer les performances
serviceSchema.index({ nomService: 1 });

module.exports = mongoose.model('Service', serviceSchema);