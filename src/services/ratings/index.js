import express from "express";
import mongoose from "mongoose";
import Rating from "./schema.js";
import { JWTAuthMiddleware } from "../../auth/token.js";
const ratingsRouter = express.Router();
// Route to add a new rating
ratingsRouter.post("/", async (req, res) => {
  try {
    const { value, author, doctor } = req.body;
    const newRating = new Rating({ value, author, doctor });
    const savedRating = await newRating.save();
    res.status(201).json(savedRating);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
ratingsRouter.get(
  "/user-doctor/:doctorId",
  JWTAuthMiddleware,
  async (req, res) => {
    try {
      // Find the user's rating for the specified doctor
      const rating = await Rating.findOne({
        author: req.user._id, // Assuming the user ID is available in req.user._id
        doctor: req.params.doctorId,
      });

      // If the rating is found, send it as the response
      if (rating) {
        res.json({ rating: rating.value, _id: rating._id});
      } else {
        res.json({ message: "No rating found for this doctor" });
      }
    } catch (error) {
      // If an error occurs, send an error response
      console.error("Error fetching user rating:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);
// Route to get all ratings
ratingsRouter.get("/", async (req, res) => {
  try {
    const ratings = await Rating.find();
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get a single rating by ID
ratingsRouter.get("/:id", async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }
    res.json(rating);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
ratingsRouter.get("/doctor/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Find all ratings for the specified doctor
    const ratings = await Rating.find({ doctor: doctorId });

    if (ratings.length === 0) {
      return res
        .status(404)
        .json({ message: "No ratings found for this doctor" });
    }

    // Calculate the average rating
    const totalRating = ratings.reduce((acc, cur) => acc + cur.value, 0);
    const averageRating = totalRating / ratings.length;

    res.json({ ratings: ratings, averageRating: averageRating });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Route to update a rating by ID
ratingsRouter.put("/:id", async (req, res) => {
  try {
    const { value, author, doctor } = req.body;
    const updatedRating = await Rating.findByIdAndUpdate(
      req.params.id,
      { value, author, doctor },
      { new: true }
    );
    if (!updatedRating) {
      return res.status(404).json({ message: "Rating not found" });
    }
    res.json(updatedRating);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to delete a rating by ID
ratingsRouter.delete("/:id", async (req, res) => {
  try {
    const deletedRating = await Rating.findByIdAndDelete(req.params.id);
    if (!deletedRating) {
      return res.status(404).json({ message: "Rating not found" });
    }
    res.json({ message: "Rating deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default ratingsRouter;
