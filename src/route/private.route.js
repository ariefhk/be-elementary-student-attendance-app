import express from "express";
import {
  authApiPrefix,
  userApiPrefix,
  teacherApiPrefix,
  parentApiPrefix,
  classApiPrefix,
  studentApiPrefix,
  attendanceApiPrefix,
} from "./prefix.route.js";
import { UserController } from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { TeacherController } from "../controller/teacher.controller.js";
import { ParentController } from "../controller/parent.controller.js";
import { ClassController } from "../controller/class.controller.js";
import { StudentController } from "../controller/student.controller.js";
import { AttendanceController } from "../controller/attendance.controller.js";

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

// CLASS ROUTE
privateRouter.get(classApiPrefix + "/teacher/:teacherId", authMiddleware, ClassController.findByTeacherId);
privateRouter.get(classApiPrefix + "/student/:studentId", authMiddleware, ClassController.findByStudentId);
privateRouter.get(classApiPrefix + "/:classId", authMiddleware, ClassController.findById);
privateRouter.put(classApiPrefix + "/:classId", authMiddleware, ClassController.update);
privateRouter.delete(classApiPrefix + "/:classId", authMiddleware, ClassController.delete);
privateRouter.get(classApiPrefix, authMiddleware, ClassController.findAll);
privateRouter.post(classApiPrefix, authMiddleware, ClassController.create);

// STUDENT ROUTE
privateRouter.delete(studentApiPrefix + "/:studentId/class/:classId", authMiddleware, StudentController.removeStudentFromClass);
privateRouter.get(studentApiPrefix + "/:studentId/class/:classId", authMiddleware, StudentController.findByClassId);
privateRouter.get(studentApiPrefix + "/parent/:parentId", authMiddleware, StudentController.findByParentId);
privateRouter.put(studentApiPrefix + "/:studentId/class/:classId", authMiddleware, StudentController.setStudentToClass);
privateRouter.get(studentApiPrefix + "/:studentId", authMiddleware, StudentController.findById);
privateRouter.put(studentApiPrefix + "/:studentId", authMiddleware, StudentController.update);
privateRouter.delete(studentApiPrefix + "/:studentId", authMiddleware, StudentController.delete);
privateRouter.get(studentApiPrefix, authMiddleware, StudentController.findAll);
privateRouter.post(studentApiPrefix, authMiddleware, StudentController.create);

// ATTENDANCE ROUTE
privateRouter.get(
  attendanceApiPrefix + "/class/:classId/year/:year/month/:month/week/:week/student/:studentId",
  authMiddleware,
  AttendanceController.getStudentWeeklyAttendance
);
privateRouter.get(
  attendanceApiPrefix + "/class/:classId/year/:year/month/:month/week/:week",
  authMiddleware,
  AttendanceController.getWeeklyAttendance
);
privateRouter.get(
  attendanceApiPrefix + "/class/:classId/year/:year/month/:month/student/:studentId",
  authMiddleware,
  AttendanceController.getStudentMonthlyAttendance
);
privateRouter.get(attendanceApiPrefix + "/class/:classId/date/:date", authMiddleware, AttendanceController.getDailyAttendance);
privateRouter.post(attendanceApiPrefix + "/class/:classId/date/:date", authMiddleware, AttendanceController.createManyAttendance);

export { privateRouter };
