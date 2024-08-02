import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";
import { StudentService } from "./student.service.js";
import { ClassService } from "./class.service.js";
import { transformDate, getWeekMonToSaturdayDates } from "../helper/date.helper.js";
import { getAllWeeksInMonth } from "../helper/date.helper.js";

export class AttendanceService {
  static async getWeeklyAttendance(request) {
    const { classId, week, month, year, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    if (!week || !month || !year) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "invalid week, month, and year inputted!");
    }

    const listOfWeek = getWeekMonToSaturdayDates(Number(year), Number(month), Number(week));

    const existedClass = await ClassService.findClassMustExist(classId);

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
        id: existedClass?.teacher?.id || null,
        name: existedClass?.teacher?.name || null,
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
        const status = attendanceMap.get(key)?.status;

        // Find the stdClass in the current week and update their attendance
        let studentEntry = weeklyAttendance.students.find((s) => s.id === stdClass.student.id);
        if (!studentEntry) {
          studentEntry = {
            id: stdClass.student.id,
            nisn: stdClass.student.nisn,
            name: stdClass.student.name,
            attendance: [],
            percentagePresent: 0,
            presentCount: 0, // Temporary property to calculate percentagePresent
            validDayCount: 0, // Temporary property to calculate percentagePresent
          };
          weeklyAttendance.students.push(studentEntry);
        }

        if (attendanceMap.has(key)) {
          if (status !== "HOLIDAY") {
            studentEntry.validDayCount++;
            if (status === "PRESENT") {
              studentEntry.presentCount++;
            }
            attendanceForDay.push({
              date: date.toISOString().split("T")[0],
              status,
            });
          } else {
            attendanceForDay.push({
              date: date.toISOString().split("T")[0],
              status: "HOLIDAY",
            });
          }
        } else {
          studentEntry.validDayCount++;
          attendanceForDay.push({
            date: date.toISOString().split("T")[0],
            status: "ABSENT",
          });
        }

