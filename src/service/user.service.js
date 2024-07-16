import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";
import { compareBcryptPassword, createBcryptPassword } from "../helper/hashing.helper.js";
import { decodeJwt, makeJwt } from "../helper/jwt.helper.js";
import { ParentService } from "./parent.service.js";
import { TeacherService } from "./teacher.service.js";

export class UserService {
  static async checkUserMustBeExist(userId) {
    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id is required");
    }

    // Check if user is existed
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User not found");
    }
  }

  static async findAll(request) {
    const { loggedUserRole, role, name } = request;
    const filter = {};
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // Check if role is existed
    if (role) {
      filter.role = {
        contains: name,
        mode: "insensitive",
      };
    }

    // Check if name is existed
    if (name) {
      filter.name = name;
    }

    const users = await db.user.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      select: {
        id: true,
        name: true,
        photo: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return users;
  }

  static async create(request) {
    const { name, photo, email, password, nip, address, role, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    if (!name || !email || !password || !role) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Name, email, password, and role are required");
    }

    const countUser = await db.user.count({
      where: {
        email,
      },
    });

    if (countUser > 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email already exists");
    }

    const hashedPassword = await createBcryptPassword(password);

    const createUserProcess = await db.$transaction(async (prismaTrans) => {
      try {
        const createUser = await prismaTrans.user.create({
          data: {
            name,
            photo,
            email,
            password: hashedPassword,
            role,
          },
        });

        let createParentOrTeacher;

        if (createUser.role === "PARENT") {
          createParentOrTeacher = await prismaTrans.parent.create({
            data: {
              address: address,
              userId: createUser.id,
            },
          });
        } else if (createUser.role === "TEACHER") {
          createParentOrTeacher = await prismaTrans.teacher.create({
            data: {
              nip: nip,
              address: address,
              userId: createUser.id,
            },
          });
        }

        return {
          id: createUser.id,
          name: createUser.name,
          photo: createUser.photo,
          email: createUser.email,
          ...(createUser.role === "TEACHER" ? { nip: createParentOrTeacher?.nip ?? null } : {}),
          address: createParentOrTeacher.address ?? null,
          role: createUser.role,
          createdAt: createUser.createdAt,
        };
      } catch (error) {
        console.error("Error inside transaction create user:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed create user!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return createUserProcess;
  }

  static async login(request) {
    const { email, password } = request;

    if (!email || !password) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email and password are required");
    }

    const existedUser = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (!existedUser) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User not found");
    }

    const isPasswordMatch = await compareBcryptPassword(password, existedUser.password);

    if (!isPasswordMatch) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email or Password is incorrect");
    }

    const token = await makeJwt(
      {
        id: existedUser.id,
      },
      "7d"
    );

    const loginUserProcess = await db.$transaction(async (prismaTrans) => {
      try {
        const updatedUser = await prismaTrans.user.update({
          where: {
            id: existedUser.id,
          },
          data: {
            token: token,
          },
        });

        let parentOrTeacherDetail;

        if (updatedUser.role === "PARENT") {
          parentOrTeacherDetail = await prismaTrans.parent.findFirst({
            where: {
              userId: updatedUser.id,
            },
            select: {
              address: true,
            },
          });
        } else if (updatedUser.role === "TEACHER") {
          parentOrTeacherDetail = await prismaTrans.teacher.findFirst({
            where: {
              address: true,
              nip: true,
            },
          });
        }

        return {
          id: updatedUser.id,
          name: updatedUser.name,
          photo: updatedUser.photo,
          email: updatedUser.email,
          ...(updatedUser.role === "TEACHER" ? { nip: parentOrTeacherDetail?.nip ?? null } : {}),
          address: parentOrTeacherDetail?.address ?? null,
          role: updatedUser.role,
          createdAt: updatedUser.createdAt,
        };
      } catch (error) {
        console.error("Error inside transaction login user:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed login user!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return loginUserProcess;
  }

  static async update(request) {
    const { userId, name, photo, email, password, nip, address, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id is required");
    }

    const existedUser = await this.checkUserMustBeExist(userId);

    const updateUser = await db.user.update({
      where: {
        id: existedUser.id,
      },
      data: {
        name: name ?? existedUser.name,
        photo: photo ?? existedUser.photo,
        email: email ?? existedUser.email,
        password: password ? await createBcryptPassword(password) : existedUser.password,
      },
    });

    let updateParentOrTeacher;

    if (updateUser.role === "PARENT") {
      updateParentOrTeacher = await db.parent.update({
        where: {
          userId: updateUser.id,
        },
        data: {
          id: true,
          address: address,
        },
      });
    } else if (updateUser.role === "TEACHER") {
      updateParentOrTeacher = await db.teacher.update({
        where: {
          userId: updateUser.id,
        },
        data: {
          id: true,
          nip: nip,
          address: address,
        },
      });
    }

    return {
      id: updateUser.id,
      name: updateUser.name,
      photo: updateUser.photo,
      email: updateUser.email,
      ...(updateUser.role === "TEACHER"
        ? { teacherId: updateParentOrTeacher?.id ?? null, nip: updateParentOrTeacher?.nip ?? null }
        : { parentId: updateParentOrTeacher?.id ?? null }),
      address: updateParentOrTeacher.address ?? null,
      role: updateUser.role,
      createdAt: updateUser.createdAt,
    };
  }

  static async checkToken(token) {
    // Check if token is existed
    const existedToken = await db.user.findFirst({
      where: {
        token: token,
      },
    });

    if (!existedToken) {
      throw new APIError(API_STATUS_CODE.UNAUTHORIZED, "Unauthorized!");
    }

    // Check if token is expired
    const decodedUser = await decodeJwt(token);

    // Check if user is existed by user id
    const existedUser = await this.checkUserMustBeExist(decodedUser.id);

    // Get User Role Detail
    let parentOrTeacherDetail;

    // Check if user role is PARENT or TEACHER
    if (existedUser.role === "PARENT") {
      parentOrTeacherDetail = await ParentService.checkParentMustBeExistByUserId(existedUser.id);
    } else if (existedUser.role === "TEACHER") {
      parentOrTeacherDetail = await TeacherService.checkTeacherMustBeExistByUserId(existedUser.id);
    }

    return {
      id: existedUser.id,
      name: existedUser.name,
      photo: existedUser.photo,
      email: existedUser.email,
      address: parentOrTeacherDetail?.address ?? null,
      ...(existedUser.role === "TEACHER" ? { nip: parentOrTeacherDetail?.nip ?? null } : {}),
      role: existedUser.role,
      createdAt: existedUser.createdAt,
    };
  }

  static async delete(request) {
    const { userId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedUser = await this.checkUserMustBeExist(userId);

    await db.$transaction(async (prismaTrans) => {
      try {
        await prismaTrans.user.delete({
          where: {
            id: existedUser.id,
          },
        });

        if (existedUser.role === "PARENT") {
          await prismaTrans.parent.delete({
            where: {
              userId: existedUser.id,
            },
          });
        } else if (existedUser.role === "TEACHER") {
          await prismaTrans.teacher.delete({
            where: {
              userId: existedUser.id,
            },
          });
        }
      } catch (error) {
        console.error("Error inside transaction delete user:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed delete user!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return true;
  }

  static async logout(request) {
    const { userId } = request;

    // Check if user is allowed to delete
    const existedUser = await this.checkUserMustBeExist(userId);

    await db.user.update({
      where: {
        id: existedUser.id,
      },
      data: {
        token: null,
      },
    });

    return true;
  }
}
