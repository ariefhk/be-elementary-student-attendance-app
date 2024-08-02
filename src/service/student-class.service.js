import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";
import { ClassService } from "./class.service.js";
import { StudentService } from "./student.service.js";

function toStudentInClassJSON(
  classes,
  studentClass,
  option = {
    isWithStudent: false,
  }
) {
  return {
    class: {
      id: classes.id,
      name: classes.name,
      teacher: {
        id: classes?.teacher?.id || null,
        nip: classes?.teacher?.nip || null,
        name: classes?.teacher?.name || null,
      },
    },
    studentCount: studentClass?.length || 0,
    ...(option?.isWithStudent
      ? {
          students:
            studentClass?.length > 0
              ? studentClass.map((stdCls) => {
                  return {
                    id: stdCls?.student?.id || null,
                    name: stdCls?.student?.name || null,
                    nisn: stdCls?.student?.nisn || null,
                  };
                })
              : [],
        }
      : {}),
  };
}

function toClassInStudentJSON(
  student,
  studentClass,
  option = {
    isWithClass: false,
  }
) {
  return {
    student: {
      id: student.id,
      name: student.name,
      nisn: student?.nisn || null,
      parent: {
        id: student?.parent?.id || null,
        name: student?.parent?.name || null,
      },
    },
    classCount: studentClass?.length || 0,
    ...(option?.isWithClass
      ? {
          classes:
            studentClass?.length > 0
              ? studentClass.map((stdCls) => {
                  return {
                    id: stdCls?.class?.id || null,
                    name: stdCls?.class?.name || null,
                  };
                })
              : [],
        }
      : {}),
  };
}

function toStudentClassJSON(studentClass) {
  return {
    id: studentClass.id,
    student: {
      id: studentClass?.student?.id || null,
      nisn: studentClass?.student?.nisn || null,
      name: studentClass?.student?.name || null,
    },
    class: {
      id: studentClass?.class?.id || null,
      name: studentClass?.class?.name || null,
    },
  };
}

export class StudentClassService {
  static async findStudentClass(studentId, classId) {
    if (!studentId || !classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student id and class id is required");
    }

    // Check if class is existed
    const existedClass = await ClassService.findClassMustExist(classId);

    // Check if student is existed
    const existedStudent = await StudentService.findStudentMustExist(studentId);

    // Check if student in the class
    const existedStudentClass = await db.studentClass.findFirst({
      where: {
        studentId: existedStudent.id,
        classId: existedClass.id,
      },
      include: {
        student: true,
        class: true,
      },
    });

    if (!existedStudentClass) {
      return null;
    }

    return toStudentClassJSON(existedStudentClass);
  }

  static async findStudentsInClass(request) {
    const { classId, loggedUserRole } = request;

    // Check if user is allowed to access this endpoint
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    // Check if class is existed
    const existedClass = await ClassService.findClassMustExist(classId, {
      isWithTeacher: true,
    });

    // Check if student is existed
    const existedStudent = await db.studentClass.findMany({
      where: {
        classId: existedClass.id,
      },
      include: {
        student: true,
      },
    });

    return toStudentInClassJSON(existedClass, existedStudent, {
      isWithStudent: true,
    });
  }

  static async findClassesOfStudent(request) {
    const { studentId, loggedUserRole } = request;

    // Check if user is allowed to access this endpoint
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    // Check if student is existed
    const existedStudent = await StudentService.findStudentMustExist(studentId, {
      isWithParent: true,
    });

    // Check if student is existed
    const existedClass = await db.studentClass.findMany({
      where: {
        studentId: existedStudent.id,
      },
      include: {
        class: true,
      },
    });

    return toClassInStudentJSON(existedStudent, existedClass, {
      isWithClass: true,
    });
  }

  static async addStudentToClass(request) {
    const { studentId, classId, loggedUserRole } = request;

    // Check if user is allowed to access this endpoint
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    // Check if student in the class
    const existedStudenClass = await this.findStudentClass(studentId, classId);

    // throw error if student already in class
    if (existedStudenClass) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student already in class!");
    }

    // add student to class
    const createStudentClass = await db.studentClass.create({
      data: {
        studentId: studentId,
        classId: classId,
      },
      include: {
        student: true,
        class: true,
      },
    });

    return toStudentClassJSON(createStudentClass);
  }

  static async removeStudentFromClass(request) {
    const { studentId, classId, loggedUserRole } = request;

    // Check if user is allowed to access this endpoint
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    // Check if student in the class
    const existedStudenClass = await this.findStudentClass(studentId, classId);

    // throw error if student already in class
    if (!existedStudenClass) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student not in class!");
    }

    // remove student from class
    await db.studentClass.delete({
      where: {
        id: existedStudenClass.id,
      },
    });

    return existedStudenClass;
  }
}
