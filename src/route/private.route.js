import express from "express";
import { authApiPrefix, userApiPrefix, teacherApiPrefix, parentApiPrefix } from "./prefix.route.js";
import { UserController } from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { TeacherController } from "../controller/teacher.controller.js";
import { ParentController } from "../controller/parent.controller.js";

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

// PARENT ROUTE
privateRouter.get(parentApiPrefix + "/:parentId", authMiddleware, ParentController.findById);
privateRouter.put(parentApiPrefix + "/:parentId", authMiddleware, ParentController.update);
privateRouter.delete(parentApiPrefix + "/:parentId", authMiddleware, ParentController.delete);
privateRouter.get(parentApiPrefix, authMiddleware, ParentController.findAll);
privateRouter.post(parentApiPrefix, authMiddleware, ParentController.create);

export { privateRouter };
