import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const CommentSchema = new Schema({
  content: { type: String, required: true }, // The content of the comment
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user who authored the comment
  doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the doctor's profile
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who liked the comment
  replies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }] ,// Array of comment IDs for replies to this comment
  itsParent: {type:Boolean,default:false} // Array of comment IDs for replies to this comment
},{ timestamps: true });

export default model('Comment', CommentSchema);
