import { Router } from "express";
import { getProfessionals, updateProfessional } from "../controllers/professionalController";
import { createServiceHandler, deleteServiceHandler, getServices, updateServiceHandler } from "../controllers/serviceController";
import { getBookingsByDay } from "../controllers/bookingController";
import { getMessages } from "../controllers/messageController";

const router = Router();

router.get("/professionals", getProfessionals);
router.put("/professionals/:id", updateProfessional);

router.get("/services", getServices);
router.post("/services", createServiceHandler);
router.put("/services/:id", updateServiceHandler);
router.delete("/services/:id", deleteServiceHandler);

router.get("/bookings", getBookingsByDay);
router.get("/messages", getMessages);

export default router;
