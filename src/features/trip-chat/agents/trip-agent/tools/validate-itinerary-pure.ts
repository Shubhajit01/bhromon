import { format } from '@formkit/tempo';

interface TimelineVisit {
  placeId: number;
  startTime: string;
  endTime: string;
  minimumVisitMinutes?: number;
  fixedBooking?: { startTime: string; endTime: string };
  mealType?: 'breakfast' | 'lunch' | 'dinner';
}
interface TimelineDay {
  dayId: string;
  date: string;
  visits: TimelineVisit[];
  mealWindows?: Record<string, { startTime: string; endTime: string }>;
}
export interface TimelineWarning {
  code: string;
  dayId: string;
  visitIndex?: number;
  message: string;
}
export type OpeningHoursEvaluation = 'open' | 'closed' | 'unchecked';

export function validateTimeline({
  day,
}: {
  day: TimelineDay;
}): TimelineWarning[] {
  const warnings: TimelineWarning[] = [];
  day.visits.forEach((visit, index) => {
    const start = minutes(visit.startTime);
    const end = minutes(visit.endTime);
    if (end <= start)
      warnings.push({
        code: 'schedule_overlap',
        dayId: day.dayId,
        visitIndex: index,
        message: 'A visit ends before it starts.',
      });
    if (visit.minimumVisitMinutes && end - start < visit.minimumVisitMinutes)
      warnings.push({
        code: 'too_short_visit',
        dayId: day.dayId,
        visitIndex: index,
        message: `This visit needs at least ${visit.minimumVisitMinutes} minutes.`,
      });
    if (
      visit.fixedBooking &&
      (visit.fixedBooking.startTime !== visit.startTime ||
        visit.fixedBooking.endTime !== visit.endTime)
    )
      warnings.push({
        code: 'fixed_booking_conflict',
        dayId: day.dayId,
        visitIndex: index,
        message: 'The visit time does not match its fixed booking.',
      });
    if (visit.mealType) {
      const window = day.mealWindows?.[visit.mealType];
      if (
        window &&
        (start < minutes(window.startTime) || end > minutes(window.endTime))
      )
        warnings.push({
          code: 'meal_outside_window',
          dayId: day.dayId,
          visitIndex: index,
          message: `This ${visit.mealType} falls outside the agreed meal window.`,
        });
    }
    if (
      index + 1 < day.visits.length &&
      end > minutes(day.visits[index + 1].startTime)
    )
      warnings.push({
        code: 'schedule_overlap',
        dayId: day.dayId,
        visitIndex: index + 1,
        message: 'This visit overlaps the next scheduled visit.',
      });
  });
  return warnings;
}

export function evaluateOpeningHours(
  hours: string,
  date: string,
  start: string,
  end: string,
): OpeningHoursEvaluation {
  if (hours.trim() === '24/7') return 'open';
  const weekday = format({
    date: `${date}T12:00:00`,
    format: 'ddd',
    locale: 'en',
    tz: 'UTC',
  }).slice(0, 2);
  const rules = hours
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean);
  const parsed = rules.map(parseRule);
  if (parsed.some((rule) => !rule)) return 'unchecked';
  const matching = parsed.filter((rule) => rule!.days.includes(weekday));
  if (!matching.length) return 'closed';
  const startMinutes = minutes(start);
  const endMinutes = minutes(end);
  return matching.some((rule) =>
    rule!.windows.some(
      ([open, close]) => startMinutes >= open && endMinutes <= close,
    ),
  )
    ? 'open'
    : 'closed';
}

function parseRule(value: string) {
  const match =
    /^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*[-,]\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))*)\s+(.+)$/.exec(
      value,
    );
  if (!match) return null;
  const days = expandDays(match[1]);
  const windowPattern = /(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})/g;
  const windows = [...match[2].matchAll(windowPattern)].map(
    (item) => [minutes(item[1]), minutes(item[2])] as const,
  );
  if (
    !days.length ||
    !windows.length ||
    windows.some(([open, close]) => open < 0 || close < 0 || open >= close) ||
    match[2].replace(windowPattern, '').replaceAll(',', '').trim()
  )
    return null;
  return { days, windows };
}

function expandDays(value: string) {
  const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  return value
    .split(',')
    .map((part) => part.trim())
    .flatMap((part) => {
      if (!part.includes('-')) return days.includes(part) ? [part] : [];
      const [from, to] = part.split('-').map((day) => day.trim());
      const start = days.indexOf(from);
      const end = days.indexOf(to);
      return start < 0 || end < start ? [] : days.slice(start, end + 1);
    });
}
export function minutes(value: string) {
  const [hours, mins] = value.split(':').map(Number);
  if (hours < 0 || hours > 23 || mins < 0 || mins > 59) return -1;
  return hours * 60 + mins;
}
