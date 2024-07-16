import express from "express";
import { HelloController } from "../controller/hello.controller.js";
import { UserController } from "../controller/user.controller.js";
import { authApiPrefix } from "./prefix.route.js";
import { rateLimiterMiddleware } from "../middleware/limiter.middleware.js";

const publicRouter = express.Router();

// HELLO ROUTE
publicRouter.get("/", rateLimiterMiddleware, HelloController.sayHello);

// AUTH ROUTE
publicRouter.post(authApiPrefix + "/login", rateLimiterMiddleware, UserController.login);

export { publicRouter };
