const Service = require("../models/service_model");
const User = require("../models/user_model");

//Créer un service
exports.createService = async (req, res) => {
    try {
        const { nomService, description } = req.body;

        const existingService = await Service.findOne({ nomService});
        if (existingService) {
            return res.status(400).json({ message: "Un service avec ce nom existe déjà." });
        }

        const service = new Service({ nomService, description });
        await service.save();
        res.status(201).json({ message: "Service créé avec succès", service });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

//Voir tous les services
exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.find();
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

//Voir un service par ID
exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: "Service non trouvé" });
        }
        res.status(200).json(service);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

//Mettre à jour un service
exports.updateService = async (req, res) => {
    try {
        const { nomService, description } = req.body;
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            { nomService, description },
            { new: true }
        );
        if (!service) {
            return res.status(404).json({ message: "Service non trouvé" });
        }
        res.status(200).json({ message: "Service mis à jour avec succès", service });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

//Supprimer un service
exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) {
            return res.status(404).json({ message: "Service non trouvé" });
        }
        res.status(200).json({ message: "Service supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

//Assigner un utilisateur à un service
exports.assignUserToService = async (req, res) => {
    try {
        const { userId, serviceId } = req.body;

        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: "Service non trouvé" });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { service: serviceId },
            { new: true }
        ).populate('service', 'nomService');

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.status(200).json({ message: "Utilisateur assigné au service avec succès", user });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

//Retirer un utilisateur d'un service
exports.removeUserFromService = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findByIdAndUpdate(
            userId,
            { $unset: { service: "" } },
            { new: true }
        ).populate('service', 'nomService');

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.status(200).json({ message: "Utilisateur retiré du service avec succès", user });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};