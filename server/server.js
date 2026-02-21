import "./config.js";

import express from "express";
import cors from "cors";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import aiRouter from "./routes/aiRoutes.js";
import userRouter from "./routes/userRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";

const app = express();

console.log("GROQ KEY LOADED:", !!process.env.GROQ_API_KEY);

await connectCloudinary();

import cors from "cors";

app.use(cors({
  origin: "*", // for testing
  methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json());
app.use(clerkMiddleware());

app.get("/", (_, res) => res.send("Server is live!"));

app.use(requireAuth());
app.use("/api/ai", aiRouter);
app.use("/api/user", userRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
