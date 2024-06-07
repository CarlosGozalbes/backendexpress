import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const ratingSchema = new Schema({
  value: { type: Number, required: true }, // The content of the comment
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user who authored the comment
  doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the doctor's profile
  // Array of comment IDs for replies to this comment
 // Array of comment IDs for replies to this comment
},{ timestamps: true });

export default model('Rating', ratingSchema);