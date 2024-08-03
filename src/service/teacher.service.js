import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";
import { UserService } from "./user.service.js";
import { createBcryptPassword } from "../helper/hashing.helper.js";
import { toTeacherJSON } from "../model/teacher.model.js";
import { saveFile } from "../helper/file.helper.js";
import { BASE_FILE, IMG_PROFILE_FILE } from "../constants/file-directory.js";

export class TeacherService {
  static async findTeacherMustExist(teacherId, option = { isWithUser: false, isWithClass: false }) {
    // Check if teacher id is existed
    if (!teacherId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Teacher id is required");
    }

    const teacher = await db.teacher.findUnique({
      where: {
        id: teacherId,
      },
      include: {
        user: true,
        class: true,
      },
    });

    if (!teacher) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Teacher not found");
    }

    return toTeacherJSON(teacher, option);
  }

  static async findById(request) {
    const { loggedUserRole, teacherId } = request;

    // Check if logged user is admin
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    // check if teacher is existed
    const existedTeacher = await this.findTeacherMustExist(teacherId);

    return existedTeacher;
  }

  static async findAll(request) {
    const { loggedUserRole, name } = request;
    // Check if logged user is admin
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // Filter teacher by name
    const filter = {};

    // Check if name is existed
    if (name) {
      filter.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    const teachers = await db.teacher.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      include: {
        user: true,
        class: true,
      },
    });

    return teachers.map((user) => toTeacherJSON(user, { isWithUser: true, isWithClass: true }));
  }

  static async create(request) {
    const { email, password, name, nip, address, profilePicture, gender, loggedUserRole } = request;

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

    const createTeacherProcess = await db.$transaction(async (prismaTrans) => {
      try {
        // Update token
        const createdUser = await prismaTrans.user.create({
          data: { email, password: hashedPassword, role: "TEACHER" },
        });

        // Create teacher
        const createdTeacher = await prismaTrans.teacher.create({
          data: {
            userId: createdUser.id,
            name,
            gender,
            ...(profilePicture && {
              profilePicture: await saveFile(profilePicture, createdUser.id, BASE_FILE, IMG_PROFILE_FILE),
            }),
            ...(nip && { nip: nip }),
            ...(address && { address: address }),
          },
          include: {
            user: true,
            class: true,
          },
        });

        return toTeacherJSON(createdTeacher, { isWithUser: true, isWithClass: true });
      } catch (error) {
        console.error("Error inside transaction create teacher:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed login user!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return createTeacherProcess;
  }

  static async update(request) {
    const { teacherId, email, password, name, profilePicture, nip, address, gender, loggedUserRole } = request;

    // Check if logged user is admin
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // check if teacher is existed
    const existedTeacher = await this.findTeacherMustExist(teacherId, { isWithUser: true });

    // Check if email is already existed
    if (email) {
      const existedUserWithSameEmail = await db.user.findFirst({
        where: {
          email: email,
          id: {
            not: existedTeacher.user.id,
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

    const updateTeacherProcess = await db.$transaction(async (prismaTransaction) => {
      try {
        // Update user data
        if (email || password) {
          await prismaTransaction.user.update({
            where: {
              id: existedTeacher.user.id,
            },
            data: {
              ...(email && { email: email }),
              ...(password && { password: await createBcryptPassword(password) }),
            },
          });
        }

        // Update teacher data
        const updatedTeacher = await db.teacher.update({
          where: {
            id: existedTeacher.id,
          },
          data: {
            ...(name && { name: name }),
            ...(gender && { gender: gender }),
            ...(nip && { nip: nip }),
            ...(profilePicture && {
              profilePicture: await saveFile(profilePicture, createdUser.id, BASE_FILE, IMG_PROFILE_FILE),
            }),
            ...(address && { address: address }),
          },
          include: {
            user: true,
            class: true,
          },
        });

        return toTeacherJSON(updatedTeacher, { isWithUser: true, isWithClass: true });
      } catch (error) {
        console.log("Error update teacher: ", error);
        throw new APIError({
          status: API_STATUS_CODE.BAD_REQUEST,
          message: error.message,
        });
      }
    });

    return updateTeacherProcess;
  }

  static async delete(request) {
    const { loggedUserRole, teacherId } = request;
    // Check if logged user is admin
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // check if teacher is existed
    const existedTeacher = await this.findTeacherMustExist(teacherId, { isWithUser: true });

    await db.$transaction(async (prismaTrans) => {
      try {
        // Delete teacher data
        await prismaTrans.teacher.delete({
          where: {
            id: existedTeacher.id,
          },
        });

        // Delete user data
        await prismaTrans.user.delete({
          where: {
            id: existedTeacher.user.id,
          },
        });
      } catch (error) {
        console.error("Error inside transaction delete teacher:", error.message);
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "failed delete teacher!"); // Re-throw to ensure transaction is rolled back
      }
    });

    return existedTeacher;
  }
}
