import { db } from "../db/connection.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { checkAllowedRole, ROLE } from "../helper/check-role.helper.js";
import { TeacherService } from "./teacher.service.js";
import { toClassJSON } from "../model/class.model.js";

export class ClassService {
  static async findClassMustExist(classId, option = { isWithStudent: false, isWithTeacher: false }) {
    // Check if class id is existed
    if (!classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class id is required");
    }

    // Find class by id
    const classes = await db.class.findUnique({
      where: {
        id: classId,
      },
      include: {
        studentClass: {
          include: {
            student: true,
          },
        },
        teacher: true,
      },
    });

    if (!classes) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Class not found");
    }

    return toClassJSON(classes, option);
  }

  static async findClassById(classId, option = { isWithStudent: false, isWithTeacher: false }) {
    // Check if class id is existed
    if (!classId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class id is required");
    }

    // Find class by id
    const classes = await db.class.findUnique({
      where: {
        id: classId,
      },
      include: {
        studentClass: {
          include: {
            student: true,
          },
        },
        teacher: true,
      },
    });

    if (!classes) {
      return null;
    }

    return toClassJSON(classes, option);
  }

  static async findClassByName(name, option = { isWithStudent: false, isWithTeacher: false }) {
    // Check if name is existed
    if (!name) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Name of the class is required for check!");
    }

    // Find class by name
    const existedClassByName = await db.class.findFirst({
      where: {
        name: name,
      },
      include: {
        studentClass: {
          include: {
            student: true,
          },
        },
        teacher: true,
      },
    });

    // return null if class is not existed
    if (!existedClassByName) {
      return null;
    }

    return toClassJSON(existedClassByName, option);
  }

  static async findById(request) {
    const { classId, loggedUserRole } = request;

    // check logged user
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    // check if class is existed
    const existedClass = await this.findClassMustExist(classId, {
      isWithTeacher: true,
    });

    return existedClass;
  }

  static async findAll(request) {
    const { loggedUserRole, name } = request;

    // check logged user
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);
    const filter = {};

    // Check if name is existed
    if (name) {
      filter.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    // Find all classes
    const classes = await db.class.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
      include: {
        studentClass: {
          include: {
            student: true,
          },
        },
        teacher: true,
      },
    });

    return classes.map((classes) => toClassJSON(classes, { isWithStudent: true, isWithTeacher: true }));
  }

  static async findByTeacherId(request) {
    const { teacherId, loggedUserRole } = request;

    // check logged user
    checkAllowedRole(ROLE.IS_ALL_ROLE, loggedUserRole);

    // check if teacher is existed
    const existedTeacher = await TeacherService.findTeacherMustExist(teacherId);

    // check if teacher has class
    const existedTeacherClass = await db.class.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: {
        teacherId: existedTeacher.id,
      },
      include: {
        studentClass: {
          include: {
            student: true,
          },
        },
        teacher: true,
      },
    });

    if (!existedTeacherClass) {
      return [];
    }

    return existedTeacherClass.map((classes) => toClassJSON(classes, { isWithStudent: true, isWithTeacher: true }));
  }

  static async create(request) {
    const { name, teacherId, loggedUserRole } = request;

    // check logged user
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // check if name and teacherId is existed
    if (!name || !teacherId) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Name of the class and Teacher Id is required!");
    }

    // check if class is existed
    const existedClassByName = await this.findClassByName(name);

    // throw error if class is existed
    if (existedClassByName) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Class already created!");
    }

    // check if teacher is existed
    const existedTeacher = await TeacherService.findTeacherMustExist(teacherId);

    // create class
    const createdClass = await db.class.create({
      data: {
        name: name,
        teacherId: existedTeacher.id,
      },

      include: {
        studentClass: {
          include: {
            student: true,
          },
        },
        teacher: true,
      },
    });

    return toClassJSON(createdClass, { isWithStudent: true, isWithTeacher: true });
  }

  static async update(request) {
    const { classId, teacherId, name, loggedUserRole } = request;

    // check logged user
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // check if class is existed
    const existedClass = await this.findClassMustExist(classId);

    // if there teacherId, we check existed teacher
    if (teacherId) {
      await TeacherService.findTeacherMustExist(teacherId);
    }

    // update class
    const updatedClass = await db.class.update({
      where: {
        id: existedClass.id,
      },
      data: {
        ...(name && { name: name }),
        ...(teacherId && { teacherId: teacherId }),
      },
      include: {
        studentClass: {
          include: {
            student: true,
          },
        },
        teacher: true,
      },
    });

    return toClassJSON(updatedClass, { isWithStudent: true, isWithTeacher: true });
  }

  static async delete(request) {
    const { classId, loggedUserRole } = request;

    // check logged user
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    // check if class is existed
    const existedClass = await ClassService.findClassMustExist(classId);

    // delete class
    await db.class.delete({
      where: {
        id: existedClass.id,
      },
    });

    return existedClass;
  }
}
