import express from 'express';
import mongoose from 'mongoose';
import Comment from './schema.js';
import { JWTAuthMiddleware } from "../../auth/token.js";
const commentsRouter = express.Router();
async function populateComments(comments) {
    // Populate authors of the comments
    comments = await Comment.populate(comments, {
        path: 'author',
        select: 'avatar name surname'
    });

    // Populate replies of the comments
    comments = await Comment.populate(comments, {
        path: 'replies',
        populate: {
            path: 'author',
            select: 'avatar name surname'
        }
    });

    // Recursively populate replies
    for (let comment of comments) {
        if (comment.replies && comment.replies.length > 0) {
            comment.replies = await populateComments(comment.replies);
        }
    }

    return comments;
}
commentsRouter.post('/', JWTAuthMiddleware, async (req, res) => {
    try {
        // Extract data from the request body
        const { content, doctor, parentId } = req.body;
  
        // Check if it's a reply to a comment
        if (parentId) {
            // Find the parent comment
            const parentComment = await Comment.findById(parentId);
            if (!parentComment) {
                return res.status(404).json({ message: 'Parent comment not found' });
            }
            // Create a new comment document
            const newComment = new Comment({
                content,
                doctor,
                author: req.user._id
            });
            // Save the new comment to the database
            const savedComment = await newComment.save();
            // Add the new comment to the replies array of the parent comment
            parentComment.replies.push(savedComment._id);
            await parentComment.save();
            // Send the saved comment as the response
            return res.status(201).json(savedComment);
        } else {
            // Create a new comment document
            const newComment = new Comment({
                content,
                doctor,
                author: req.user._id,
                itsParent: true,
            });
            // Save the new comment to the database
            const savedComment = await newComment.save();
            const populatedComment = await savedComment.populate('author', 'avatar surname name')
            // Send the saved comment as the response
            return res.status(201).json(populatedComment);
        }
    } catch (error) {
        console.error("Error creating comment:", error.message);
        return res.status(500).json({ message: error.message });
    }
});

commentsRouter.get('/:doctorId', async (req, res) => {
    try {
        const comments = await Comment.find({ doctor: req.params.doctorId });

        // Recursively populate author and replies
        const populatedComments = await populateComments(comments);

        res.json(populatedComments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // DELETE comment by ID
  commentsRouter.delete('/:id', JWTAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Find the comment by its ID
        const comment = await Comment.findById(id);

        // Check if the replies array is empty
        if (!comment.replies || comment.replies.length === 0) {
            // If the replies array is empty, delete the comment
            await Comment.findByIdAndDelete(id);
            return res.json({ message: 'Comment deleted successfully' });
        }

        // If the replies array is not empty, update the comment by setting author and content
        const updatedComment = await Comment.findByIdAndUpdate(
            id,
            { $set: { author: '665f6f195c7efddbf344df29', content: "Comentario eliminado" } },
            { new: true }
        );

        if (!updatedComment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.json({ message: 'Comment updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

  
  // PUT update comment by ID
  commentsRouter.put('/:id',JWTAuthMiddleware, async (req, res) => {
    try {
      const updatedComment = await Comment.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      res.json(updatedComment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  export default commentsRouter;
