/**
 * parseDurationToDays(str)
 * ------------------------
 * Converts a free-text medicine duration string entered by the doctor into an
 * integer number of days.  Returns null when the string cannot be parsed.
 *
 * Supported formats (case-insensitive):
 *   "7 days"   "7 day"    "7d"
 *   "2 weeks"  "2 week"   "2w"
 *   "1 month"  "1 months" "1m" (30 days per month)
 *   "3"        → plain number treated as days
 *   "1 year"   "1y"       (365 days)
 *   "10 D" / "10 D." etc.
 */
function parseDurationToDays(str) {
  if (!str || typeof str !== 'string') return null;

  const s = str.trim().toLowerCase();
  if (!s) return null;

  // Try <number> <unit> form  ─ "7 days", "2 weeks", "1 month", "3d", "2w"
  const match = s.match(/^(\d+(?:\.\d+)?)\s*(d|day|days|w|week|weeks|m|month|months|y|year|years)?\.?$/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit  = (match[2] || 'd').charAt(0); // d / w / m / y
    let days;
    switch (unit) {
      case 'd': days = Math.round(value);           break;
      case 'w': days = Math.round(value * 7);       break;
      case 'm': days = Math.round(value * 30);      break;
      case 'y': days = Math.round(value * 365);     break;
      default:  days = Math.round(value);
    }
    return days > 0 ? days : null;
  }

  // No match
  return null;
}

module.exports = { parseDurationToDays };
