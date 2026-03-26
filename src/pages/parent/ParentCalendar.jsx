import React from 'react';
import CalendarView from '../../components/CalendarView';

export default function ParentCalendar() {
  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2 style={{ marginBottom: 20 }}>Daycare Calendar</h2>
      <p style={{ color: '#555', marginBottom: 20 }}>Review upcoming closed days and events.</p>
      <CalendarView readOnly={true} />
    </div>
  );
}
