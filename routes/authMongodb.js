import express from "express";
import { login, register, registerDoctor, registerPatient, getAllDoctors, updateProfile, logout } from "../controllers/authMongodb.js";

const router = express.Router()

router.post("/login", login)
router.post("/register", register)
router.post("/update-profile", updateProfile)
router.post("/logout", logout)
router.post("/docregister", registerDoctor)
router.post("/patientregister", registerPatient)
router.get("/doctors", getAllDoctors)


export default router
