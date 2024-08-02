import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { ParentService } from "../service/parent.service.js";

export class ParentController {
  static async findAll(req, res, next) {
    try {
      const findAllParentRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req.query?.name ? req.query.name : null,
      };

      const result = await ParentService.findAll(findAllParentRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get all parent", result));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req, res, next) {
    try {
      const findByIdRequest = {
        logggerUserRole: req?.loggedUser?.role,
        parentId: req?.params?.parentId ? Number(req.params.parentId) : null,
      };

      const result = await ParentService.findById(findByIdRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get parent by id", result));
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const createParentRequest = {
        loggedUserRole: req?.loggedUser?.role,
        email: req?.body?.email,
        password: req?.body?.password,
        profilePicture: req?.file,
        gender: req?.body?.gender,
        name: req?.body?.name,
        photo: req?.body?.photo,
        address: req?.body?.address,
      };

      const result = await ParentService.create(createParentRequest);
      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success create parent", result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updateParentRequest = {
        loggedUserRole: req?.loggedUser?.role,
        parentId: req?.params?.parentId ? Number(req.params.parentId) : null,
        email: req?.body?.email,
        password: req?.body?.password,
        profilePicture: req?.file,
        name: req?.body?.name,
        photo: req?.body?.photo,
        address: req?.body?.address,
      };

      const result = await ParentService.update(updateParentRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success update parent", result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const deleteParentRequest = {
        loggedUserRole: req?.loggedUser?.role,
        parentId: req?.params?.parentId ? Number(req.params.parentId) : null,
      };
      const result = await ParentService.delete(deleteParentRequest);
      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete parent!", result));
    } catch (error) {
      next(error);
    }
  }
}
