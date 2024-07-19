import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { ClassService } from "../service/class.service.js";

export class ClassController {
  static async create(req, res, next) {
    try {
      const createClassRequest = {
        loggedUserRole: req.loggedUser.role,
        name: req?.body?.name,
        teacherId: req?.body?.teacherId ? Number(req?.body?.teacherId) : null,
      };

      const result = await ClassService.create(createClassRequest);
      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success Create Class", result));
    } catch (error) {
      next(error);
    }
  }

  static async findAll(req, res, next) {
    try {
      const findAllClassRequest = {
        loggedUserRole: req.loggedUser.role,
        name: req?.query?.name ? req.query.name : null,
      };

      const result = await ClassService.findAll(findAllClassRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Find All Class", result));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req, res, next) {
    try {
      const findClassByIdRequest = {
        loggedUserRole: req.loggedUser.role,
        classId: req?.params?.classId ? Number(req?.params?.classId) : null,
      };
      const result = await ClassService.findById(findClassByIdRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Get Class By Id", result));
    } catch (error) {
      next(error);
    }
  }

  static async findByTeacherId(req, res, next) {
    try {
      const findClassByTeacherIdRequest = {
        loggedUserRole: req.loggedUser.role,
        teacherId: req?.params?.teacherId ? Number(req?.params?.teacherId) : null,
      };

      console.log(findClassByTeacherIdRequest);
      const result = await ClassService.findByTeacherId(findClassByTeacherIdRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Get Class By Teacher Id", result));
    } catch (error) {
      next(error);
    }
  }
  static async findByStudentId(req, res, next) {
    try {
      const findClassByStudentIdRequest = {
        loggedUserRole: req.loggedUser.role,
        studentId: req?.params?.studentId ? Number(req?.params?.studentId) : null,
      };

      const result = await ClassService.findByStudentId(findClassByStudentIdRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Get Class By Student Id", result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updateClassRequest = {
        loggedUserRole: req.loggedUser.role,
        teacherId: req?.body?.teacherId ? Number(req?.body?.teacherId) : null,
        classId: req?.params?.classId ? Number(req?.params?.classId) : null,
        name: req?.body?.name,
      };

      const result = await ClassService.update(updateClassRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Update Class", result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const deleteClassRequest = {
        loggedUserRole: req.loggedUser.role,
        classId: req?.params?.classId ? Number(req?.params?.classId) : null,
      };
      await ClassService.delete(deleteClassRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Delete Class"));
    } catch (error) {
      next(error);
    }
  }
}
