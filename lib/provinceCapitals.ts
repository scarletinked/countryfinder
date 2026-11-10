// Province or territory name → capital, for the Canada modes. Each game asks about every entry once.
export const PROVINCE_CAPITALS: Record<string, string> = {
  Alberta: "Edmonton",
  "British Columbia": "Victoria",
  Manitoba: "Winnipeg",
  "New Brunswick": "Fredericton",
  "Newfoundland and Labrador": "St. John's",
  "Nova Scotia": "Halifax",
  Ontario: "Toronto",
  "Prince Edward Island": "Charlottetown",
  Québec: "Québec City",
  Saskatchewan: "Regina",
  // Territories
  Yukon: "Whitehorse",
  "Northwest Territories": "Yellowknife",
  Nunavut: "Iqaluit",
};

// So prompts can say "territory" instead of "province" for these
export const TERRITORIES = new Set(["Yukon", "Northwest Territories", "Nunavut"]);
