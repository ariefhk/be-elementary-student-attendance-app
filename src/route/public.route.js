import express from "express";
import { HelloController } from "../controller/hello.controller.js";
import { UserController } from "../controller/user.controller.js";
import { authApiPrefix, downloadApiPrefix } from "./prefix.route.js";
import { rateLimiterMiddleware } from "../middleware/limiter.middleware.js";
import { StudentClassController } from "../controller/student-class.controller.js";
import { AttendanceController } from "../controller/attendance.controller.js";

const publicRouter = express.Router();

// HELLO ROUTE
publicRouter.get("/", rateLimiterMiddleware, HelloController.sayHello);

// AUTH ROUTE
publicRouter.post(authApiPrefix + "/login", rateLimiterMiddleware, UserController.login);

// DOWNLOAD ROUTE
publicRouter.get(
  downloadApiPrefix + "/attendance/class/:classId/weekly/student/:studentId",
  rateLimiterMiddleware,
  AttendanceController.downloadStudentWeeklyAttendance
);

publicRouter.get(
  downloadApiPrefix + "/attendance/class/:classId/weekly",
  rateLimiterMiddleware,
  AttendanceController.downloadWeeklyAttendance
);

publicRouter.get(downloadApiPrefix + "/class/:classId", rateLimiterMiddleware, StudentClassController.downdloadStudentInClass);

export { publicRouter };
