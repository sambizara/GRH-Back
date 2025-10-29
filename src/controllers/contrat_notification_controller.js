// controllers/contrat_notification_controller.js
const ContratNotificationService = require("../models/notification_service");

// 🔹 Récupérer les détails des contrats arrivant à expiration
exports.getExpiringContrats = async (req, res) => {
  try {
    console.log("🔍 Demande de contrats expirants reçue");
    const contratsExpiring = await ContratNotificationService.getExpiringContratsDetails();
    
    res.status(200).json({
      success: true,
      contratsExpiring
    });
  } catch (error) {
    console.error("❌ Erreur récupération contrats expirants:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des contrats expirants",
      error: error.message
    });
  }
};

// 🔹 Récupérer les statistiques d'expiration
exports.getExpirationStats = async (req, res) => {
  try {
    console.log("📊 Demande de statistiques expiration reçue");
    const stats = await ContratNotificationService.getContratExpirationStats();
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("❌ Erreur récupération statistiques:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message
    });
  }
};

// 🔹 Vérifier et créer les notifications d'expiration
exports.checkAndCreateNotifications = async (req, res) => {
  try {
    console.log("🔔 Demande de vérification notifications reçue");
    const notificationsCreated = await ContratNotificationService.checkAndCreateExpirationNotifications();
    
    res.status(200).json({
      success: true,
      message: `${notificationsCreated.length} notification(s) créée(s)`,
      notificationsCreated
    });
  } catch (error) {
    console.error("❌ Erreur création notifications:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création des notifications",
      error: error.message
    });
  }
};

// 🔹 Créer une notification pour l'admin
exports.createAdminNotification = async (req, res) => {
  try {
    const adminUserId = req.user.id; // L'admin connecté
    console.log(`👨‍💼 Demande notification admin pour: ${adminUserId}`);
    
    const notification = await ContratNotificationService.createAdminExpirationNotification(adminUserId);
    
    if (notification) {
      res.status(201).json({
        success: true,
        message: "Notification admin créée",
        notification
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Aucun contrat n'arrive à expiration",
        notification: null
      });
    }
  } catch (error) {
    console.error("❌ Erreur création notification admin:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la notification admin",
      error: error.message
    });
  }
};