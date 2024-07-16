import express from "express";
import { authApiPrefix, userApiPrefix } from "./prefix.route.js";
import { UserController } from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const privateRouter = express.Router();

// AUTH ROUTE
privateRouter.get(authApiPrefix + "/current", authMiddleware, UserController.getCurrent);
privateRouter.delete(authApiPrefix + "/logout", authMiddleware, UserController.logout);

// USER ROUTE
privateRouter.post(userApiPrefix, authMiddleware, UserController.create);

export { privateRouter };
