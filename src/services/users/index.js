import express from "express";
import createHttpError from "http-errors";
import UsersModel from "./schema.js"; // Changed from AuthorsModel to UsersModel
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import q2m from "query-to-mongo";
import { basicAuthMiddleware } from "../../auth/basic.js";
import { adminOnlyMiddleware } from "../../auth/admin.js";
import { authenticateUser } from "../../auth/tools.js"; // Changed from authenticateAuthor to authenticateUser
import { JWTAuthMiddleware } from "../../auth/token.js";
import mongoose from "mongoose";
import passport from "passport";
import upload from "./fileUpload.js";
import Appointment from "../appointments/schema.js";
cloudinary.config({ 
  cloud_name: "image-gozalbes", 
  api_key: "171575622512274", 
  api_secret: "MVb_fqU9mjk5ZyrfGuGT9bBtmpg" // Click 'View Credentials' below to copy your API secret
});
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatars',
    format: async (req, file) => {
      // Determine the file format based on mimetype
      const allowedFormats = ['jpg', 'jpeg', 'png', 'webp']; // Add supported formats
      const mimetype = file.mimetype.split('/')[1];
      return allowedFormats.includes(mimetype) ? mimetype : 'png'; // Fallback to 'png' if not supported
    },
   public_id: (req, file) => `${file.fieldname}-${Date.now()}`, 
  },
});
const cloudinaryPDFStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'diplomas',
    resource_type: 'raw', // Use 'raw' for non-image files
    public_id: (req, file) => `${file.fieldname}-${Date.now()}`,
  },

});
const uploadPDF = multer({ storage: cloudinaryPDFStorage });

const usersRouter = express.Router();

usersRouter.get(
  "/me",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const user = await UsersModel.findById(req.user._id);
      res.send(user);
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findByIdAndUpdate(
      req.user._id,
      { $set: req.body },
      {
        new: true,
      }
    );

    if (user) {
      res.send(user);
    } else {
      next(createHttpError(404, `User with id ${req.user._id} not found`));
    }
  } catch (error) {
    next(error);
  }
});


usersRouter.delete("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    await UsersModel.findByIdAndDelete(req.user._id);
    res.send();
  } catch (error) {
    next(error);
  }
});

usersRouter.get('/patients/me',JWTAuthMiddleware, async (req, res,next) => {
  try {
    // Assuming you have authenticated the doctor and have access to their ID in the request object
    const doctorId = req.user._id; // This depends on your authentication setup

    // Find all appointments where the doctor is the attending physician
    const appointments = await Appointment.find({ doctor: doctorId }).populate('patient');

    // Extract the patients from the appointments
    const patientsRepeated = appointments.map(appointment => appointment.patient);
    const patients = Array.from(new Set(patientsRepeated.map(patient => patient._id)))
    .map(id => patientsRepeated.find(patient => patient._id.toString() === id.toString()));

  res.json(patients);

  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
usersRouter.post("/register", async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Check if a user with the provided email already exists
    const existingUser = await UsersModel.findOne({ email });

    if (existingUser) {
      // If a user with the email already exists, return a message indicating so
      return res.status(400).json({ error: 'Ya hay una cuenta con este email' });
    }
    const newUser = new UsersModel(req.body);
    const { _id } = await newUser.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/uploadDiploma",uploadPDF.single('diploma'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'raw', // Use 'raw' for non-image files
      folder: 'diplomas'
    });
console.log(result);
    // Optionally, delete the file from the server after uploading to Cloudinary
    

    res.json({ url: result.url });
  } catch (error) {
    console.error('Error uploading to Cloudinary', error);
    res.status(500).json({ error: 'Failed to upload diploma' });
  }
})

usersRouter.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["email", "profile"] })
); 

usersRouter.get(
  "/googleRedirect",
  passport.authenticate("google"),
  (req, res, next) => {
    try {
      if (req.user.role === "Admin") {
        res.redirect(
          `${process.env.FE_URL}/admin?accessToken=${req.user.token}`
        );
      } else {
        res.redirect(
          `${process.env.FE_URL}/profile?accessToken=${req.user.token}`
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.get(
  "/",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
     
      const users = await UsersModel.find();
      res.json(users); 
    } catch (error) {
      next(error);
    }
  }
);
usersRouter.get("/doctors", async (req, res, next) => {
  try {
    const doctors = await UsersModel.find({ role: "Doctor" });
    const doctorsWithAppointments = await Promise.all(doctors.map(async (doctor) => {
      const appointments = await Appointment.find({ doctor: doctor._id }).populate('patient','_id'); // Adjust fields as necessary
      return {
        ...doctor.toObject(), // Convert mongoose document to plain object
        appointments,
      };
    }));
    res.status(200).json(doctorsWithAppointments);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/:userId", async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await UsersModel.findById(userId);
    if (user) {
      res.send(user);
    } else {
      next(createHttpError(404, `User with id ${userId} not found`));
    }
  } catch (error) {
    next(error);
  }
});
usersRouter.get("/doctor/:userId", async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await UsersModel.findById(userId);
    const appointments = await Appointment.find({ doctor: user._id }).populate('patient', '_id'); // Adjust fields as necessary

    // Combine doctor data with appointments
    const doctorWithAppointments = {
      ...user.toObject(), // Convert mongoose document to plain object
      appointments,
    };
    if (user) {
      res.send(doctorWithAppointments);
    } else {
      next(createHttpError(404, `User with id ${userId} not found`));
    }
  } catch (error) {
    next(error);
  }
});


usersRouter.put(
  "/:userId",
  JWTAuthMiddleware,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.params.userId;
      
      // Construct the update object using dot notation for nested fields
      const updateObj = {};
      for (const key in req.body) {
        // If the key is not 'address', update it directly
        if (key !== 'address') {
          updateObj[key] = req.body[key];
        } else {
          // If the key is 'address', update its nested fields
          for (const addressKey in req.body.address) {
            updateObj[`address.${addressKey}`] = req.body.address[addressKey];
          }
        }
      }
      
      const updatedUser = await UsersModel.findByIdAndUpdate(
        userId,
        { $set: updateObj },
        { new: true }
      );
      
      if (updatedUser) {
        res.send(updatedUser);
      } else {
        next(createHttpError(404, `User with id ${userId} not found`));
      }
    } catch (error) {
      next(error);
    }
  }
);




usersRouter.delete(
  "/:userId",
  JWTAuthMiddleware,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const deletedUser = await UsersModel.findByIdAndDelete(userId);
      if (deletedUser) {
        res.status(204).send();
      } else {
        next(createHttpError(404, `User with id ${userId} not found`));
      }
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.post(
  "/avatar", 
  multer({ storage: cloudinaryStorage }).single("file"),
  async (req, res, next) => {
    try {
      console.log(req.body);
      if (req.file.path) {
        res.send({ path: req.file.path });
      } else {
        next(createHttpError(404, `User with id ${userId} not found!`));
      }
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.post("/login", async (req, res, next) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    const user = await UsersModel.checkCredentials(email, password);
    console.log(user);
    if (user) {
      const accessToken = await authenticateUser(user);
      res.status(201).send({ accessToken });
      console.log(accessToken);
    } else {
      res.status(401).send("Usuario o contraseña incorrectos");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

usersRouter.get("/me/appointments", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      user: req.user._id.toString(),
    });

    res.status(200).send(appointments);
  } catch (error) {
    next(error);
  }
});


export default usersRouter;
