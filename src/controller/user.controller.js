import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { UserService } from "../service/user.service.js";

export class UserController {
  static async create(req, res, next) {
    try {
      const createUserRequest = {
        loggedUserRole: req.loggedUser.role,
        name: req?.body?.name,
        email: req?.body?.email,
        photo: req?.body?.photo,
        nip: req?.body?.nip,
        address: req?.body?.address,
        password: req?.body?.password,
        role: req?.body?.role,
      };

      const result = await UserService.create(createUserRequest);
      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success Create User", result));
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const loginUserRequest = {
        email: req?.body?.email,
        password: req?.body?.password,
      };
      const result = await UserService.login(loginUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Login User", result));
    } catch (error) {
      next(error);
    }
  }

  static async getCurrent(req, res, next) {
    try {
      const user = req.loggedUser;

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get current User", user));
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const logoutUserRequest = {
        userId: req.loggedUser.id ? Number(req.loggedUser.id) : null,
      };

      await UserService.logout(logoutUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Logout User"));
    } catch (error) {
      next(error);
    }
  }
}
