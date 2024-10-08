import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { ResponseHelper } from "../helper/response.helper.js";
import { APIError } from "../error/api.error.js";
import { UserService } from "../service/user.service.js";

export const authMiddleware = async (req, res, next) => {
  const token = req.get("Authorization")?.split("Bearer ")[1];
  if (!token) {
    return res.status(API_STATUS_CODE.UNAUTHORIZED).json(ResponseHelper.toJsonError("Unauthorized!")).end();
  } else {
    try {
      const user = await UserService.checkToken(token);

      req.loggedUser = user;

      next();
    } catch (error) {
      if (error instanceof APIError) {
        return res.status(API_STATUS_CODE.UNAUTHORIZED).json(ResponseHelper.toJsonError("Unauthorized!")).end();
      }
      console.log(error);

      return res.status(API_STATUS_CODE.SERVER_ERROR).json(ResponseHelper.toJsonError("Server Error While Check Token!")).end();
    }
  }
};
