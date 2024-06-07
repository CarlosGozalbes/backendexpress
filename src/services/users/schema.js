import mongoose from "mongoose";
import bcrypt from "bcrypt";
const { Schema, model } = mongoose;
// Define the schema for time ranges

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    avatar: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    address: {
      city: { type: String, required: true },
      description: { type: String, required: true },
      iframeSrc: { type: String, required: false },
      center: { type: String, required: false },
    },
    password: { type: String, required: false },
    role: { type: String, enum: ["User", "Doctor", "Admin"], default: "User" },
    verified: { type: Boolean, default: false },
    googleId: { type: String },
    infoDoctor: {
      insuranceCompanies:[{type: String}],
      description: { type: String },
      schedule: {
        Lunes: {
          morning: {
            start: { type: String, required: false },
            end: { type: String, required: false },
          },
          evening: {
            start: { type: String, required: false },
            end: { type: String, required: false },
          },
        },
        Martes: {
          morning: {
            start: { type: String, required: false },
            end: { type: String, required: false },
          },
          evening: {
            start: { type: String, required: false },
            end: { type: String, required: false },
          },
        },
        Miércoles: {
          morning: {
            start: { type: String, required: false },
            end: { type: String, required: false },
          },
          evening: {
            start: { type: String, required: false },
            end: { type: String, required: false },
          },
        },
        Jueves: {
          morning: {
            start: { type: String, required: false },
            end: { type: String, required: false },
          },
          evening: {
            start: { type: String, required: false },
            end: { type: String, required: false },
          },
        },
        Viernes: {
          morning: {
            start: { type: String, required: false },
            end: { type: String, required: false },
          },
          evening: {
            start: { type: String, required: false },
            end: { type: String, required: false },
          },
        },
      },
      specialization: { type: String },
      diploma: { type: String },
      verified: { type: Boolean, default: false },
      // Add more fields as needed for doctor's information
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function (next) {
  const newUser = this;
  const plainPw = newUser.password;

  if (newUser.isModified("password")) {
    const hash = await bcrypt.hash(plainPw, 11);
    newUser.password = hash;
  }

  next();
});

UserSchema.methods.toJSON = function () {
  const userDocument = this;
  const userObject = userDocument.toObject();

  delete userObject.password;
  delete userObject.__v;

  return userObject;
};

UserSchema.statics.checkCredentials = async function (email, plainPW) {
  const user = await this.findOne({ email });

  if (user) {
    const isMatch = await bcrypt.compare(plainPW, user.password);
    if (isMatch) {
      return user;
    } else {
      return null;
    }
  } else {
    return null;
  }
};

UserSchema.static("findUsersWithAppointments", async function (mongoQuery) {
  const total = await this.countDocuments(mongoQuery.criteria);
  const users = await this.find(mongoQuery.criteria)
    .limit(mongoQuery.options.limit)
    .skip(mongoQuery.options.skip)
    .sort(mongoQuery.options.sort)
    .populate({
      path: "MedicalAppointments",
      select: "date time doctor",
    });
  return { total, users };
});

export default model("User", UserSchema);
