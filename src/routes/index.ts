import { Router } from "express";
import { adminAuth } from "@/middleware/adminAuth.middleware";
import authRoutes from "@/routes/auth.routes";
import bookingRoutes from "@/routes/booking.routes";
import categoryRoutes from "@/routes/category.routes";
import uploadRoutes from "@/routes/upload.routes";
import deliveryRoutes from "@/routes/delivery.routes";
import disputeRoutes from "@/routes/dispute.routes";
import reportRoutes from "@/routes/report.routes";
import equipmentRoutes from "@/routes/equipment.routes";
import reviewRoutes from "@/routes/review.routes";
import notificationsRoutes from "@/routes/notifications.routes";
import paymentRoutes from "@/routes/payment.routes";
import profileRoutes from "@/routes/profile.routes";
import statsRoutes from "@/routes/stats.routes";
import userRoutes from "@/routes/user.routes";

const router = Router();

router.use("/auth", authRoutes);

router.use(adminAuth);
router.use("/upload", uploadRoutes);
router.use("/profile", profileRoutes);
router.use("/categories", categoryRoutes);
router.use("/stats", statsRoutes);
router.use("/users", userRoutes);
router.use("/equipment", equipmentRoutes);
router.use("/reviews", reviewRoutes);
router.use("/bookings", bookingRoutes);
router.use("/deliveries", deliveryRoutes);
router.use("/payments", paymentRoutes);
router.use("/disputes", disputeRoutes);
router.use("/reports", reportRoutes);
router.use("/notifications", notificationsRoutes);

export default router;
