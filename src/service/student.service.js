import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";
import { ParentService } from "./parent.service.js";

export class StudentService {
  static async checkStudentMustBeExist(studentId) {
    if (!studentId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student id is required");
    }

    const existedStudent = await db.student.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,
        nisn: true,
        name: true,
        gender: true,
        email: true,
        no_telp: true,
        studentClass: {
          select: {
            class: true,
            student: true,
          },
        },
        parent: {
          select: {
            id: true,
            address: true,
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

    if (!existedStudent) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Student not found");
    }

    return {
      id: existedStudent.id,
      nisn: existedStudent.nisn,
      name: existedStudent.name,
      gender: existedStudent.gender,
      email: existedStudent.email,
      no_telp: existedStudent.no_telp,
      classCount: existedStudent.studentClass.length,
      parent: {
        id: existedStudent.parent.id,
        name: existedStudent.parent.user.name,
        address: existedStudent.parent.address,
      },
      classes:
        existedStudent.studentClass.length > 0
          ? existedStudent.studentClass.map((std) => {
              return {
                id: std.class.id,
                name: std.class.name,
              };
            })
          : [],
      createdAt: existedStudent.createdAt,
    };
  }

  static async findAll(request) {
    const { loggedUserRole, name } = request;
    const filter = {};
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    // Check if name is existed
    if (name) {
      filter.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    const students = await db.student.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      select: {
        id: true,
        nisn: true,
        name: true,
        gender: true,
        email: true,
        no_telp: true,
        studentClass: true,
        parent: {
          select: {
            id: true,
            address: true,
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

    return students.map((std) => {
      return {
        id: std.id,
        nisn: std.nisn,
        name: std.name,
        gender: std.gender,
        email: std.email,
        no_telp: std.no_telp,
        classCount: std?.studentClass?.length,
        parent: {
          id: std?.parent?.id ?? null,
          name: std?.parent?.user?.name ?? null,
          address: std?.parent?.address ?? null,
        },
        createdAt: std.createdAt,
      };
    });
  }

  static async findByAllParentId(request) {
    const { parentId, name, loggedUserRole } = request;
    const filter = {};
    const existedParent = await ParentService.checkParentMustBeExist(parentId);

    // Check if name is existed
    if (name) {
      filter.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    const existedStudentFromParent = await db.student.findMany({
      where: {
        parentId: existedParent.id,
        ...filter,
      },
      select: {
        id: true,
        nisn: true,
        name: true,
        gender: true,
        email: true,
        no_telp: true,
        studentClass: true,
        parent: {
          select: {
            id: true,
            address: true,
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
      countStudent: existedStudentFromParent.length,
      parent: {
        id: existedParent.id,
        nip: existedParent.nip,
        name: existedParent.user.name,
      },
      students: existedStudentFromParent.map((std) => {
        return {
          id: std.id,
          nisn: std.nisn,
          name: std.name,
          gender: std.gender,
          email: std.email,
          no_telp: std.no_telp,
          classCount: std?.studentClass?.length,
          createdAt: std.createdAt,
        };
      }),
    };
  }

  static async findById(request) {
    const { studentId } = request;

    const existedStudent = await this.checkStudentMustBeExist(studentId);

    return existedStudent;
  }

  static async create(request) {
    const { name, nisn, email, no_telp, gender, parentId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    const existedParent = await ParentService.checkParentMustBeExist(parentId);

    const createStudent = await db.student.create({
      data: {
        name: name,
        email: email,
        nisn: nisn,
        no_telp: no_telp,
        gender: gender,
        parentId: existedParent.id,
      },
      select: {
        id: true,
        nisn: true,
        name: true,
        gender: true,
        email: true,
        no_telp: true,
        // studentClass: true,
        studentClass: true,
        parent: {
          select: {
            id: true,
            address: true,
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
      id: createStudent.id,
      nisn: createStudent.nisn,
      name: createStudent.name,
      gender: createStudent.gender,
      email: createStudent.email,
      no_telp: createStudent.no_telp,
      classCount: createStudent?.studentClass?.length,
      parent: {
        id: createStudent?.parent?.id ?? null,
        name: createStudent?.parent?.user?.name ?? null,
        address: createStudent?.parent?.address ?? null,
      },
      createdAt: createStudent.createdAt,
    };
  }

  static async update(request) {
    const { studentId, name, nisn, email, no_telp, gender, parentId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    const existedStudent = await StudentService.checkStudentMustBeExist(studentId);

    if (parentId) {
      await ParentService.checkParentMustBeExist(parentId);
    }

    const updatedStudent = await db.student.update({
      where: {
        id: studentId,
      },
      data: {
        name: name ?? existedStudent.name,
        email: email ?? existedStudent.email,
        nisn: nisn ?? existedStudent.nisn,
        no_telp: no_telp ?? existedStudent.no_telp,
        gender: gender ?? existedStudent.gender,
        parentId: parentId ?? existedStudent.parent.id,
      },
      select: {
        id: true,
        nisn: true,
        name: true,
        gender: true,
        email: true,
        no_telp: true,
        studentClass: true,
        parent: {
          select: {
            id: true,
            address: true,
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
      id: updatedStudent.id,
      nisn: updatedStudent.nisn,
      name: updatedStudent.name,
      gender: updatedStudent.gender,
      email: updatedStudent.email,
      no_telp: updatedStudent.no_telp,
      classCount: updatedStudent?.studentClass?.length,
      parent: {
        id: updatedStudent?.parent?.id ?? null,
        name: updatedStudent?.parent?.user?.name ?? null,
        address: updatedStudent?.parent?.address ?? null,
      },
      createdAt: updatedStudent.createdAt,
    };
  }

  static async delete(request) {
    const { studentId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    const existedStudent = await StudentService.checkStudentMustBeExist(studentId);

    await db.student.delete({
      where: {
        id: existedStudent.id,
      },
    });

    return true;
  }
}
