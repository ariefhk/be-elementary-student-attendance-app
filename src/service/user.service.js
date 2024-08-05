import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";
import { compareBcryptPassword, createBcryptPassword } from "../helper/hashing.helper.js";
import { decodeJwt, makeJwt } from "../helper/jwt.helper.js";
import { toUserJson, toUserJsonWithRole } from "../model/user.model.js";
import { ParentService } from "./parent.service.js";
import { TeacherService } from "./teacher.service.js";
import { AdminService } from "./admin.service.js";
import { saveFile } from "../helper/file.helper.js";
import { BASE_FILE, IMG_PROFILE_FILE } from "../constants/file-directory.js";

export class UserService {
  static async findUserMustExist(
    userId,
    option = {
      isWithToken: false,
      isWithPassword: false,
      isWithTeacher: false,
      isWithParent: false,
    }
  ) {
    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id is required");
    }

    // Check if user is existed
    const existedUser = await db.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        parent: true,
        teacher: true,
      },
    });

    if (!existedUser) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User not found");
    }

    return toUserJson(existedUser, option);
  }

  static async findUserMustExistByEmail(
    email,
    option = {
      isWithToken: false,
      isWithPassword: false,
      isWithTeacher: false,
      isWithParent: false,
    }
  ) {
    if (!email) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email is required");
    }

    // Check if user is existed
    const existedUser = await db.user.findUnique({
      where: {
        email: email,
      },
      include: {
        parent: true,
        teacher: true,
      },
    });

    if (!existedUser) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "User not found");
    }

    return toUserJson(existedUser, option);
  }

  static async findUserByEmail(
    email,
    option = {
      isWithToken: false,
      isWithPassword: false,
      isWithTeacher: false,
      isWithParent: false,
    }
  ) {
    if (!email) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email is required");
    }

    // Check if user is existed
    const existedUser = await db.user.findUnique({
      where: {
        email: email,
      },
      include: {
        parent: true,
        teacher: true,
      },
    });

    if (!existedUser) {
      return null;
    }

    return toUserJson(existedUser, option);
  }

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
    return user;
  }

  static async login(request) {
    const { email, password } = request;

    //  Check if email and password is empty
    if (!email || !password) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email and password are required");
    }

    // Check if user is existed
    const existedUser = await this.findUserMustExistByEmail(email, {
      isWithPassword: true,
    });

    // Check if password is match
    const isPasswordMatch = await compareBcryptPassword(password, existedUser.password);

    // Check if password is not match
    if (!isPasswordMatch) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Email or Password is incorrect");
    }

    // Create token
    const token = await makeJwt(
      {
        id: existedUser.id,
      },
      "7d"
    );

    const loginUserProcess = await db.$transaction(async (prismaTrans) => {
      try {
        // Update token
        const updatedUser = await prismaTrans.user.update({
          where: {
            id: existedUser.id,
          },
          data: {
            token: token,
          },
          include: {
            parent: true,
            teacher: true,
          },
        });

        let loggedUserRoleData;

        if (updatedUser.role === "PARENT") {
          // Get Parent Data
          loggedUserRoleData = await prismaTrans.parent.findFirst({
            where: {
              userId: updatedUser.id,
            },
            include: {
              user: true,
              student: true,
            },
          });

          return toUserJsonWithRole(loggedUserRoleData, { isWithUser: true, isWithToken: true });
        } else if (updatedUser.role === "TEACHER") {
          // Get Teacher Data
          loggedUserRoleData = await prismaTrans.teacher.findFirst({
            where: {
              userId: updatedUser.id,
            },
            include: {
              user: true,
              class: true,
            },
          });

          return toUserJsonWithRole(loggedUserRoleData, { isWithUser: true, isWithClass: true, isWithToken: true });
        } else if (updatedUser.role === "ADMIN") {
          // Return user data with token
          loggedUserRoleData = await prismaTrans.admin.findFirst({
            where: {
              userId: updatedUser.id,
            },
            include: {
              user: true,
            },
          });
          return toUserJsonWithRole(loggedUserRoleData, { isWithUser: true, isWithToken: true });
        }
      } catch (error) {
        console.error("Error inside transaction login user:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed login user!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return loginUserProcess;
  }

  static async update(request) {
    const { name, photo, email, password, nip, address, profilePicture, gender, loggedUserRole, loggedUserId } = request;

    // Check if user is allowed to update
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    // Check if user is allowed to update
    if (!loggedUserId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id is required");
    }

    let userId;

    switch (loggedUserRole) {
      case "PARENT":
        const existedParent = await ParentService.findParentMustExist(loggedUserId, {
          isWithUser: true,
        });
        userId = existedParent.user.id;

        break;
      case "TEACHER":
        const existedTeacher = await TeacherService.findTeacherMustExist(loggedUserId, {
          isWithUser: true,
        });
        userId = existedTeacher.user.id;

        break;

      default:
        const existedUser = await this.findUserMustExist(loggedUserId);
        userId = existedUser.id;

        break;
    }

    // Check if email is already existed
    if (email) {
      const existedUserWithSameEmail = await db.user.findFirst({
        where: {
          email: email,
          id: {
            not: userId,
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

    const updateCurrentUserProcess = await db.$transaction(async (prismaTransaction) => {
      try {
        // Update user data
        if (email || password) {
          await prismaTransaction.user.update({
            where: {
              id: userId,
            },
            data: {
              ...(email && { email: email }),
              ...(password && { password: await createBcryptPassword(password) }),
            },
          });
        }

        let updatedUser;

        switch (loggedUserRole) {
          case "PARENT":
            updatedUser = await db.parent.update({
              where: {
                id: loggedUserId,
              },
              data: {
                ...(name && { name: name }),
                ...(profilePicture && {
                  profilePicture: await saveFile(profilePicture, userId, BASE_FILE, IMG_PROFILE_FILE),
                }),
                ...(address && { address: address }),
                ...(gender && { gender: gender }),
              },
              include: {
                user: true,
                student: true,
              },
            });
            return toUserJsonWithRole(updatedUser, { isWithUser: true });

          case "TEACHER":
            updatedUser = await db.teacher.update({
              where: {
                id: loggedUserId,
              },
              data: {
                ...(name && { name: name }),
                ...(profilePicture && {
                  profilePicture: await saveFile(profilePicture, userId, BASE_FILE, IMG_PROFILE_FILE),
                }),
                ...(nip && { nip: nip }),
                ...(address && { address: address }),
                ...(gender && { gender: gender }),
              },
              include: {
                user: true,
                class: true,
              },
            });
            return toUserJsonWithRole(updatedUser, { isWithUser: true, isWithClass: true });
        }
      } catch (error) {
        console.log("Error update user: ", error);
        throw new APIError({
          status: API_STATUS_CODE.BAD_REQUEST,
          message: error.message,
        });
      }
    });

    return updateCurrentUserProcess;
  }

  static async checkToken(token) {
    // Check if token is empty
    if (!token) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Token is required");
    }
    // Check if token is existed
    const existedToken = await db.user.findFirst({
      where: {
        token: token,
      },
    });

    // Check if token is not existed
    if (!existedToken) {
      throw new APIError(API_STATUS_CODE.UNAUTHORIZED, "Unauthorized!");
    }

    // Check if token is expired
    const decodedUser = await decodeJwt(token);

    // Check if user is existed by user id
    const existedUser = await this.findUserMustExist(decodedUser.id);

    // Get User Role Detail
    let loggedUserRoleData;

    // Check if user role is PARENT or TEACHER
    if (existedUser.role === "PARENT") {
      // Get Parent Data
      loggedUserRoleData = await db.parent.findFirst({
        where: {
          userId: existedUser.id,
        },
        include: {
          student: true,
          user: true,
        },
      });

      return toUserJsonWithRole(loggedUserRoleData, { isWithUser: true });
    } else if (existedUser.role === "TEACHER") {
      // Get Teacher Data
      loggedUserRoleData = await db.teacher.findFirst({
        where: {
          userId: existedUser.id,
        },
        include: {
          class: true,
          user: true,
        },
      });
      return toUserJsonWithRole(loggedUserRoleData, { isWithUser: true, isWithClass: true });
    } else if (existedUser.role === "ADMIN") {
      // Get Admin Data
      loggedUserRoleData = await db.admin.findFirst({
        where: {
          userId: existedUser.id,
        },
        include: {
          user: true,
        },
      });
      return toUserJsonWithRole(loggedUserRoleData, { isWithUser: true });
    }
  }

  static async delete(request) {
    const { userId, loggedUserRole } = request;
    // Check if user is allowed to delete
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // Check if user is existed
    const existedUser = await this.findUserMustExist(userId);

    await db.$transaction(async (prismaTrans) => {
      try {
        // Delete user data
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
        await prismaTrans.user.delete({
          where: {
            id: existedUser.id,
          },
        });
      } catch (error) {
        console.error("Error inside transaction delete user:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed delete user!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return existedUser;
  }

  static async logout(request) {
    const { loggedUserId, loggedUserRole } = request;

    let userId;
    let loggedUser;

    switch (loggedUserRole) {
      case "PARENT":
        const existedParent = await ParentService.findParentMustExist(loggedUserId, {
          isWithUser: true,
        });
        userId = existedParent.user.id;
        loggedUser = existedParent;
        break;
      case "TEACHER":
        const existedTeacher = await TeacherService.findTeacherMustExist(loggedUserId, {
          isWithUser: true,
        });
        userId = existedTeacher.user.id;
        loggedUser = existedTeacher;
        break;
      case "ADMIN":
        const existedAdmin = await AdminService.findAdminMustExist(loggedUserId, {
          isWithUser: true,
        });
        userId = existedAdmin.user.id;
        loggedUser = existedAdmin;
        break;
    }

    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        token: null,
      },
    });

    return loggedUser;
  }
}
