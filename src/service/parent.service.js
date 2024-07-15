import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";

export class ParentService {
  static async checkParentMustBeExistByUserId(userId) {
    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id is required");
    }

    const existedParent = await db.parent.findFirst({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        address: true,
        user: {
          select: {
            id: true,
            photo: true,
            name: true,
            email: true,
          },
        },
        createdAt: true,
      },
    });

    if (!existedParent) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Parent not found");
    }

    return existedParent;
  }

  static async checkParentMustBeExist(parentId) {
    if (!parentId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Parent id is required");
    }

    const existedParent = await db.parent.findUnique({
      where: {
        id: parentId,
      },
      select: {
        id: true,
        address: true,
        user: {
          select: {
            id: true,
            photo: true,
            name: true,
            email: true,
          },
        },
        createdAt: true,
      },
    });

    if (!existedParent) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Parent not found");
    }

    return existedParent;
  }

  static async findAll(request) {
    const { loggedUserRole, name } = request;
    const filter = {};
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // Check if name is existed
    if (name) {
      filter.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    const parents = await db.parent.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      select: {
        id: true,
        address: true,
        user: {
          select: {
            id: true,
            photo: true,
            name: true,
            email: true,
          },
        },
        createdAt: true,
      },
    });

    return parents.map((user) => {
      return {
        id: user.id,
        name: user.user.name,
        photo: user.user.photo,
        email: user.user.email,
        address: user.address,
        createdAt: user.createdAt,
      };
    });
  }

  static async findById(request) {
    const { loggedUserRole, teacherId } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // check if parent is existed
    const existedParent = await this.checkParentMustBeExist(teacherId);

    return {
      id: existedParent.id,
      name: existedParent.user.name,
      photo: existedParent.user.photo,
      email: existedParent.user.email,
      address: existedParent.address,
      createdAt: existedParent.createdAt,
    };
  }

  static async findByUserId(request) {
    const { loggedUserRole, userId } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // check if parent is existed
    const existedParent = await this.checkParentMustBeExistByUserId(userId);

    return {
      id: existedParent.id,
      name: existedParent.user.name,
      photo: existedParent.user.photo,
      email: existedParent.user.email,
      address: existedParent.address,
      createdAt: existedParent.createdAt,
    };
  }
}
