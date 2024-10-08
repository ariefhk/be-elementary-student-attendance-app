import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { StudentService } from "../service/student.service.js";

export class StudentController {
  static async findAll(req, res, next) {
    try {
      const findAllStudentRequest = {
        loggedUserRole: req.loggedUser.role,
        name: req?.query?.name ? req.query.name : null,
      };

      const result = await StudentService.findAll(findAllStudentRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Find All Student!", result));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req, res, next) {
    try {
      const findStudentByIdRequest = {
        loggedUserRole: req.loggedUser.role,
        studentId: req?.params?.studentId ? Number(req?.params?.studentId) : null,
        name: req?.query?.name ? req.query.name : null,
      };

      const result = await StudentService.findById(findStudentByIdRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Find Student By Id!", result));
    } catch (error) {
      next(error);
    }
  }
  static async findByParentId(req, res, next) {
    try {
      const findStudentByParentIdRequest = {
        loggedUserRole: req.loggedUser.role,
        parentId: req?.params?.parentId ? Number(req?.params?.parentId) : null,
        name: req?.query?.name ? req.query.name : null,
      };

      const result = await StudentService.findByParentId(findStudentByParentIdRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Find Student By Parent!", result));
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const createStudentRequest = {
        loggedUserRole: req.loggedUser.role,
        parentId: req?.body?.parentId ? Number(req.body.parentId) : null,
        name: req?.body?.name,
        gender: req?.body?.gender,
        nisn: req?.body?.nisn,
        email: req?.body?.email,
        no_telp: req?.body?.no_telp,
      };

      const result = await StudentService.create(createStudentRequest);
      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success Create Student!", result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updateStudentRequest = {
        loggedUserRole: req.loggedUser.role,
        studentId: req?.params?.studentId ? Number(req.params.studentId) : null,
        parentId: req?.body?.parentId ? Number(req.body.parentId) : null,
        name: req?.body?.name,
        gender: req?.body?.gender,
        nisn: req?.body?.nisn,
        email: req?.body?.email,
        no_telp: req?.body?.no_telp,
      };

      const result = await StudentService.update(updateStudentRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Update Student!", result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const deleteStudentRequest = {
        loggedUserRole: req.loggedUser.role,
        studentId: req?.params?.studentId ? Number(req.params.studentId) : null,
      };

      const result = await StudentService.delete(deleteStudentRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Delete Student!", result));
    } catch (error) {
      next(error);
    }
  }
}
