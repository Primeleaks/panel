import dotenv from 'dotenv';
import express from 'express';
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";

import dbConnection, { checkTables } from "./database.js";
import setupDiscordBot from './discordbot.js';

import UserService from "./services/UserService.js";
import BlacklistService from "./services/BlacklistService.js";
import ScriptService from "./services/ScriptService.js";
import DiscordService from "./services/DiscordService.js";

import DiscordController from "./controller/DiscordController.js";
import TokenController from "./controller/TokenController.js";
import BlacklistController from "./controller/BlacklistController.js";
import ScriptController from "./controller/ScriptController.js";

dotenv.config();

const PORT = process.env.SERVER_PORT || 3000;

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

await checkTables();

const services = {
    userService: new UserService(),
    blacklistService: new BlacklistService(),
    scriptService: new ScriptService(),
    discordService: new DiscordService()
};

const discordClient = setupDiscordBot(services.scriptService);

const discordController = new DiscordController(services);
const tokenController = new TokenController();
const blacklistController = new BlacklistController(services);
const scriptController = new ScriptController(services, discordClient);

discordController.registerRoutes(app);
tokenController.registerRoutes(app);
blacklistController.registerRoutes(app);
scriptController.registerRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



