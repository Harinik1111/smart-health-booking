import { useEffect, useMemo, useState } from 'react';
import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar';
import { endOfMonth, endOfWeek, format, getDay, parse, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api, { errMsg } from '../../api/client';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'en-US': enUS } });
const ymd = (d) => format(d, 'yyyy-MM-dd');

function getRange(view, date) {
  if (view === Views.DAY) return [startOfDay(date), startOfDay(date)];
  if (view === Views.WEEK) return [startOfWeek(date), endOfWeek(date)];
  // Month grid shows leading/trailing days of neighbouring months (max 6 weeks = 42 days)
  return [startOfWeek(startOfMonth(date)), endOfWeek(endOfMonth(date))];
}

/**
 * Day / Week / Month calendar of a doctor's 30-minute slots.
 * The API decides what is visible:
 *   patients  -> only available slots
 *   the doctor (and admin) -> every slot, with booked ones showing the patient
 */
export default function SlotCalendar({ doctorId, onSelectSlot, onSelectBooked, refreshKey = 0 }) {
  const [view, setView] = useState(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const [from, to] = getRange(view, date);
    let cancelled = false;
    setLoading(true);
    api
      .get(`/doctors/${doctorId}/slots`, { params: { from: ymd(from), to: ymd(to) } })
      .then((res) => {
        if (!cancelled) {
          setSlots(res.data.slots);
          setError('');
        }
      })
      .catch((e) => !cancelled && setError(errMsg(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [doctorId, view, date, refreshKey]);

  const events = useMemo(() => {
    if (view !== Views.MONTH) {
      return slots.map((s) => ({
        title: s.status === 'booked' ? s.appointment?.patient?.name || 'Booked' : 'Available',
        start: new Date(s.start),
        end: new Date(s.end),
        slot: s,
      }));
    }
    // Month view: one summary bar per day (click it to open that day)
    const byDay = {};
    slots.forEach((s) => {
      const key = ymd(new Date(s.start));
      if (!byDay[key]) byDay[key] = { day: startOfDay(new Date(s.start)), free: 0, booked: 0 };
      if (s.status === 'booked') byDay[key].booked += 1;
      else if (!s.past) byDay[key].free += 1;
    });
    return Object.values(byDay)
      .filter((d) => d.free > 0 || d.booked > 0)
      .map((d) => ({
        title: d.booked ? `${d.free} free · ${d.booked} booked` : `${d.free} free`,
        start: d.day,
        end: d.day,
        allDay: true,
        aggregate: true,
      }));
  }, [slots, view]);

  const handleSelectEvent = (ev) => {
    if (ev.aggregate) {
      setDate(ev.start);
      setView(Views.DAY);
      return;
    }
    if (ev.slot.status === 'booked') onSelectBooked?.(ev.slot);
    else if (!ev.slot.past) onSelectSlot?.(ev.slot);
  };

  const eventPropGetter = (ev) => {
    if (ev.aggregate) return { className: 'slot-aggregate' };
    if (ev.slot.status === 'booked') return { className: 'slot-booked' };
    return { className: ev.slot.past ? 'slot-past' : 'slot-available' };
  };

  return (
    <div className="calendar-box">
      <div className="legend">
        <span><i className="dot dot-available" /> Available</span>
        {onSelectBooked && <span><i className="dot dot-booked" /> Booked</span>}
        {loading && <span className="muted">Loading…</span>}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <Calendar
        localizer={localizer}
        events={events}
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        views={[Views.DAY, Views.WEEK, Views.MONTH]}
        step={30}
        timeslots={1}
        scrollToTime={new Date(1970, 0, 1, 8)}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventPropGetter}
        style={{ height: 680 }}
        popup
      />
    </div>
  );
}
