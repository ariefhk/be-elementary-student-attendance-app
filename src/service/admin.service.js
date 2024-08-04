import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { toAdminJSON } from "../model/admin.model.js";

export class AdminService {
  static async findAdminMustExist(adminId, option = { isWithUser: false }) {
    // Check if teacher id is existed
    if (!adminId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Admin id is required");
    }

    const existedAdmin = await db.admin.findUnique({
      where: {
        id: adminId,
      },
      include: {
        user: true,
      },
    });

    if (!existedAdmin) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Admin not found");
    }

    return toAdminJSON(existedAdmin, option);
  }
}