        studentEntry.attendance.push(...attendanceForDay);
      });
    });

    // After processing all attendance data, calculate the percentagePresent for each student
    weeklyAttendance.students.forEach((student) => {
      if (student.validDayCount > 0) {
        student.percentagePresent = Number((student.presentCount / student.validDayCount) * 100).toFixed(2);
      }
      // Remove the temporary presentCount and validDayCount properties
      delete student.presentCount;
      delete student.validDayCount;
    });

    return weeklyAttendance;
  }

  static async getDailyAttendance(request) {
    const { classId, date, loggedUserRole } = request;

    // Check if the user is allowed to access this endpoint
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    // Check if the date is inputted
    const existedClass = await ClassService.findClassMustExist(classId);

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

    let presentCount = 0; // Temporary property to calculate percentagePresent
    let validDayCount = 0; // Temporary property to calculate percentagePresent

    // Prepare the final list of attendance records, including defaults for missing students
    existedStudentClass.forEach((stdClass, index) => {
      const key = stdClass?.student?.id;
      const status = attendanceMap.get(key)?.status;
      if (attendanceMap.has(key)) {
        if (status !== "HOLIDAY") {
          validDayCount++;
          if (status === "PRESENT") {
            presentCount++;
          }
          attd.push({
            ...attendanceMap.get(key),
            status,
          });
        } else {
          attd.push({
            ...attendanceMap.get(key),
            status: "HOLIDAY",
          });
        }
      } else {
        validDayCount++;
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
        id: existedClass?.teacher?.id || null,
        name: existedClass?.teacher?.name || null,
      },
      class: {
        id: existedClass.id,
        name: existedClass.name,
      },
      percentagePresent: validDayCount > 0 ? Number((presentCount / validDayCount) * 100).toFixed(2) : 0,
      attendance:
        attd.length > 0
          ? attd.sort((a, b) => {
              if (a.student.name < b.student.name) return -1;
              if (a.student.name > b.student.name) return 1;
              return 0;
            })
          : [],
    };
  }

  static async getStudentWeeklyAttendance(request) {
    const { classId, studentId, week, month, year, loggedUserRole } = request;

    if (!week || !month || !year) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "invalid week, month, and year inputted!");
    }

    const listOfWeek = getWeekMonToSaturdayDates(Number(year), Number(month), Number(week));

    const existedStudent = await StudentService.findStudentMustExist(studentId);

    const existedClass = await ClassService.findClassMustExist(classId);

    const existedStudentClass = await db.studentClass.findMany({
      where: {
        classId: existedClass.id,
        studentId: existedStudent.id,
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

    if (!existedStudentClass) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student not found in the class!");
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
        studentId: existedStudent.id,
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
        id: existedClass?.teacher?.id || null,
        name: existedClass?.teacher?.name || null,
      },
      class: {
        id: existedClass?.id || null,
        name: existedClass?.name || null,
      },
      attendance: [],
      percentagePresent: 0,
      presentCount: 0, // Temporary property to calculate percentagePresent
      validDayCount: 0, // Temporary property to calculate percentagePresent
    };

    // Iterate over the list of dates in the week
    listOfWeek.forEach((date) => {
      // Find the student in the current week and update their attendance
      const attendanceForDay = [];
      const key = `${existedStudent.id}-${date.toISOString().split("T")[0]}`;
      const status = attendanceMap.get(key)?.status;

      // Find the stdClass in the current week and update their attendance
      if (attendanceMap.has(key)) {
        if (status !== "HOLIDAY") {
          weeklyAttendance.validDayCount++;
          if (status === "PRESENT") {
            weeklyAttendance.presentCount++;
          }
          attendanceForDay.push({
            date: date.toISOString().split("T")[0],
            status,
          });
        } else {
          attendanceForDay.push({
            date: date.toISOString().split("T")[0],
            status: "HOLIDAY",
          });
        }
      } else {
        weeklyAttendance.validDayCount++;
        attendanceForDay.push({
          date: date.toISOString().split("T")[0],
          status: "ABSENT",
        });
      }

      weeklyAttendance.attendance.push(...attendanceForDay);
    });

    // After processing all attendance data, calculate the percentagePresent for each student
    if (weeklyAttendance.validDayCount > 0) {
      weeklyAttendance.percentagePresent = Number((weeklyAttendance.presentCount / weeklyAttendance.validDayCount) * 100).toFixed(
        2
      );
    }
    // Remove the temporary presentCount and validDayCount properties
    delete weeklyAttendance.presentCount;
    delete weeklyAttendance.validDayCount;

    return weeklyAttendance;
  }

  static async getStudentMonthlyAttendance(request) {
    const { classId, studentId, month, year, loggedUserRole } = request;

    const existedStudent = await StudentService.findStudentMustExist(studentId);

    const existedClass = await ClassService.findClassMustExist(classId);

    const existedStudentClass = await db.studentClass.findMany({
      where: {
        classId: existedClass.id,
        studentId: existedStudent.id,
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

    if (!existedStudentClass) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student not found in the class!");
    }

    if (!month || !year) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "invalid month and year inputted!");
    }

    const allWeek = getAllWeeksInMonth(Number(year), Number(month));
    const formattedAllWeek = allWeek.map((week) => {
      return {
        numOfTheWeek: week.numOfTheWeek,
        startDate: week.week[0],
        endDate: week.week[week.week.length - 1],
        weeks: week.week,
      };
    });

    const finalResult = await Promise.all(
      formattedAllWeek.map(async (week) => {
        const attendances = await db.attendance.findMany({
          orderBy: [
            {
              student: {
                name: "asc",
              },
            },
          ],
          where: {
            studentId: existedStudent.id,
            classId: existedStudentClass.id,
            date: {
              gte: week.startDate,
              lte: week.endDate,
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

        const attendanceMap = new Map(
          attendances.map((att) => [`${att.student.id}-${att.date.toISOString().split("T")[0]}`, att])
        );

        // Prepare the final JSON structure
        const weeklyAttendance = {
          numOfTheWeek: week.numOfTheWeek,
          attendance: [],
          percentagePresent: 0,
          presentCount: 0, // Temporary property to calculate percentagePresent
          validDayCount: 0, // Temporary property to calculate percentagePresent
        };

        // Iterate over the list of dates in the week
        week.weeks.forEach((date) => {
          // Find the student in the current week and update their attendance
          const attendanceForDay = [];
          const key = `${existedStudent.id}-${date.toISOString().split("T")[0]}`;
          const status = attendanceMap.get(key)?.status;

          // Find the stdClass in the current week and update their attendance
          if (attendanceMap.has(key)) {
            if (status !== "HOLIDAY") {
              weeklyAttendance.validDayCount++;
              if (status === "PRESENT") {
                weeklyAttendance.presentCount++;
              }
              attendanceForDay.push({
                date: date.toISOString().split("T")[0],
                status,
              });
            } else {
              attendanceForDay.push({
                date: date.toISOString().split("T")[0],
                status: "HOLIDAY",
              });
            }
          } else {
            weeklyAttendance.validDayCount++;
            attendanceForDay.push({
              date: date.toISOString().split("T")[0],
              status: "ABSENT",
            });
          }

          weeklyAttendance.attendance.push(...attendanceForDay);
        });

        // After processing all attendance data, calculate the percentagePresent for each student
        if (weeklyAttendance.validDayCount > 0) {
          weeklyAttendance.percentagePresent = Number(
            (weeklyAttendance.presentCount / weeklyAttendance.validDayCount) * 100
          ).toFixed(2);
        }
        // Remove the temporary presentCount and validDayCount properties
        delete weeklyAttendance.presentCount;
        delete weeklyAttendance.validDayCount;

        return weeklyAttendance;
      })
    );

    return finalResult;
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

    const existedClass = await ClassService.findClassMustExist(classId);

    // Fetch all student IDs for the class
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

    // Create a map of student IDs for quick lookup
    const studentMap = new Map(existedStudentClass.map((stdClass) => [stdClass.student.id, stdClass]));

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
          status: student.status,
          date: new Date(date),
          classId: classId,
          studentId: student.studentId,
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

    const existedClass = await ClassService.findClassMustExist(classId);

    if (!studentId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Student Id not inputted!");
    }

    const existedStudent = await StudentService.findStudentMustExist(studentId);

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
