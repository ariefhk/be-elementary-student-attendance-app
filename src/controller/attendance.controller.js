import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { AttendanceService } from "../service/attendance.service.js";

export class AttendanceController {
  static async getWeeklyAttendance(req, res, next) {
    try {
      const getWeeklyAttendanceRequest = {
        loggedUserRole: req.loggedUser.role,
        classId: req?.params?.classId ? Number(req?.params?.classId) : null,
        year: req?.params?.year ? Number(req.params.year) : null,
        month: req?.params?.month ? Number(req.params.month) : null,
        week: req?.params?.week ? Number(req.params.week) : null,
      };

      const result = await AttendanceService.getWeeklyAttendance(getWeeklyAttendanceRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Get Weekly Attendance", result));
    } catch (error) {
      next(error);
    }
  }
}
