import React from 'react';
import CalendarView from '../../components/CalendarView';

export default function AdminCalendar() {
  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2 style={{ marginBottom: 20 }}>Daycare Calendar (Admin)</h2>
      <p style={{ color: '#555', marginBottom: 20 }}>As an Admin, tap any day to add or edit an event.</p>
      <CalendarView readOnly={false} />
    </div>
  );
}
