import express from "express";
import { authApiPrefix, userApiPrefix, teacherApiPrefix } from "./prefix.route.js";
import { UserController } from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { TeacherController } from "../controller/teacher.controller.js";

const privateRouter = express.Router();

// AUTH ROUTE
privateRouter.get(authApiPrefix + "/current", authMiddleware, UserController.getCurrent);
privateRouter.delete(authApiPrefix + "/logout", authMiddleware, UserController.logout);

// USER ROUTE
privateRouter.post(userApiPrefix, authMiddleware, UserController.create);

// TEACHER ROUTE
privateRouter.get(teacherApiPrefix + "/:teacherId", authMiddleware, TeacherController.findById);
privateRouter.put(teacherApiPrefix + "/:teacherId", authMiddleware, TeacherController.update);
privateRouter.delete(teacherApiPrefix + "/:teacherId", authMiddleware, TeacherController.delete);
privateRouter.get(teacherApiPrefix, authMiddleware, TeacherController.findAll);
privateRouter.post(teacherApiPrefix, authMiddleware, TeacherController.create);

export { privateRouter };
