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
