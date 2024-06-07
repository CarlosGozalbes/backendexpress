import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const AppointmentSchema = new Schema({
  title:{type: String, default: "Cita médica"},
  doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the doctor
  patient: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the patient
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  description: { type: String, required: true },
  diagnosis: { type: String, default: "" },
  insurance: { type: String},
}, { timestamps: true });

export default model('Appointment', AppointmentSchema);
