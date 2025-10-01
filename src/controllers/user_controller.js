const User = require('../models/user_model');
const bcrypt = require('bcrypt');

// Ajouter un nouvel utilisateur (par un ADMIN_RH)
exports.createUser = async (req, res) => {
    try {
        const { nom, prenom, email, motDePasse, sexe, role , service } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email déjà utilisé' });
        }

        const  sexeOptions = ['Homme', 'Femme'];
        if ((sexe === 'Homme' || sexe === 'Femme') && !sexeOptions.includes(sexe)) {
            return res.status(400).json({ message: 'Le champ sexe doit être Homme ou Femme.' });
        }

        const rolesAutorises = ['ADMIN_RH', 'SALARIE', 'STAGIAIRE'];
        if (!rolesAutorises.includes(role)) {
            return res.status(400).json({ message: 'Rôle utilisateur invalide. Choisir parmi ADMIN_RH, SALARIE ou STAGIAIRE ' });
        }

        if ((role === 'STAGIAIRE' || role === 'SALARIE') && !service) {
            return res.status(400).json({ message: 'Le champ service est obligatoire pour les rôles STAGIAIRE et SALARIE.' });
        }

        const hashedPassword = await bcrypt.hash(motDePasse, 10);
        const newUser = new User({
            nom, 
            prenom, 
            email, 
            motDePasse: hashedPassword,
            sexe, 
            role, 
            service: service || null
        });
        await newUser.save();
        res.status(201).json({ message: 'Utilisateur créé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Récupérer tous les utilisateurs (par un ADMIN_RH)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-motDePasse').populate('service', 'nomService');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Récupérer un utilisateur par ID (par un ADMIN_RH)
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-motDePasse').populate('service', 'nomService');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Mettre à jour un utilisateur par ID (par un ADMIN_RH)
exports.updateUser = async (req, res) => {
    try {
        const { nom, prenom, email, sexe, role, service } = req.body;
        
        const  sexeOptions = ['Homme', 'Femme'];
        if ((sexe === 'Homme' || sexe === 'Femme') && !sexeOptions.includes(sexe)) {
            return res.status(400).json({ message: 'Le champ sexe doit être Homme ou Femme.' });
        }

        const rolesAutorises = ['ADMIN_RH', 'SALARIE', 'STAGIAIRE'];
        if (role && !rolesAutorises.includes(role)) {
            return res.status(400).json({ message: 'Rôle utilisateur invalide. Choisir parmi ADMIN_RH, SALARIE ou STAGIAIRE ' });
        }
        if ((role === 'STAGIAIRE' || role === 'SALARIE') && !service) {
            return res.status(400).json({ message: 'Le champ service est obligatoire pour les rôles STAGIAIRE et SALARIE.' });
        }

        let updateData = { nom, prenom, email, sexe, role, service};

        if (req.body.motDePasse) {
            const hashedPassword = await bcrypt.hash(req.body.motDePasse, 10);
            updateData.motDePasse = hashedPassword;
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true })
        .select('-motDePasse')
        .populate('service', 'nomService');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.status(200).json({ message: 'Utilisateur mis à jour avec succès', user });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Supprimer un utilisateur par ID (par un ADMIN_RH)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};