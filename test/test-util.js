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

const student = [
  {
    id: 2,
    name: "Alex",
    nisn: "344121",
    gender: "L",
    parent: {
      id: 2,
      name: "parent1",
    },
  },
  {
    id: 1,
    name: "Budi",
    nisn: "1234",
    gender: "L",
    parent: {
      id: 2,
      name: "parent1",
    },
  },
];

const formattedStudent = student.map((item) => {
  return [
    { text: index + 1, alignment: "center", fontSize: "12" },
    { text: item.nisn, alignment: "center", fontSize: "12" },
    { text: item.name, alignment: "center", fontSize: "12" },
    { text: item.gender, alignment: "center", fontSize: "12" },
    { text: item.parent.name, alignment: "center", fontSize: "12" },
  ];
});
