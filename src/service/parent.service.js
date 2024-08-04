import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";
import { UserService } from "./user.service.js";
import { toParentJSON } from "../model/parent.model.js";
import { createBcryptPassword } from "../helper/hashing.helper.js";
import { saveFile } from "../helper/file.helper.js";
import { BASE_FILE, IMG_PROFILE_FILE } from "../constants/file-directory.js";

export class ParentService {
  static async findParentMustExist(parentId, option = { isWithUser: false, isWithStudent: false }) {
    // Check if parent id is existed
    if (!parentId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Parent id is required");
    }

    // Find parent by id
    const parent = await db.parent.findUnique({
      where: {
        id: parentId,
      },
      include: {
        user: true,
        student: true,
      },
    });

    if (!parent) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Parent not found!");
    }

    return toParentJSON(parent, option);
  }

  static async findById(request) {
    const { parentId, loggedUserRole } = request;

    // check logged user
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    // check if parent is existed
    const existedParent = await this.findParentMustExist(parentId, {
      isWithStudent: true,
      isWithUser: true,
    });

    return existedParent;
  }

  static async findAll(request) {
    const { loggedUserRole, name } = request;

    // check logged user
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);
    const filter = {};

    // Check if name is existed
    if (name) {
      filter.user = {
        name: {
          contains: name,
          mode: "insensitive",
        },
      };
    }

    // Find all parents
    const parents = await db.parent.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      include: {
        student: true,
        user: true,
      },
    });

    return parents.map((parent) => toParentJSON(parent, { isWithUser: true, isWithStudent: true }));
  }

  static async create(request) {
    const { email, password, name, profilePicture, address, gender, loggedUserRole } = request;

    // Check if logged user is admin
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // Check if all field is required
    if (!email || !password || !gender || !name) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "All field is required!");
    }

    // Check if email is existed
    const existedUserByEmail = await UserService.findUserByEmail(email);

    // Check if email is existed
    if (existedUserByEmail) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email already used!");
    }

    // Hash password
    const hashedPassword = await createBcryptPassword(password);

    const createParentProcess = await db.$transaction(async (prismaTrans) => {
      try {
        // Update token
        const createdUser = await prismaTrans.user.create({
          data: { email, password: hashedPassword, role: "TEACHER" },
        });

        // Create teacher
        const createdParent = await prismaTrans.parent.create({
          data: {
            userId: createdUser.id,
            name,
            gender,
            ...(profilePicture && {
              profilePicture: await saveFile(profilePicture, createdUser.id, BASE_FILE, IMG_PROFILE_FILE),
            }),
            ...(address && { address: address }),
          },
          include: {
            user: true,
            student: true,
          },
        });

        return toParentJSON(createdParent, { isWithUser: true, isWithStudent: true });
      } catch (error) {
        console.error("Error inside transaction create parent:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed login user!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return createParentProcess;
  }

  static async update(request) {
    const { parentId, email, password, name, profilePicture, address, gender, loggedUserRole } = request;

    // Check if logged user is admin
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // check if teacher is existed
    const existedParent = await this.findParentMustExist(parentId, { isWithUser: true });

    // Check if email is already existed
    if (email) {
      const existedUserWithSameEmail = await db.user.findFirst({
        where: {
          email: email,
          id: {
            not: existedParent.user.id,
          },
        },
      });

      // throw error if email is already existed
      if (existedUserWithSameEmail) {
        throw new APIError({
          status: API_STATUS_CODE.BAD_REQUEST,
          message: "Email is already existed!",
        });
      }
    }

    const updateParentProcess = await db.$transaction(async (prismaTransaction) => {
      try {
        // Update user data
        if (email || password) {
          await prismaTransaction.user.update({
            where: {
              id: existedParent.user.id,
            },
            data: {
              ...(email && { email: email }),
              ...(password && { password: await createBcryptPassword(password) }),
            },
          });
        }

        // Update teacher data
        const updatedParent = await db.parent.update({
          where: {
            id: existedParent.id,
          },
          data: {
            ...(name && { name: name }),
            ...(gender && { gender: gender }),
            ...(profilePicture && {
              profilePicture: await saveFile(profilePicture, existedParent.user.id, BASE_FILE, IMG_PROFILE_FILE),
            }),
            ...(address && { address: address }),
          },
          include: {
            user: true,
            student: true,
          },
        });

        return toParentJSON(updatedParent, { isWithUser: true, isWithStudent: true });
      } catch (error) {
        console.log("Error update parent: ", error);
        throw new APIError({
          status: API_STATUS_CODE.BAD_REQUEST,
          message: error.message,
        });
      }
    });

    return updateParentProcess;
  }

  static async delete(request) {
    const { loggedUserRole, parentId } = request;
    // Check if logged user is admin
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // check if teacher is existed
    const existedParent = await this.findParentMustExist(parentId, { isWithUser: true });

    await db.$transaction(async (prismaTrans) => {
      try {
        // Delete teacher data
        await prismaTrans.parent.delete({
          where: {
            id: existedParent.id,
          },
        });

        // Delete user data
        await prismaTrans.user.delete({
          where: {
            id: existedParent.user.id,
          },
        });
      } catch (error) {
        console.error("Error inside transaction delete parent:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed delete parent!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return existedParent;
  }
}
