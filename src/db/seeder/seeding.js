import { db } from "../connection.js";
import { createBcryptPassword } from "../../helper/hashing.helper.js";
import { UserService } from "../../service/user.service.js";

const createManyAdminSeed = async () => {
  for (let i = 0; i < 2; i++) {
    const user = await db.user.create({
      data: {
        email: `admin${i}@gmail.com`,
        password: await createBcryptPassword("rahasia"),
        role: "ADMIN",
      },
    });

    if (user) {
      await db.admin.create({
        data: {
          name: `admin${i}`,
          gender: "P",
          userId: user.id,
        },
      });
    }
  }
};

const createManyParentSeed = async () => {
  for (let i = 0; i < 5; i++) {
    const user = await db.user.create({
      data: {
        email: `parent${i}@gmail.com`,
        password: await createBcryptPassword("rahasia"),
        role: "PARENT",
      },
    });

    if (user) {
      await db.parent.create({
        data: {
          name: `parent${i}`,
          gender: "P",
          userId: user.id,
        },
      });
    }
  }
};

const createManyTeacherSeed = async () => {
  for (let i = 0; i < 5; i++) {
    const user = await db.user.create({
      data: {
        email: `teacher${i}@gmail.com`,
        password: await createBcryptPassword("rahasia"),
        role: "TEACHER",
      },
    });

    if (user) {
      await db.teacher.create({
        data: {
          name: `teacher${i}`,
          gender: "L",
          nip: `nip-${i}teacher`,
          userId: user.id,
        },
      });
    }
  }
};

const getSpecificUser = async (email) => {
  return await db.user.findUnique({ where: { email } });
};

const deleteAllUser = async () => {
  await db.parent.deleteMany();
  await db.teacher.deleteMany();
  await db.user.deleteMany();
};

const createManyClassSeed = async () => {
  for (let i = 0; i < 5; i++) {
    const user = await getSpecificUser(`teacher-${i}@gmail.com`);
    if (user) {
      const teacherRecord = await db.teacher.findUnique({ where: { userId: user.id } });
      if (teacherRecord) {
        await db.class.create({
          data: {
            name: `class-${i}`,
            teacherId: teacherRecord.id, // Use teacher's id from Teacher table
          },
        });
      } else {
        console.error(`Teacher record not found for teacher-${i}@gmail.com`);
      }
    } else {
      console.error(`User not found for teacher-${i}@gmail.com`);
    }
  }
};

const getClassByName = async (name) => {
  return db.class.findFirst({ where: { name } });
};

const deleteAllClass = async () => {
  await db.class.deleteMany();
};

const createManyStudentSeed = async () => {
  for (let i = 0; i < 5; i++) {
    const user = await getSpecificUser(`parent-${i}@gmail.com`);
    const parentRecord = await db.parent.findUnique({ where: { userId: user.id } });
    const classRecord = await getClassByName(`class-${i}`);
    if (parentRecord && classRecord) {
      await db.student.create({
        data: {
          nisn: `nisn-${i}`,
          name: `student-${i}`,
          gender: "P",
          parentId: parentRecord.id, // Use parent's id
          studentClass: {
            create: {
              classId: classRecord.id, // Use class's id
            },
          },
        },
      });
    } else {
      console.error(`Parent or class not found for student-${i}`);
    }
  }
};

const deleteAll = async () => {
  // await db.studentClass.deleteMany();
  // await db.student.deleteMany();
  // await deleteAllClass();
  await deleteAllUser();
};

const createAll = async () => {
  await deleteAll();
  await createManyAdminSeed();
  await createManyParentSeed();
  await createManyTeacherSeed();
  // await createManyClassSeed();
  // await createManyStudentSeed();
};

async function main() {
  await createAll();

  console.log("Seed data success!");
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
