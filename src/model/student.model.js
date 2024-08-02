export function toStudentJSON(student, option = { isWithParent: false, isWithClass: false }) {
  return {
    id: student.id,
    name: student.name,
    nisn: student?.nisn || null,
    email: student.email || null,
    no_telp: student?.no_telp || null,
    gender: student.gender,
    classCount: student?.studentClass?.length || 0,
    ...(option?.isWithParent
      ? {
          parent: {
            id: student?.parent?.id || null,
            name: student?.parent?.name || null,
          },
        }
      : {}),
    ...(option?.isWithClass
      ? {
          classes:
            student?.studentClass?.length > 0
              ? student.studentClass.map((stdCls) => {
                  return {
                    id: stdCls?.class?.id || null,
                    name: stdCls?.class?.name || null,
                  };
                })
              : [],
        }
      : {}),
    createdAt: student.createdAt,
  };
}
