import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";
import { UserService } from "./user.service.js";

export class TeacherService {
  static async checkTeacherMustBeExistByUserId(userId) {
    if (!userId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "User id is required");
    }

    const existedTeacher = await db.teacher.findFirst({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        nip: true,
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

    if (!existedTeacher) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Teacher not found");
    }

    return existedTeacher;
  }

  static async checkTeacherMustBeExist(teacherId) {
    if (!teacherId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Teacher id is required");
    }

    const existedTeacher = await db.teacher.findUnique({
      where: {
        id: teacherId,
      },
      select: {
        id: true,
        nip: true,
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

    if (!existedTeacher) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Teacher not found");
    }

    return existedTeacher;
  }

  static async findAll(request) {
    const { loggedUserRole, name } = request;
    const filter = {};
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // Check if name is existed
    if (name) {
      filter.user = {
        name: {
          contains: name,
          mode: "insensitive",
        },
      };
    }

    const teachers = await db.teacher.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      select: {
        id: true,
        nip: true,
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

    return teachers.map((user) => {
      return {
        id: user?.id,
        name: user?.user?.name,
        photo: user?.user?.photo,
        email: user?.user?.email,
        nip: user?.nip,
        address: user?.address,
        createdAt: user?.createdAt,
      };
    });
  }

  static async findById(request) {
    const { loggedUserRole, teacherId } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // check if teacher is existed
    const existedTeacher = await this.checkTeacherMustBeExist(teacherId);

    return {
      id: existedTeacher.id,
      name: existedTeacher.user.name,
      photo: existedTeacher.user.photo,
      email: existedTeacher.user.email,
      nip: existedTeacher.nip,
      address: existedTeacher.address,
      createdAt: existedTeacher.createdAt,
    };
  }

  static async findByUserId(request) {
    const { loggedUserRole, userId } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // check if teacher is existed
    const existedTeacher = await this.checkTeacherMustBeExistByUserId(userId);

    return {
      id: existedTeacher.id,
      name: existedTeacher.user.name,
      photo: existedTeacher.user.photo,
      email: existedTeacher.user.email,
      nip: existedTeacher.nip,
      address: existedTeacher.address,
      createdAt: existedTeacher.createdAt,
    };
  }

  static async create(request) {
    const { loggedUserRole, name, email, photo, nip, address, password } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const createTeacherObj = {
      name: name,
      email: email,
      photo: photo,
      nip: nip,
      address: address,
      password: password,
      role: "TEACHER",
      loggedUserRole: loggedUserRole,
    };

    const teacher = await UserService.create(createTeacherObj);

    return teacher;
  }

  static async update(request) {
    const { loggedUserRole, teacherId, name, email, photo, nip, address, password } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // check if teacher is existed
    const existedTeacher = await this.checkTeacherMustBeExist(teacherId);

    const updateTeacherObj = {
      userId: existedTeacher.user.id,
      loggedUserRole: loggedUserRole,
      name: name,
      email: email,
      photo: photo,
      nip: nip,
      address: address,
      password: password,
    };

    const teacher = await UserService.update(updateTeacherObj);

    return teacher;
  }

  static async delete(request) {
    const { loggedUserRole, teacherId } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // check if teacher is existed
    const existedTeacher = await this.checkTeacherMustBeExist(teacherId);

    await UserService.delete({
      userId: existedTeacher.user.id,
      loggedUserRole: loggedUserRole,
    });

    return true;
  }
}
