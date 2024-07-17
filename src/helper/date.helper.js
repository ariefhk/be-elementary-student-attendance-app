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

// console.log(getWeekMonToSaturdayDates(2022, 1, 1));
