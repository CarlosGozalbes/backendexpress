import express from "express";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import AppointmentSchema from "./schema.js"; 
import Appointment from "./schema.js";
import User from "../users/schema.js"; // Assuming you have a User model in your users folder
import { format,subHours  } from 'date-fns';
import { es } from 'date-fns/locale';
import { JWTAuthMiddleware } from "../../auth/token.js";
const appointmentsRouter = express.Router();

// Create an appointment
appointmentsRouter.post("/", async (req, res) => {
  try {
    const { doctor, startTime } = req.body;

    // Check if there is another appointment for the same doctor at the same time
    const conflictingAppointment = await Appointment.findOne({ doctor, startTime });
    if (conflictingAppointment) {
      return res.status(400).json({ message: "The doctor already has an appointment at this time." });
    }

    const newAppointment = new Appointment(req.body);
    const savedAppointment = await newAppointment.save();

    // Fetch the doctor and patient details
    const doctorDetails = await User.findById(savedAppointment.doctor);
    const patient = await User.findById(savedAppointment.patient);
    /* const adjustedDate = subHours(new Date(savedAppointment.startTime), 2); */
    const formattedDate = format(savedAppointment.startTime, "PPPP p", { locale: es });
  
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASSWORD,
      clientId: process.env.NODEMAILER_CLIENT_ID,
      clientSecret: process.env.NODEMAILER_CLIENT_SECRET,
      refreshToken: process.env.NODEMAILER_REFRESH_TOKEN
    }
  });
 

    // Define email options for doctor
    const doctorMailOptions = {
      from: "medimatch",
      to: doctorDetails.email,
      subject: "Nueva Cita Programada",
      text: `Estimado Dr. ${doctorDetails.name},\n\nTiene una nueva cita programada con ${doctorDetails.name} el ${formattedDate}.\n\nGracias,\nMediMatch`,

    };
    
    // Define email options for patient
    const patientMailOptions = {
      from: "medimatch",
      to: patient.email,
      subject: "Confirmación de Cita",
      text: `Estimado/a ${patient.name},\n\nSu cita con el Dr. ${doctor.name} está programada para el ${formattedDate}.\n\nGracias,\nMediMatch`,
    };
    

    // Send emails
    await transporter.sendMail(doctorMailOptions);
    await transporter.sendMail(patientMailOptions);

    res.status(201).json(savedAppointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Read (get all appointments)
appointmentsRouter.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('doctor') // Adjust based on your User schema fields
      .populate('patient'); // Adjust based on your User schema fields
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read (get a specific appointment by ID)


// Update an appointment
appointmentsRouter.put("/:id", async (req, res) => {
  try {
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedAppointment) {
      res.status(200).json(updatedAppointment);
    } else {
      res.status(404).json({ error: "Appointment not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
appointmentsRouter.get(
  "/me",
 JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      console.log("HOLA");
      const appointments = await Appointment.find({ patient: req.user._id })
        .populate('doctor'); // Populate the 'doctor' field

      res.json(appointments);
    } catch (error) {
      next(error);
    }
  }
);
appointmentsRouter.get("/patient/:patientId",JWTAuthMiddleware, async (req, res, next) => {
  try {
    const doctorId = req.user._id; // Assuming you have the doctor's ID in req.user

    // Fetch appointments where you are the doctor and the patient's ID matches
    const appointments = await Appointment.find({
      doctor: doctorId,
      patient: req.params.patientId
    }).populate("patient");

    res.json(appointments);
  } catch (error) {
    next(error);
  }
});
appointmentsRouter.get(
  "/doctor/me",
 JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      console.log("HOLA");
      const appointments = await Appointment.find({ doctor: req.user._id })
        .populate('patient'); // Populate the 'doctor' field

      res.json(appointments);
    } catch (error) {
      next(error);
    }
  }
);
// Delete an appointment
appointmentsRouter.delete("/:id", async (req, res) => {
  try {
    const deletedAppointment = await Appointment.findByIdAndDelete(req.params.id);
    if (deletedAppointment) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Appointment not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default appointmentsRouter;
