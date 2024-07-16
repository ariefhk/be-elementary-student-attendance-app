import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";
import { StudentService } from "./student.service.js";
import { ClassService } from "./class.service.js";
import { transformDate, getWeekMonToSaturdayDates } from "../helper/date.helper.js";

export class AttendanceService {
  static async getWeeklyAttendance(request) {
    const { classId, week, month, year, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    if (!week || !month || !year) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "invalid week, month, and year inputted!");
    }

    const listOfWeek = getWeekMonToSaturdayDates(Number(year), Number(month), Number(week));

    if (!classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class Id not inputted!");
    }

    const existedClass = await ClassService.checkClassMustBeExist(classId);

    const existedStudentClass = await db.studentClass.findMany({
      where: {
        classId: existedClass.id,
      },
      select: {
        class: true,
        student: {
          select: {
            id: true,
            nisn: true,
            name: true,
          },
        },
      },
    });

    const attendances = await db.attendance.findMany({
      orderBy: [
        {
          student: {
            name: "asc",
          },
        },
      ],
      where: {
        classId: existedStudentClass.id,
        date: {
          gte: listOfWeek[0],
          lte: listOfWeek[listOfWeek.length - 1],
        },
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

    const attendanceMap = new Map(attendances.map((att) => [`${att.student.id}-${att.date.toISOString().split("T")[0]}`, att]));

    // Prepare the final JSON structure
    const weeklyAttendance = {
      teacher: {
        id: existedClass.teacher.id,
        name: existedClass.teacher.user.name,
      },
      class: {
        id: existedClass.id,
        name: existedClass.name,
      },
      students: [],
    };

    listOfWeek.forEach((date) => {
      existedStudentClass.forEach((stdClass) => {
        const attendanceForDay = [];
        const key = `${stdClass.student.id}-${date.toISOString().split("T")[0]}`;
        if (attendanceMap.has(key)) {
          attendanceForDay.push({
            date: date.toISOString().split("T")[0],
            status: attendanceMap.get(key).status,
          });
        } else {
          attendanceForDay.push({
            date: date.toISOString().split("T")[0],
            status: "ABSENT",
          });
        }
        // Find the stdClass in the current week and update their attendance
        let studentEntry = weeklyAttendance.students.find((s) => s.id === stdClass.student.id);
        if (!studentEntry) {
          studentEntry = {
            id: stdClass.student.id,
            nisn: stdClass.student.nisn,
            name: stdClass.student.name,
            attendance: [],
          };
          weeklyAttendance.students.push(studentEntry);
        }
        studentEntry?.attendance?.push(...attendanceForDay);
      });
    });

    return weeklyAttendance;
  }

  static async getDailyAttendance(request) {
    const { classId, date, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    if (!classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class Id not inputted!");
    }

    const existedClass = await ClassService.checkClassMustBeExist(classId);

    const existedStudentClass = await db.studentClass.findMany({
      where: {
        classId: existedClass.id,
      },
      select: {
        class: true,
        student: {
          select: {
            id: true,
            nisn: true,
            name: true,
          },
        },
      },
    });

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
        classId: existedStudentClass.id,
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
    existedStudentClass.forEach((stdClass, index) => {
      if (attendanceMap.has(stdClass.student.id)) {
        attd.push({
          ...attendanceMap.get(stdClass.student.id),
        });
      } else {
        const defaultAttendance = {
          status: "ABSENT",
          date: transformDate(date),
          student: {
            id: stdClass.student.id,
            nisn: stdClass.student.nisn,
            name: stdClass.student.name,
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

  static async createOrUpdateMany(request) {
    const { classId, date, studentAttendances, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    if (!date) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "date not inputted!");
    }

    if (!classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class Id not inputted!");
    }

    if (!studentAttendances) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Students not inputted!");
    }

    // Fetch all student IDs for the class
    const allStudents = await db.student.findMany({
      where: {
        classId: classId,
      },
      select: {
        id: true,
      },
    });

    // Create a map of student IDs for quick lookup
    const studentMap = new Map(allStudents.map((student) => [student.id, student]));

    // Validate that all student IDs are valid
    studentAttendances.forEach((student) => {
      if (!studentMap.has(student.studentId)) {
        throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student not found in the class!");
      }
    });

    // Fetch all attendance records for the class and date
    const allAttendances = await db.attendance.findMany({
      where: {
        classId: classId,
        date: new Date(date),
      },
    });

    // Create a map of attendance records by studentId for quick lookup
    const attendanceMap = new Map(allAttendances.map((attendance) => [attendance.studentId, attendance]));

    // Prepare batch operations
    const updateAttendances = [];
    const createAttendances = [];

    // Iterate over the studentAttendances and compare with existing attendance records
    for (const student of studentAttendances) {
      // Get the student's attendance record
      const studentAttendance = attendanceMap.get(student.studentId);

      if (!studentAttendance) {
        createAttendances.push({
          data: {
            status: student.status,
            date: new Date(date),
            classId: classId,
            studentId: student.studentId,
          },
        });
      } else {
        if (student.status !== undefined && student.status !== studentAttendance.status) {
          updateAttendances.push({
            where: { id: studentAttendance.id },
            data: { status: student.status ?? studentAttendance.status },
          });
        }
      }
    }

    // Execute batch updateAttendances
    for (const update of updateAttendances) {
      await db.attendance.update(update);
    }

    // Execute batch createAttendances
    for (const create of createAttendances) {
      await db.attendance.create({ data: create });
    }

    return {
      date: new Date(date),
      classId: classId,
      studentAttendances: studentAttendances.map((student) => {
        return {
          studentId: student.studentId,
          status: student.status,
        };
      }),
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
        classId: classId,
        date: new Date(date),
        studentId: studentId,
      },
    });

    // Create a map of student IDs for quick lookup
    const studentAttendanceMap = new Map(Object.keys(studentAttendance).map((key) => [key, studentAttendance[key]]));

    let createOrUpdateAttendance;

    if (studentAttendanceMap.size === 0) {
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
