import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";
import { ParentService } from "./parent.service.js";
import { toStudentJSON } from "../model/student.model.js";

export class StudentService {
  static async findStudentMustExist(studentId, option = { isWithParent: false, isWithClass: false }) {
    if (!studentId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student id is required");
    }

    const student = await db.student.findUnique({
      where: {
        id: studentId,
      },
      include: {
        studentClass: {
          include: {
            class: true,
          },
        },
        parent: true,
      },
    });

    if (!student) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Student not found!");
    }

    return toStudentJSON(student, option);
  }

  static async findAll(request) {
    const { name, loggedUserRole } = request;

    // Check if user is admin or teacher
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);
    const filter = {};

    // Check if name is existed
    if (name) {
      filter.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    // Find all students
    const students = await db.student.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      include: {
        studentClass: {
          include: {
            class: true,
          },
        },
        parent: true,
      },
    });

    if (!students) {
      return [];
    }

    return students.map((std) => toStudentJSON(std, { isWithParent: true, isWithClass: true }));
  }

  static async findByParentId(request) {
    const { parentId, name, loggedUserRole } = request;

    // Check if user is admin parent
    checkAllowedRole(ROLE.IS_ADMIN_PARENT, loggedUserRole);

    const filter = {};

    // Check if parent is existed
    const existedParent = await ParentService.findParentMustExist(parentId);

    // Check if name is existed
    if (name) {
      filter.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    // Find all students by parent id
    const existedStudentFromParent = await db.student.findMany({
      where: {
        parentId: existedParent.id,
        ...filter,
      },
      include: {
        studentClass: {
          include: {
            class: true,
          },
        },
        parent: true,
      },
    });

    if (!existedStudentFromParent) {
      return [];
    }

    return existedStudentFromParent.map((std) => toStudentJSON(std, { isWithParent: true, isWithClass: true }));
  }

  static async create(request) {
    const { name, nisn, email, no_telp, gender, parentId, loggedUserRole } = request;

    // Check if user is admin or teacher
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    if (!name || !gender) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Name and Gender are required!");
    }

    // Check if parent is existed
    const existedParent = await ParentService.findParentMustExist(parentId);

    // Create student
    const createStudent = await db.student.create({
      data: {
        name: name,
        gender: gender,
        parentId: existedParent.id,
        ...(nisn && { nisn: nisn }),
        ...(email && { email: email }),
        ...(no_telp && { no_telp: no_telp }),
      },
      include: {
        studentClass: {
          include: {
            class: true,
          },
        },
        parent: true,
      },
    });

    return toStudentJSON(createStudent, { isWithParent: true, isWithClass: true });
  }

  static async update(request) {
    const { studentId, name, nisn, email, no_telp, gender, parentId, loggedUserRole } = request;

    // Check if user is admin or teacher
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    // Check if student is existed
    const existedStudent = await StudentService.findStudentMustExist(studentId);

    // Check if parent is existed
    if (parentId) {
      await ParentService.findParentMustExist(parentId);
    }

    const updatedStudent = await db.student.update({
      where: {
        id: existedStudent.id,
      },
      data: {
        ...(name && { name: name }),
        ...(gender && { gender: gender }),
        ...(parentId && { parentId: parentId }),
        ...(nisn && { nisn: nisn }),
        ...(email && { email: email }),
        ...(no_telp && { no_telp: no_telp }),
      },
      include: {
        studentClass: {
          include: {
            class: true,
          },
        },
        parent: true,
      },
    });

    return toStudentJSON(updatedStudent, { isWithParent: true, isWithClass: true });
  }

  static async delete(request) {
    const { studentId, loggedUserRole } = request;

    // Check if user is admin or teacher
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    // Check if student is existed
    const existedStudent = await StudentService.findStudentMustExist(studentId);

    await db.student.delete({
      where: {
        id: existedStudent.id,
      },
    });

    return existedStudent;
  }
}
