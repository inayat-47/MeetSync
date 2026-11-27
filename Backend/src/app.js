import express from "express";
import mongoose from "mongoose";
import { createServer } from "node:http";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import { connectToSocket } from "./Controllers/socket.manager.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000));

app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit: "40kb", extended: true}));


app.use("/api/v1/users", userRoutes);

const start = async () => {
    const connectionDb = await mongoose.connect("mongodb+srv://muqddaskhan230_db_user:Xs9b0D9jO0luUE7t@cluster0.ohmtdbh.mongodb.net/?appName=Cluster0");
    server.listen(app.get("port"), () => {
        console.log(`http://localhost:${app.get("port")}/api/v1/users`);
        console.log("App is running");
    });
}


start().then((result) => {
    console.log("Database Connection Successful");
}).catch(error => console.log(error));