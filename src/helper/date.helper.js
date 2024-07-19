export function getWeekMonToSaturdayDates(year, month, week) {
  let firstDay = new Date(Date.UTC(year, month - 1, 1)); // Use UTC to prevent timezone issues

  // Find the first Monday of the month
  while (firstDay.getUTCDay() !== 1) {
    // 1 represents Monday
    firstDay.setUTCDate(firstDay.getUTCDate() + 1);
  }

  // Adjust to the start of the desired week
  firstDay.setUTCDate(firstDay.getUTCDate() + (week - 1) * 7);

  // Initialize an array to store the dates
  let dates = [];

  // Push Monday to Saturday of that week into the array
  for (let i = 0; i < 7; i++) {
    // Iterate from Monday to Sunday
    if (firstDay.getUTCDay() >= 1 && firstDay.getUTCDay() <= 6) {
      // Check if it's Monday to Saturday
      dates.push(new Date(firstDay)); // Add the current date to the array
    }
    firstDay.setUTCDate(firstDay.getUTCDate() + 1); // Move to the next day
  }

  // Return the array of dates
  return dates;
}

export const formattedDateStr = (dateStr) => {
  const date = new Date(dateStr);

  // Get the day and month strings
  const day = String(date.getUTCDate()).padStart(2, "0");

  // Get the month string
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // getUTCMonth() is zero-based

  // Get the year
  const year = date.getUTCFullYear();

  return `${day}-${month}-${year}`;
};

export function transformDate(dateString) {
  // Split the date string into year, month, and day components
  const [yearStr, monthStr, dayStr] = dateString.split("-");

  // Convert the components to numbers
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  // Check if the conversion was successful
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error("Invalid date format");
  }

  // Create a new Date object in UTC timezone
  const dateObj = new Date(Date.UTC(year, month - 1, day)); // Month is 0-indexed

  return dateObj;
}

export function getAllWeeksInMonth(year, month) {
  let firstDay = new Date(Date.UTC(year, month - 1, 1)); // Use UTC to prevent timezone issues

  // Find the first Monday of the month
  while (firstDay.getUTCDay() !== 1) {
    firstDay.setUTCDate(firstDay.getUTCDate() + 1);
  }

  // Initialize an array to store the weeks
  let weeks = [];
  let currentWeekStart = new Date(firstDay);
  let counter = 1;

  // Ensure we only collect weeks that belong entirely to the specified month
  while (currentWeekStart.getUTCMonth() + 1 === month) {
    let week = [];

    let day = new Date(currentWeekStart);

    for (let i = 0; i < 6; i++) {
      // Collect Monday to Saturday
      week.push(new Date(day));
      day.setUTCDate(day.getUTCDate() + 1);
    }

    weeks.push({
      numOfTheWeek: counter, // Week number
      range: `${formattedDateStr(week[0])} - ${formattedDateStr(week[week.length - 1])}`,
      week,
    });

    // Increment the counter
    counter++;

    currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 7);

    // Adjust currentWeekStart to the next Monday to avoid spilling over to the next month's first week
    while (currentWeekStart.getUTCDay() !== 1) {
      currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 1);
    }
  }

  return weeks;
}

// const allWeek = getAllWeeksInMonth(2024, 2);
// const formattedAllWeek = allWeek.map((week) => {
//   return {
//     week: week.numOfTheWeek,
//     startDate: week.week[0],
//     endDate: week.week[week.week.length - 1],
//   };
// });

// console.log(formattedAllWeek);
