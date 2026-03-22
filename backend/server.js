import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import notificationRoutes from "./routes/NotificationRoutes.js";
import adminRoutes from "./routes/AdminRoutes.js";
import vetRoutes from "./routes/vetRoutes.js";
import shelterRoutes from "./routes/ShelterRoutes.js";
dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.get("/", (req, res) => res.send("Animal Rescue API running"));

app.use("/api/auth", authRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/volunteer", volunteerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vet", vetRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));