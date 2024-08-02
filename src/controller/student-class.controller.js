import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { StudentClassService } from "../service/student-class.service.js";

export class StudentClassController {
  static async findStudentInClass(req, res, next) {
    try {
      const findStudentInClassRequest = {
        loggedUserRole: req.loggedUser.role,
        classId: req?.params?.classId ? Number(req.params.classId) : null,
      };

      const result = await StudentClassService.findStudentsInClass(findStudentInClassRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Find Student in Class!", result));
    } catch (error) {
      next(error);
    }
  }
  static async findClassesOfStudent(req, res, next) {
    try {
      const findClassesOfStudentRequest = {
        loggedUserRole: req.loggedUser.role,
        studentId: req?.params?.studentId ? Number(req.params.studentId) : null,
      };

      const result = await StudentClassService.findClassesOfStudent(findClassesOfStudentRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Find Classes of Student!", result));
    } catch (error) {
      next(error);
    }
  }

  static async addStudentToClass(req, res, next) {
    try {
      const addStudentToClassRequest = {
        loggedUserRole: req.loggedUser.role,
        classId: req?.params?.classId ? Number(req.params.classId) : null,
        studentId: req?.params?.studentId ? Number(req.params.studentId) : null,
      };

      const result = await StudentClassService.addStudentToClass(addStudentToClassRequest);
      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success Add Student to Class!", result));
    } catch (error) {
      next(error);
    }
  }

  static async removeStudentFromClass(req, res, next) {
    try {
      const removeStudentFromClassRequest = {
        loggedUserRole: req.loggedUser.role,
        classId: req?.params?.classId ? Number(req.params.classId) : null,
        studentId: req?.params?.studentId ? Number(req.params.studentId) : null,
      };

      const result = await StudentClassService.removeStudentFromClass(removeStudentFromClassRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Remove Student from Class!", result));
    } catch (error) {
      next(error);
    }
  }
}
