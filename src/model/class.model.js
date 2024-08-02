export function toClassJSON(classes, option = { isWithStudent: false, isWithTeacher: false }) {
  return {
    id: classes.id,
    name: classes.name,
    studentCount: classes?.studentClass?.length || 0,
    ...(option?.isWithTeacher
      ? {
          teacher: {
            id: classes?.teacher?.id || null,
            nip: classes?.teacher?.nip || null,
            name: classes?.teacher?.name || null,
          },
        }
      : {}),
    ...(option?.isWithStudent
      ? {
          students:
            classes?.studentClass?.length > 0
              ? classes.studentClass.map((stdCls) => {
                  return {
                    id: stdCls?.student?.id || null,
                    name: stdCls?.student?.name || null,
                    nisn: stdCls?.student?.nisn || null,
                  };
                })
              : [],
        }
      : {}),
    createdAt: classes.createdAt,
  };
}
