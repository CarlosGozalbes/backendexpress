import { config } from 'dotenv';
config();
import express from "express";
import listEndpoints from "express-list-endpoints";
import cors from "cors";
import mongoose from "mongoose";
import {
  badRequestHandler,
  unauthorizedHandler,
  notFoundHandler,
  genericErrorHandler,forbiddenHandler
} from "./errorHandlers.js";
import appointmentsRouter from "./services/appointments/index.js";
import usersRouter from "./services/users/index.js";
import commentsRouter from "./services/comments/index.js";
import ratingsRouter from "./services/ratings/index.js";

import newsletterRouter from "./services/newsletter.js";

const server = express();
const port = process.env.PORT || 3001;





server.use(cors());
server.use(express.json());


server.use("/newsletter", newsletterRouter);
server.use("/appointments", appointmentsRouter);
server.use("/users", usersRouter);
server.use("/comments", commentsRouter);
server.use("/ratings", ratingsRouter);

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);
server.use(forbiddenHandler);
mongoose.connect(process.env.MONGO_CONNECTION);

mongoose.connection.on("connected", () => {
  console.log("Successfully connected to Mongo!");
  server.listen(port, () => {
    console.table(listEndpoints(server));
    console.log("Server runnning on port: ", port);
  });
});

server.on("error", (error) => {
  console.log(`Server is stopped : ${error}`);
});