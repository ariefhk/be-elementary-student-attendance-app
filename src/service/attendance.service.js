import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";
import { StudentService } from "./student.service.js";
import { ClassService } from "./class.service.js";
import { transformDate } from "../helper/date.helper.js";

export class AttendanceService {
  static async getAttendanceDaitails(request) {
    const { classId, studentId, date, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    if (!classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class Id not inputted!");
    }

    const existedClass = await ClassService.checkClassMustBeExist(classId);

    if (!studentId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student Id not inputted!");
    }

    const existedStudent = await StudentService.checkStudentMustBeExist(studentId);

    if (!date) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "date not inputted!");
    }

    const attendances = await db.attendance.findMany({
      orderBy: [
        {
          student: {
            name: "asc",
          },
        },
      ],
      where: {
        classId: existedClass.id,
        date: transformDate(date),
      },
      select: {
        id: true,
        status: true,
        date: true,
        student: {
          select: {
            id: true,
            nisn: true,
            name: true,
          },
        },
      },
    });

    // Create a map of student ID to attendance record for quick lookup
    const attendanceMap = new Map(attendances.map((att) => [att.student.id, att]));

    const attd = [];

    // Prepare the final list of attendance records, including defaults for missing students
    existedClass.student.forEach((student, index) => {
      if (attendanceMap.has(student.id)) {
        attd.push({
          no_student: index + 1,
          ...attendanceMap.get(student.id),
        });
      } else {
        const defaultAttendance = {
          no_student: index + 1,
          status: "ABSENT",
          date: transformDate(request?.date),
          student: {
            id: student.id,
            nisn: student.nisn,
            name: student.name,
          },
        };
        attd.push(defaultAttendance);
      }
    });

    return {
      date: transformDate(date),
      teacher: {
        id: existedClass.teacher?.id,
        name: existedClass.teacher?.user?.name,
      },
      class: existedClass.name,
      student_attendance:
        attd.length > 0
          ? attd.sort((a, b) => {
              if (a.student.name < b.student.name) return -1;
              if (a.student.name > b.student.name) return 1;
              return 0;
            })
          : [],
    };
  }

  static async createOrUpdate(request) {
    const { classId, studentId, date, status, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    if (!date) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "date not inputted!");
    }

    if (!status) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "absent status not inputted!");
    }

    if (!classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class Id not inputted!");
    }

    const existedClass = await ClassService.checkClassMustBeExist(classId);

    if (!studentId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student Id not inputted!");
    }

    const existedStudent = await StudentService.checkStudentMustBeExist(studentId);

    const studentAttendance = await db.attendance.findFirst({
      where: {
        classId: request?.classId,
        date: new Date(request?.date),
        studentId: request?.studentId,
      },
    });

    let createOrUpdateAttendance;

    if (!studentAttendance) {
      createOrUpdateAttendance = await db.attendance.create({
        data: {
          status: status,
          date: new Date(date),
          classId: existedClass.id,
          studentId: existedStudent.id,
        },
        select: {
          id: true,
          status: true,
          date: true,
          student: true,
          createdAt: true,
        },
      });
    } else {
      createOrUpdateAttendance = await db.attendance.update({
        where: {
          id: studentAttendance.id,
        },
        data: {
          status: status,
          date: new Date(date),
        },
        select: {
          status: true,
          date: true,
          student: {
            select: {
              id: true,
              nisn: true,
              name: true,
            },
          },
        },
      });
    }

    return {
      date: createOrUpdateAttendance.date,
      status: createOrUpdateAttendance.status,
      student: {
        id: createOrUpdateAttendance.student.id,
        nisn: createOrUpdateAttendance.student.nisn,
        name: createOrUpdateAttendance.student.name,
      },
    };
  }
}
