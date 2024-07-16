import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { TeacherService } from "../service/teacher.service.js";

export class TeacherController {
  static async findAll(req, res, next) {
    try {
      const findAllRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req.query?.name ? req.query.name : null,
      };

      const result = await TeacherService.findAll(findAllRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get all teacher", result));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req, res, next) {
    try {
      const findByIdRequest = {
        logggerUserRole: req?.loggedUser?.role,
        teacherId: req?.params?.teacherId ? Number(req.params.teacherId) : null,
      };

      const result = await TeacherService.findById(findByIdRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get teacher by id", result));
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const createTeacherRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.body?.name,
        email: req?.body?.email,
        photo: req?.body?.photo,
        nip: req?.body?.nip,
        address: req?.body?.address,
        password: req?.body?.password,
      };

      const result = await TeacherService.create(createTeacherRequest);
      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success create teacher", result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updateTeacherRequest = {
        loggedUserRole: req?.loggedUser?.role,
        teacherId: req?.params?.teacherId ? Number(req.params.teacherId) : null,
        name: req?.body?.name,
        email: req?.body?.email,
        photo: req?.body?.photo,
        nip: req?.body?.nip,
        address: req?.body?.address,
        password: req?.body?.password,
      };

      const result = await TeacherService.update(updateTeacherRequest);
      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success update teacher", result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const deleteTeacherRequest = {
        loggedUserRole: req?.loggedUser?.role,
        teacherId: req?.params?.teacherId ? Number(req.params.teacherId) : null,
      };
      await TeacherService.delete(deleteTeacherRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete teacher!"));
    } catch (error) {
      next(error);
    }
  }
}
