export const formattedDateStr = (dateStr) => {
  const date = new Date(dateStr);

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // getUTCMonth() is zero-based
  const year = date.getUTCFullYear();

  return `${day}-${month}-${year}`;
};

export function getAllWeeksInMonth(year, month) {
  let firstDay = new Date(Date.UTC(year, month - 1, 1)); // Use UTC to prevent timezone issues

  // Find the first Monday of the month
  while (firstDay.getUTCDay() !== 1) {
    firstDay.setUTCDate(firstDay.getUTCDate() + 1);
  }

  let weeks = [];
  let currentWeekStart = new Date(firstDay);

  // Ensure we only collect weeks that belong entirely to the specified month
  while (currentWeekStart.getUTCMonth() + 1 === month) {
    let week = [];

    let day = new Date(currentWeekStart);

    for (let i = 0; i < 6; i++) {
      // Collect Monday to Saturday
      week.push(new Date(day));
      day.setUTCDate(day.getUTCDate() + 1);
    }

    // weeks.push(week);

    weeks.push({
      range: `(${formattedDateStr(week[0])} - ${formattedDateStr(week[week.length - 1])})`,
      week,
    });

    currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 7);

    // Adjust currentWeekStart to the next Monday to avoid spilling over to the next month's first week
    while (currentWeekStart.getUTCDay() !== 1) {
      currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 1);
    }
  }

  return weeks;
}

console.log(getAllWeeksInMonth(2024, 1));
