import express from "express";
import { adminUpdatePayment, getPayments, insertPayment, getPaymentById, getPatientPaymentsByDoctorId  } from "../controllers/paymentController.js";

const router = express.Router()

router.get("/get-all-payment", getPayments)
router.get("/get-payment-by-id", getPaymentById)
router.get("/get-payment-by-doctor-id", getPatientPaymentsByDoctorId)
router.post("/add-payment", insertPayment)
router.put("/update-payment", adminUpdatePayment)


export default router
