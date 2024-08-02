import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { AttendanceService } from "../service/attendance.service.js";

export class AttendanceController {
  static async getWeeklyAttendance(req, res, next) {
    try {
      const getWeeklyAttendanceRequest = {
        loggedUserRole: req.loggedUser.role,
        classId: req?.params?.classId ? Number(req.params.classId) : null,
        year: req?.query?.year ? Number(req.query.year) : null,
        month: req?.query?.month ? Number(req.query.month) : null,
        week: req?.query?.week ? Number(req.query.week) : null,
      };

      const result = await AttendanceService.getWeeklyAttendance(getWeeklyAttendanceRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Get Weekly Attendance", result));
    } catch (error) {
      next(error);
    }
  }

  static async getDailyAttendance(req, res, next) {
    try {
      const getDailyAttendanceRequest = {
        loggedUserRole: req.loggedUser.role,
        classId: req?.params?.classId ? Number(req.params.classId) : null,
        date: req?.query?.date ? req.query.date : null,
      };

      const result = await AttendanceService.getDailyAttendance(getDailyAttendanceRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Get Daily Attendance", result));
    } catch (error) {
      next(error);
    }
  }

  static async getStudentWeeklyAttendance(req, res, next) {
    try {
      const getStudentWeeklyAttendance = {
        loggedUserRole: req.loggedUser.role,
        classId: req?.params?.classId ? Number(req.params.classId) : null,
        studentId: req?.params?.studentId ? Number(req?.params?.studentId) : null,
        year: req?.query?.year ? Number(req.query.year) : null,
        month: req?.query?.month ? Number(req.query.month) : null,
        week: req?.query?.week ? Number(req.query.week) : null,
      };

      const result = await AttendanceService.getStudentWeeklyAttendance(getStudentWeeklyAttendance);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Get Student Weekly Attendance", result));
    } catch (error) {
      next(error);
    }
  }
  static async getStudentMonthlyAttendance(req, res, next) {
    try {
      const getStudentMonthlyAttendanceRequest = {
        loggedUserRole: req.loggedUser.role,
        classId: req?.params?.classId ? Number(req?.params?.classId) : null,
        studentId: req?.params?.studentId ? Number(req?.params?.studentId) : null,
        year: req?.query?.year ? Number(req.query.year) : null,
        month: req?.query?.month ? Number(req.query.month) : null,
      };

      const result = await AttendanceService.getStudentMonthlyAttendance(getStudentMonthlyAttendanceRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Get Student Monthly Attendance", result));
    } catch (error) {
      next(error);
    }
  }

  static async createManyAttendance(req, res, next) {
    try {
      const createManyAttendanceRequest = {
        loggedUserRole: req.loggedUser.role,
        classId: req?.params?.classId ? Number(req?.params?.classId) : null,
        date: req?.body?.date && req?.body?.date !== "undefined" ? req.body.date : null,
        studentAttendances:
          req?.body?.studentAttendances && req?.body?.studentAttendances !== "undefined" ? req.body.studentAttendances : [],
      };

      const result = await AttendanceService.createOrUpdateMany(createManyAttendanceRequest);
      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success Create Attendance", result));
    } catch (error) {
      next(error);
    }
  }
}
