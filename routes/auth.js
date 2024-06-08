import express from "express";

import { login, register, submitPatientRequestForm, registerDoctor, registerPatient, getAllDoctors, getPatientsByDoctorId, updateProfile, logout } from "../controllers/auth.js";

const router = express.Router()

router.post("/login", login)
router.post("/register", register)
router.post("/update-profile", updateProfile)
router.post("/logout", logout)
router.post("/docregister", registerDoctor)
router.post("/patientregister", registerPatient)
router.get("/doctors", getAllDoctors)
router.get("/doctor-patients/:doctorId", getPatientsByDoctorId)

//router.post("/submit-form", submitForm)
// Route configuration to use Multer middleware
router.post('/patient-request-form',  submitPatientRequestForm);


export default router
