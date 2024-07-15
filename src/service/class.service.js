import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";
import { TeacherService } from "./teacher.service.js";

export class ClassService {
  static async checkClassMustBeExist(classId) {
    if (!classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class id is required");
    }

    const existedClass = await db.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        id: true,
        name: true,
        studentClass: {
          select: {
            class: true,
            student: true,
          },
        },
        teacher: {
          select: {
            id: true,
            nip: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        createdAt: true,
      },
    });

    if (!existedClass) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Class not found");
    }

    return existedClass;
  }

  static async checkClassByName(className) {
    if (!className) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class Name is required for check!");
    }

    const existedClassByName = await db.class.findFirst({
      where: {
        name: className,
      },
      select: {
        id: true,
        name: true,
        studentClass: true,
        teacher: {
          select: {
            id: true,
            nip: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        createdAt: true,
      },
    });

    return existedClassByName;
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

    const classes = await db.class.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      select: {
        id: true,
        name: true,
        studentClass: true,
        teacher: {
          select: {
            id: true,
            nip: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        createdAt: true,
      },
    });

    return classes.map((classes) => {
      return {
        id: classes.id,
        name: classes.name,
        teacher: {
          id: classes?.teacher?.id ?? null,
          nip: classes?.teacher?.nip ?? null,
          name: classes?.teacher?.user?.name ?? null,
        },
        studentCount: classes?.studentClass?.length,
        createdAt: classes.createdAt,
      };
    });
  }

  static async findById(request) {
    const { classId } = request;

    const existedClass = await this.checkClassMustBeExist(classId);

    return {
      id: existedClass.id,
      name: existedClass.name,
      teacher: {
        id: existedClass.teacher.id,
        nip: existedClass.teacher.nip,
        name: existedClass.teacher.user.name,
      },
      studentCount: existedClass.studentClass?.length,
      students:
        existedClass.studentClass?.length > 0
          ? existedClass.studentClass.map((std) => {
              return {
                id: std.student.id,
                nisn: std.student.nisn,
                name: std.student.name,
                gender: std.student.gender,
                email: std.student.email,
                no_telp: std.student.no_telp,
              };
            })
          : [],
      createdAt: existedClass.createdAt,
    };
  }

  static async findByTeacherId(request) {
    const { teacherId, loggedUserRole } = request;
    const existedTeacher = await TeacherService.checkTeacherMustBeExist(teacherId);

    const existedTeacherClass = await db.class.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: {
        teacherId: existedTeacher.id,
      },
      select: {
        id: true,
        name: true,
        studentClass: true,
        createdAt: true,
      },
    });

    return {
      countClass: existedTeacherClass.length,
      teacher: {
        id: existedTeacher.id,
        nip: existedTeacher.nip,
        name: existedTeacher.user.name,
      },
      classes: existedTeacherClass.map((classes) => {
        return {
          id: classes.id,
          name: classes.name,
          studentCount: classes.studentClass.length,
          createdAt: classes.createdAt,
        };
      }),
    };
  }

  static async create(request) {
    const { name, teacherId, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    if (!name || !teacherId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class Name and Teacher Id is required!");
    }

    const existedClassByName = await this.checkClassByName(name);

    if (existedClassByName) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class already created!");
    }

    const existedTeacher = await TeacherService.checkTeacherMustBeExist(teacherId);

    const createdClass = await db.class.create({
      data: {
        name: name,
        teacherId: existedTeacher.id,
      },

      select: {
        id: true,
        name: true,
        studentClass: true,
        teacher: {
          select: {
            id: true,
            nip: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        createdAt: true,
      },
    });

    return {
      id: createdClass.id,
      name: createdClass.name,
      teacher: {
        id: createdClass.teacher.id,
        nip: createdClass.teacher.nip,
        name: createdClass.teacher.user.name,
      },
      studentCount: createdClass.studentClass.length,
      createdAt: createdClass.createdAt,
    };
  }

  static async update(request) {
    const { name, classId, teacherId, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedClass = await this.checkClassMustBeExist(classId);

    // if there teacherId, we check existed teacher
    if (teacherId) {
      await TeacherService.checkTeacherMustBeExist(teacherId);
    }

    const updatedClass = await db.class.update({
      where: {
        id: existedClass.id,
      },
      data: {
        name: name ?? existedClass.name,
        teacherId: teacherId ?? existedClass.teacher.id,
      },
      select: {
        id: true,
        name: true,
        studentClass: true,
        teacher: {
          select: {
            id: true,
            nip: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        createdAt: true,
      },
    });

    return {
      id: updatedClass.id,
      name: updatedClass.name,
      teacher: {
        id: updatedClass.teacher.id,
        nip: updatedClass.teacher.nip,
        name: updatedClass.teacher.user.name,
      },
      studentCount: updatedClass.studentClass.length,
      createdAt: updatedClass.createdAt,
    };
  }

  static async delete(request) {
    const { classId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedClass = await ClassService.checkClassMustBeExist(classId);

    await db.class.delete({
      where: {
        id: existedClass.id,
      },
    });

    return true;
  }
}
