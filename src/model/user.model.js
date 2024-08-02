export function toUserJsonWithRole(
  userData,
  option = {
    isWithToken: false,
    isWithClass: false,
    isWithUser: false,
  }
) {
  switch (userData?.user?.role) {
    case "TEACHER":
      return {
        id: userData.id,
        name: userData.name,
        nip: userData.nip || null,
        email: userData.user.email,
        profilePicture: userData?.profilePicture || null,
        gender: userData.gender,
        address: userData.address || null,
        role: userData.user.role,
        ...(option?.isWithToken ? { token: userData?.user?.token } : {}),
        classCount: userData?.class?.length || 0,
        ...(option?.isWithClass
          ? {
              class:
                userData?.class?.length > 0
                  ? userData.class.map((cls) => {
                      return {
                        id: cls?.id || null,
                        name: cls?.name || null,
                      };
                    })
                  : [],
            }
          : {}),
        ...(option?.isWithUser
          ? {
              user: {
                id: userData.user.id,
                email: userData.user.email,
              },
            }
          : {}),
        createdAt: userData.createdAt,
      };
    case "PARENT":
      return {
        id: userData.id,
        name: userData.name,
        email: userData.user.email,
        profilePicture: userData?.profilePicture || null,
        gender: userData.gender,
        address: userData.address || null,
        role: userData.user.role,
        ...(option?.isWithToken ? { token: userData?.user?.token } : {}),
        ...(option?.isWithUser
          ? {
              user: {
                id: userData.user.id,
                email: userData.user.email,
              },
            }
          : {}),
        createdAt: userData.createdAt,
      };
  }
}

export function toUserJson(
  user,
  option = {
    isWithToken: false,
    isWithPassword: false,
    isWithTeacher: false,
    isWithParent: false,
  }
) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    ...(option?.isWithToken ? { token: user?.token } : {}),
    ...(option?.isWithPassword ? { password: user?.password } : {}),
    ...(option?.isWithTeacher
      ? {
          teacher: {
            id: user?.teacher?.id || null,
            nip: user?.teacher?.nip || null,
            name: user?.teacher?.name || null,
            address: user?.teacher?.address || null,
          },
        }
      : {}),
    ...(option?.isWithParent
      ? {
          parent: {
            id: user?.parent?.id || null,
            name: user?.parent?.name || null,
            address: user?.parent?.address || null,
          },
        }
      : {}),
    createdAt: user.createdAt,
  };
}
