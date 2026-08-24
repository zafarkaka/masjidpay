export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Generate standard list of months for a given year or range of years
 */
export function generateMonthList(startYear: number, endYear: number = startYear): string[] {
  const list: string[] = [];
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 0; m < 12; m++) {
      list.push(`${MONTH_NAMES[m]} ${y}`);
    }
  }
  return list;
}

/**
 * Parse any forMonths string (ranges, comma-separated lists, single months)
 * e.g. "January 2026 - June 2026 (6 Months Bulk)" -> ['January 2026', ..., 'June 2026']
 */
export function extractPaidMonths(forMonthsStr: string, allPossibleMonths?: string[]): string[] {
  if (!forMonthsStr) return [];
  const cleanStr = String(forMonthsStr).trim();
  const currentYear = new Date().getFullYear();
  const possibleMonths = allPossibleMonths || generateMonthList(currentYear - 2, currentYear + 2);

  const paid: string[] = [];

  // 1. Check for Range Pattern: e.g. "January 2026 - June 2026" or "January 2026 to June 2026"
  const rangeMatch = cleanStr.match(/([A-Za-z]+\s+\d{4})\s*[-–—to]+\s*([A-Za-z]+\s+\d{4})/i);
  if (rangeMatch) {
    const startStr = rangeMatch[1].trim();
    const endStr = rangeMatch[2].trim();
    const startIdx = possibleMonths.indexOf(startStr);
    const endIdx = possibleMonths.indexOf(endStr);
    if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
      for (let i = startIdx; i <= endIdx; i++) {
        if (!paid.includes(possibleMonths[i])) {
          paid.push(possibleMonths[i]);
        }
      }
      return paid;
    }
  }

  // 2. Check for each possible month explicitly mentioned in the string
  possibleMonths.forEach((m) => {
    if (cleanStr.includes(m) && !paid.includes(m)) {
      paid.push(m);
    }
  });

  return paid;
}

/**
 * Extract all unique paid months from a list of collection records for a member
 */
export function getAllPaidMonthsForMember(collections: any[]): string[] {
  const currentYear = new Date().getFullYear();
  const possibleMonths = generateMonthList(currentYear - 2, currentYear + 2);
  const paidSet = new Set<string>();

  (collections || []).forEach((c) => {
    const str = c.forMonths || c.month || '';
    if (str) {
      const extracted = extractPaidMonths(str, possibleMonths);
      extracted.forEach((m) => paidSet.add(m));
    }
  });

  return Array.from(paidSet).sort((a, b) => possibleMonths.indexOf(a) - possibleMonths.indexOf(b));
}

/**
 * Get all expected months from joining date (or Jan of current year) up to the CURRENT month
 */
export function getExpectedMonthsUpToCurrent(joiningDate?: string | Date | null): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0-11

  let startYear = currentYear;
  let startMonthIdx = 0;

  if (joiningDate) {
    const d = new Date(joiningDate);
    if (!isNaN(d.getTime())) {
      startYear = d.getFullYear();
      startMonthIdx = d.getMonth();
      // Bound start year to not go crazy far back
      if (startYear < currentYear - 1) {
        startYear = currentYear - 1;
        startMonthIdx = 0;
      }
    }
  }

  const expected: string[] = [];

  for (let y = startYear; y <= currentYear; y++) {
    const maxM = y === currentYear ? currentMonthIdx : 11;
    const minM = y === startYear ? startMonthIdx : 0;
    for (let m = minM; m <= maxM; m++) {
      expected.push(`${MONTH_NAMES[m]} ${y}`);
    }
  }

  return expected;
}

/**
 * Compute the strictly pending (unpaid) months up to the current month
 */
export function getPendingMonthsUpToCurrent(
  member: any,
  memberCollections: any[]
): {
  paidMonths: string[];
  pendingMonths: string[];
  isFullyPaid: boolean;
  currentMonthStr: string;
} {
  const now = new Date();
  const currentMonthStr = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const paidMonths = getAllPaidMonthsForMember(memberCollections);
  const expectedMonths = getExpectedMonthsUpToCurrent(member?.createdAt || member?.joiningDate);

  const pendingMonths = expectedMonths.filter((em) => !paidMonths.includes(em));
  const isFullyPaid = pendingMonths.length === 0;

  return {
    paidMonths,
    pendingMonths,
    isFullyPaid,
    currentMonthStr,
  };
}
