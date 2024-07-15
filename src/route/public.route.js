import express from "express";
import { HelloController } from "../controller/hello.controller.js";

const publicRouter = express.Router();

publicRouter.get("/", HelloController.sayHello);

export { publicRouter };
