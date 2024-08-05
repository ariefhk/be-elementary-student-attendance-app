export const handleStatusPresence = (status) => {
  switch (status) {
    case "PRESENT":
      return "Hadir";
    case "ABSENT":
      return "Tidak Hadir";
    case "HOLIDAY":
      return "Libur";
  }
};
