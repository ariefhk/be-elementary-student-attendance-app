import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";
import { StudentService } from "./student.service.js";
import { ClassService } from "./class.service.js";
import { transformDate, getWeekMonToSaturdayDates, formattedDate, getAllWeeksInMonth } from "../helper/date.helper.js";
import { handleStatusPresence } from "../helper/presence-status.helper.js";
import { PdfService } from "./pdf.service.js";

export class AttendanceService {
  static async getWeeklyAttendance(request) {
    const { classId, week, month, year, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN_TEACHER, loggedUserRole);

    if (!week || !month || !year) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "invalid week, month, and year inputted!");
    }

    const listOfWeek = getWeekMonToSaturdayDates(Number(year), Number(month), Number(week));

    console.log("listOfWeek", listOfWeek);

    const existedClass = await ClassService.findClassMustExist(classId, {
      isWithTeacher: true,
    });

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

  static async downloadWeeklyAttendance(request, response) {
    const { classId, week, month, year } = request;

    if (!week || !month || !year) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "invalid week, month, and year inputted!");
    }

    const listOfWeek = getWeekMonToSaturdayDates(Number(year), Number(month), Number(week));

    const existedClass = await ClassService.findClassMustExist(classId, {
      isWithTeacher: true,
    });

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

    const formatterListOfWeek = listOfWeek.map((d) => {
      return { text: formattedDate(d, true), bold: true, fontSize: "12", align: "center" };
    });

    const handleStatusPresence = (status) => {
      switch (status) {
        case "PRESENT":
          return "Hadir";
        case "ABSENT":
          return "Tidak Hadir";
        case "HOLIDAY":
          return "Libur";
      }
    };

    const editedFormatStudentsPresence = weeklyAttendance.students.map((student, index) => {
      const att = student.attendance.map((att) => {
        return { text: handleStatusPresence(att.status), fontSize: "12" };
      });

      return [
        { text: index + 1, fontSize: "12" },
        { text: student.nisn, fontSize: "12" },
        { text: student.name, fontSize: "12" },
        ...att,
        { text: student.percentagePresent, fontSize: "12" },
      ];
    });

    const table = {
      width: "100%",
      style: "regular",
      table: {
        headerRows: 0,
        widths: ["4%", "14%", "16%", "*", "*", "*", "*", "*", "*", "*"],
        body: [
          [
            { text: "No", bold: true, fontSize: 12, alignment: "center", margin: [0, 5, 0, 5] },
            { text: "Nisn", bold: true, fontSize: 12, alignment: "center", margin: [0, 5, 0, 5] },
            { text: "Name", bold: true, fontSize: 12, alignment: "center", margin: [0, 5, 0, 5] },
            ...formatterListOfWeek,
            { text: "Persentase", bold: true, fontSize: 12, alignment: "center", margin: [0, 5, 0, 5] },
          ],
          ...editedFormatStudentsPresence.map((row) =>
            row.map((cell) => {
              if (typeof cell === "object" && cell.text) {
                return { ...cell, alignment: "center", margin: [0, 5, 0, 5], noWrap: true };
              }
              return cell;
            })
          ),
        ],
      },
      layout: {
        // paddingLeft: function(i, node) { return 2; },
        // paddingRight: function(i, node) { return 2; },
        paddingTop: function (i, node) {
          return 2;
        },
        paddingBottom: function (i, node) {
          return 2;
        },
      },
    };

    const PdfDefinition = {
      //  pageMargins: [10,10,10,10],
      pageOrientation: "landscape",
      pageSize: "A4",
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 16,
          bold: true,
          margin: [0, 10, 0, 5],
        },
        tableExample: {
          margin: [0, 5, 0, 15],
        },
        tableHeader: {
          bold: true,
          fontSize: 13,
          color: "black",
        },
      },
      content: [
        {
          text: "Data Absensi Siswa",
          style: "header",
          margin: [0, 4, 0, 30],
          alignment: "center",
        },
        {
          text: `Guru: ${existedClass?.teacher?.name ?? "_"}`,
          margin: [0, 0, 0, 6],
          fontSize: "12",
        },
        {
          text: `Kelas: ${existedClass.name}`,
          margin: [0, 0, 0, 6],
          fontSize: "12",
        },
        {
          text: `Periode: ${formattedDate(listOfWeek[0], true)} - ${formattedDate(listOfWeek[listOfWeek.length - 1], true)}`,
          fontSize: "12",
          margin: [0, 0, 0, 50],
        },

        table,
      ],
    };

    return await PdfService.sendPdf(PdfDefinition, `Absensi Siswa Kelas ${existedClass.name}.pdf`, response);
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

  static async downloadDailyAttendance(request, response) {
    // playground requires you to assign document definition to a variable called dd
    const MONTH_STR = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const DAY_STR = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    const listOfWeek = [
      "2024-07-29T00:00:00.000Z",
      "2024-07-30T00:00:00.000Z",
      "2024-07-31T00:00:00.000Z",
      "2024-08-01T00:00:00.000Z",
      "2024-08-02T00:00:00.000Z",
      "2024-08-03T00:00:00.000Z",
    ];

    const formattedDate = (dates, isNeedYear = false) => {
      const date = new Date(dates);

      // Get the day and month strings
      const day = DAY_STR[date.getDay()];

      // Get the month string
      const month = MONTH_STR[date.getMonth()];

      // Return the formatted date string
      return isNeedYear ? `${day}, ${date.getDate()} ${month} ${date.getFullYear()}` : `${date.getDate()} ${month}, ${day}`;
    };

    const formatterListOfWeek = listOfWeek.map((d) => {
      return { text: formattedDate(d, true), bold: true, fontSize: "12", align: "center" };
    });

    const handleStatusPresence = (status) => {
      switch (status) {
        case "PRESENT":
          return "Hadir";
        case "ABSENT":
          return "Tidak Hadir";
        case "HOLIDAY":
          return "Libur";
      }
    };

    const students = [
      {
        id: 2,
        nisn: "344121",
        name: "Alex",
        attendance: [
          {
            date: "2024-07-29",
            status: "ABSENT",
          },
          {
            date: "2024-07-30",
            status: "ABSENT",
          },
          {
            date: "2024-07-31",
            status: "ABSENT",
          },
          {
            date: "2024-08-01",
            status: "ABSENT",
          },
          {
            date: "2024-08-02",
            status: "ABSENT",
          },
          {
            date: "2024-08-03",
            status: "ABSENT",
          },
        ],
        percentagePresent: "0.00",
      },
      {
        id: 1,
        nisn: "1234",
        name: "Budi",
        attendance: [
          {
            date: "2024-07-29",
            status: "ABSENT",
          },
          {
            date: "2024-07-30",
            status: "ABSENT",
          },
          {
            date: "2024-07-31",
            status: "ABSENT",
          },
          {
            date: "2024-08-01",
            status: "ABSENT",
          },
          {
            date: "2024-08-02",
            status: "ABSENT",
          },
          {
            date: "2024-08-03",
            status: "ABSENT",
          },
        ],
        percentagePresent: "0.00",
      },
    ];

    const attd = [
      {
        status: "ABSENT",
        date: "2024-08-02T00:00:00.000Z",
        student: {
          id: 2,
          nisn: "344121",
          name: "Alex",
        },
      },
      {
        status: "ABSENT",
        date: "2024-08-02T00:00:00.000Z",
        student: {
          id: 1,
          nisn: "1234",
          name: "Budi",
        },
      },
    ];

    const attdFormatted = attd.map((item, index) => {
      return [
        { text: index + 1, alignment: "center", fontSize: "12" },
        { text: item.student.nisn, alignment: "center", fontSize: "12" },
        { text: item.student.name, alignment: "center", fontSize: "12" },
        { text: item.status, alignment: "center", fontSize: "12" },
      ];
    });

    const table = {
      width: "100%",
      style: "regular",
      table: {
        headerRows: 0,
        widths: ["8%", "20%", "*", "*"],
        // widths: ["4%", "14%", "16%", "*", "*", "*", "*", "*", "*", "*"],
        body: [
          [
            { text: "No", bold: true, fontSize: 12, alignment: "center", margin: [0, 5, 0, 5] },
            { text: "Nisn", bold: true, fontSize: 12, alignment: "center", margin: [0, 5, 0, 5] },
            { text: "Nama", bold: true, fontSize: 12, alignment: "center", margin: [0, 5, 0, 5] },
            { text: "Status", bold: true, fontSize: 12, alignment: "center", margin: [0, 5, 0, 5] },
          ],
          ...attdFormatted,
        ],
      },
      layout: {
        // paddingLeft: function(i, node) { return 2; },
        // paddingRight: function(i, node) { return 2; },
        paddingTop: function (i, node) {
          return 2;
        },
        paddingBottom: function (i, node) {
          return 2;
        },
      },
    };

    var dd = {
      //  pageMargins: [10,10,10,10],

      pageSize: "A4",
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 16,
          bold: true,
          margin: [0, 10, 0, 5],
        },
        tableExample: {
          margin: [0, 5, 0, 15],
        },
        tableHeader: {
          bold: true,
          fontSize: 13,
          color: "black",
        },
      },
      content: [
        {
          text: "Data Absensi Siswa",
          style: "header",
          margin: [0, 4, 0, 30],
          alignment: "center",
        },
        {
          text: "Guru: Salsa",
          margin: [0, 0, 0, 6],
          fontSize: "12",
        },
        {
          text: "Kelas: MIPA 2",
          margin: [0, 0, 0, 6],
          fontSize: "12",
        },
        {
          text: "Periode: 29 - 03 Juli",
          fontSize: "12",
          margin: [0, 0, 0, 50],
        },

        table,
      ],
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

    const attdFormat = weeklyAttendance.attendance.map((d, index) => [
      { text: String(index + 1), fontSize: "12" },
      { text: formattedDate(d.date, true), fontSize: "12" },
      { text: handleStatusPresence(d.status), fontSize: "12" },
    ]);

    const table = {
      width: "100%",
      alignment: "center",
      style: "regular",
      table: {
        headerRows: 0,
        body: [
          [
            { text: "No", bold: true, fontSize: "12" },
            { text: "Tanggal", bold: true, fontSize: "12" },
            { text: "Status", bold: true, fontSize: "12" },
          ],
          ...attdFormat,
          [
            { text: "Persentase Kehadiran", bold: true, colSpan: 2, alignment: "center", fontSize: "12" },
            {},
            { text: "80%", alignment: "center", fontSize: "12" },
          ],
        ],
        widths: ["8%", "*", "*"],
      },
      layout: {
        // paddingLeft: function(i, node) { return 2; },
        // paddingRight: function(i, node) { return 4; },
        paddingTop: function (i, node) {
          return 8;
        },
        paddingBottom: function (i, node) {
          return 8;
        },
      },
    };

    const PDfDefinition = {
      //  pageMargins: [10,10,10,10],
      pageSize: "A4",
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
      },
      content: [
        {
          text: "Data Absensi Siswa",
          style: "header",
          margin: [0, 4, 0, 30],
          alignment: "center",
        },
        {
          text: "Guru: Salsa",
          margin: [0, 0, 0, 6],
          fontSize: "12",
        },
        {
          text: "Kelas: MIPA 2",
          margin: [0, 0, 0, 6],
          fontSize: "12",
        },
        {
          text: "Nama: Asep",
          fontSize: "12",
          margin: [0, 0, 0, 6],
        },
        {
          text: "Orang Tua: Budi",
          fontSize: "12",
          margin: [0, 0, 0, 6],
        },
        {
          text: "Periode: 29 - 03 Juli",
          fontSize: "12",
          margin: [0, 0, 0, 50],
        },
        table,
      ],
    };

    PdfService.generatePdf(PDfDefinition, "absensi-siswa.pdf");

    return weeklyAttendance;
  }

  static async downloadStudentWeeklyAttendance(request, response) {
    const { classId, studentId, week, month, year } = request;

    if (!week || !month || !year) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "invalid week, month, and year inputted!");
    }

    const listOfWeek = getWeekMonToSaturdayDates(Number(year), Number(month), Number(week));

    const existedStudent = await StudentService.findStudentMustExist(studentId);

    const existedClass = await ClassService.findClassMustExist(classId, {
      isWithTeacher: true,
    });

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

    const attdFormat = weeklyAttendance.attendance.map((d, index) => [
      { text: String(index + 1), fontSize: "12" },
      { text: formattedDate(d.date, true), fontSize: "12" },
      { text: handleStatusPresence(d.status), fontSize: "12" },
    ]);

    // Create the PDF content
    const table = {
      width: "100%",
      alignment: "center",
      style: "regular",
      table: {
        headerRows: 0,
        body: [
          [
            { text: "No", bold: true, fontSize: "12" },
            { text: "Tanggal", bold: true, fontSize: "12" },
            { text: "Status", bold: true, fontSize: "12" },
          ],
          ...attdFormat,
          [
            { text: "Persentase Kehadiran", bold: true, colSpan: 2, alignment: "center", fontSize: "12" },
            {},
            { text: weeklyAttendance.percentagePresent, alignment: "center", fontSize: "12" },
          ],
        ],
        widths: ["8%", "*", "*"],
      },
      layout: {
        // paddingLeft: function(i, node) { return 2; },
        // paddingRight: function(i, node) { return 4; },
        paddingTop: function (i, node) {
          return 8;
        },
        paddingBottom: function (i, node) {
          return 8;
        },
      },
    };

    const PDfDefinition = {
      //  pageMargins: [10,10,10,10],
      pageSize: "A4",
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
      },
      content: [
        {
          text: "Data Absensi Siswa",
          style: "header",
          margin: [0, 4, 0, 30],
          alignment: "center",
        },
        {
          text: `Guru: ${weeklyAttendance?.teacher?.name ?? "-"}`,
          margin: [0, 0, 0, 6],
          fontSize: "12",
        },
        {
          text: `Kelas: ${weeklyAttendance?.class?.name ?? "-"}`,
          margin: [0, 0, 0, 6],
          fontSize: "12",
        },
        {
          text: `Nama: ${existedStudent?.name}`,
          fontSize: "12",
          margin: [0, 0, 0, 6],
        },
        {
          text: `Orang Tua: ${existedStudent?.parent?.name ?? "-"}`,
          fontSize: "12",
          margin: [0, 0, 0, 6],
        },
        {
          text: `Periode: ${formattedDate(listOfWeek[0], true)} - ${formattedDate(listOfWeek[listOfWeek.length - 1], true)}`,
          fontSize: "12",
          margin: [0, 0, 0, 50],
        },
        table,
      ],
    };

    return await PdfService.sendPdf(
      PDfDefinition,
      `Absensi Siswa ${existedStudent.name} Kelas ${existedClass.name}.pdf`,
      response
    );
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
