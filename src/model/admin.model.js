export function toAdminJSON(parent, option = { isWithUser: false }) {
  return {
    id: parent.id,
    name: parent.name,
    email: parent.user.email,
    profilePicture: parent?.profilePicture || null,
    gender: parent.gender,
    address: parent?.address || null,
    studentCount: parent?.student?.length || 0,
    ...(option?.isWithUser
      ? {
          user: {
            id: parent.user.id,
            email: parent.user.email,
            role: parent.user.role,
          },
        }
      : {}),
    createdAt: parent?.createdAt,
  };
}
