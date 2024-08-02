import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { UserService } from "../service/user.service.js";

export class UserController {
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

  static async updateCurrentUser(req, res, next) {
    try {
      const updateUserRequest = {
        loggedUserId: req.loggedUser.id ? Number(req.loggedUser.id) : null,
        loggedUserRole: req.loggedUser.role ? req.loggedUser.role : null,
        email: req?.body?.email,
        password: req?.body?.password,
        name: req?.body?.name,
        nip: req?.body?.nip,
        photo: req?.body?.photo,
        gender: req?.body?.gender,
        address: req?.body?.address,
      };

      const result = await UserService.update(updateUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Update Current User Login!", result));
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
        loggedUserId: req.loggedUser.id ? Number(req.loggedUser.id) : null,
        loggedUserRole: req.loggedUser.role ? req.loggedUser.role : null,
      };

      const result = await UserService.logout(logoutUserRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success Logout User", result));
    } catch (error) {
      next(error);
    }
  }
}
