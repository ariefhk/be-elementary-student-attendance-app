export function toTeacherJSON(teacher, option = { isWithUser: false, isWithClass: false }) {
  return {
    id: teacher?.id,
    name: teacher?.name,
    email: teacher?.user?.email,
    profilePicture: teacher?.profilePicture || null,
    nip: teacher?.nip || null,
    gender: teacher?.gender || null,
    address: teacher?.address || null,
    classCount: teacher?.class?.length || 0,
    ...(option?.isWithUser
      ? {
          user: {
            id: teacher.user.id,
            email: teacher.user.email,
            role: teacher.user.role,
          },
        }
      : {}),
    ...(option?.isWithClass
      ? {
          class:
            teacher?.class?.length > 0
              ? teacher.class.map((cls) => {
                  return {
                    id: cls?.id || null,
                    name: cls?.name || null,
                  };
                })
              : [],
        }
      : {}),

    createdAt: teacher?.createdAt,
  };
}
