import express from "express";
import { 
          checkAppointmentAvailability, 
          getAllAppointments, 
          insertAppointment,
          updateAppointment,
          deleteAppointment,
          getAppointmentsByIdAndStatus
        } from "../controllers/appointmentController.js";

const router = express.Router()

router.get("/get-appointment", getAllAppointments)
router.get("/get-appointment-by-id-and-status/:id/:userIdName/:status", getAppointmentsByIdAndStatus)
router.post("/insert-appointment", insertAppointment)
router.post("/check-appointment", checkAppointmentAvailability)
router.put("/update-appointment/:appointmentId", updateAppointment)
router.delete("/delete-appointment/:appointmentId", deleteAppointment)


export default router
