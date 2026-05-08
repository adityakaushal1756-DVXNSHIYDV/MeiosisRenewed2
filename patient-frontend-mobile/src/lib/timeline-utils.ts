import { format, addDays, startOfDay, isWithinInterval, parseISO } from 'date-fns';
import { Appointment, Prescription } from '../types';

export interface TimelineDataPoint {
  date: string;
  appointments: Appointment[];
  activePrescriptions: Prescription[];
}

export function generateTimelineData(
  appointments: Appointment[],
  prescriptions: Prescription[],
  daysRange: number = 30
): TimelineDataPoint[] {
  const data: TimelineDataPoint[] = [];
  const today = startOfDay(new Date());

  for (let i = -daysRange; i <= daysRange; i++) {
    const currentDay = addDays(today, i);
    const dateStr = format(currentDay, 'yyyy-MM-dd');
    
    // Find appointments on this day
    const dayAppointments = appointments.filter(apt => 
      format(parseISO(apt.scheduledDate), 'yyyy-MM-dd') === dateStr
    );

    // Find active prescriptions on this day
    const dayPrescriptions = prescriptions.filter(p => {
      const start = parseISO(p.startDate);
      const end = addDays(start, p.durationDays);
      return isWithinInterval(currentDay, { start, end });
    });

    data.push({
      date: dateStr,
      appointments: dayAppointments,
      activePrescriptions: dayPrescriptions,
    });
  }

  return data;
}
