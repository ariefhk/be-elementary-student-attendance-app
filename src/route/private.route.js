import express from "express";
import {
  authApiPrefix,
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
import { StudentClassController } from "../controller/student-class.controller.js";
import { FileUploadMiddleware } from "../middleware/file.middleware.js";

const privateRouter = express.Router();

// AUTH ROUTE
privateRouter.get(authApiPrefix + "/me", authMiddleware, UserController.getCurrent);
privateRouter.put(authApiPrefix + "/me/update", authMiddleware, UserController.updateCurrentUser);
privateRouter.delete(authApiPrefix + "/logout", authMiddleware, UserController.logout);

// TEACHER ROUTE
privateRouter.get(teacherApiPrefix + "/:teacherId", authMiddleware, TeacherController.findById);
privateRouter.put(teacherApiPrefix + "/:teacherId", authMiddleware, TeacherController.update);
privateRouter.delete(teacherApiPrefix + "/:teacherId", authMiddleware, TeacherController.delete);
privateRouter.get(teacherApiPrefix, authMiddleware, TeacherController.findAll);
privateRouter.post(teacherApiPrefix, authMiddleware, FileUploadMiddleware.uploadProfilePicture, TeacherController.create);

// PARENT ROUTE
privateRouter.get(parentApiPrefix + "/:parentId", authMiddleware, ParentController.findById);
privateRouter.put(parentApiPrefix + "/:parentId", authMiddleware, ParentController.update);
privateRouter.delete(parentApiPrefix + "/:parentId", authMiddleware, ParentController.delete);
privateRouter.get(parentApiPrefix, authMiddleware, ParentController.findAll);
privateRouter.post(parentApiPrefix, authMiddleware, FileUploadMiddleware.uploadProfilePicture, ParentController.create);

// CLASS ROUTE
privateRouter.put(classApiPrefix + "/:classId/student/:studentId/add", authMiddleware, StudentClassController.addStudentToClass);
privateRouter.put(
  classApiPrefix + "/:classId/student/:studentId/remove",
  authMiddleware,
  StudentClassController.removeStudentFromClass
);
privateRouter.get(classApiPrefix + "/student/:studentId", authMiddleware, StudentClassController.findClassesOfStudent);
privateRouter.get(classApiPrefix + "/teacher/:teacherId", authMiddleware, ClassController.findByTeacherId);
privateRouter.put(classApiPrefix + "/:classId", authMiddleware, ClassController.update);
privateRouter.delete(classApiPrefix + "/:classId", authMiddleware, ClassController.delete);
privateRouter.get(classApiPrefix + "/:classId", authMiddleware, ClassController.findById);
privateRouter.get(classApiPrefix, authMiddleware, ClassController.findAll);
privateRouter.post(classApiPrefix, authMiddleware, ClassController.create);

// STUDENT ROUTE
privateRouter.get(studentApiPrefix + "/class/:classId", authMiddleware, StudentClassController.findStudentInClass);
privateRouter.get(studentApiPrefix + "/parent/:parentId", authMiddleware, StudentController.findByParentId);
privateRouter.put(studentApiPrefix + "/:studentId", authMiddleware, StudentController.update);
privateRouter.delete(studentApiPrefix + "/:studentId", authMiddleware, StudentController.delete);
privateRouter.get(studentApiPrefix + "/:studentId", authMiddleware, StudentController.findById);
privateRouter.get(studentApiPrefix, authMiddleware, StudentController.findAll);
privateRouter.post(studentApiPrefix, authMiddleware, StudentController.create);

// ATTENDANCE ROUTE
privateRouter.get(
  attendanceApiPrefix + "/class/:classId/monthly/student/:studentId",
  authMiddleware,
  AttendanceController.getStudentMonthlyAttendance
);
privateRouter.get(
  attendanceApiPrefix + "/class/:classId/weekly/student/:studentId",
  authMiddleware,
  AttendanceController.getStudentWeeklyAttendance
);
privateRouter.put(
  attendanceApiPrefix + "/class/:classId/update-attendance",
  authMiddleware,
  AttendanceController.createManyAttendance
);
privateRouter.get(attendanceApiPrefix + "/class/:classId/weekly", authMiddleware, AttendanceController.getWeeklyAttendance);
privateRouter.get(attendanceApiPrefix + "/class/:classId/daily", authMiddleware, AttendanceController.getDailyAttendance);

export { privateRouter };
