import { Router } from "express";
import { adminAuth } from "@/middleware/adminAuth.middleware";
import authRoutes from "@/routes/auth.routes";
import bookingRoutes from "@/routes/booking.routes";
import deliveryRoutes from "@/routes/delivery.routes";
import disputeRoutes from "@/routes/dispute.routes";
import equipmentRoutes from "@/routes/equipment.routes";
import notificationsRoutes from "@/routes/notifications.routes";
import paymentRoutes from "@/routes/payment.routes";
import statsRoutes from "@/routes/stats.routes";
import userRoutes from "@/routes/user.routes";

const router = Router();

router.use("/auth", authRoutes);

router.use(adminAuth);
router.use("/stats", statsRoutes);
router.use("/users", userRoutes);
router.use("/equipment", equipmentRoutes);
router.use("/bookings", bookingRoutes);
router.use("/deliveries", deliveryRoutes);
router.use("/payments", paymentRoutes);
router.use("/disputes", disputeRoutes);
router.use("/notifications", notificationsRoutes);

export default router;
