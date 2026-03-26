import React from 'react';
import CalendarView from '../../components/CalendarView';

export default function StaffCalendar() {
  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2 style={{ marginBottom: 20 }}>Daycare Calendar</h2>
      <CalendarView readOnly={true} />
    </div>
  );
}
