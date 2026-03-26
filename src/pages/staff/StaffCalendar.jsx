import React from 'react';
import CalendarView from '../../components/CalendarView';
import { useLanguage } from '../../context/LanguageContext';

export default function StaffCalendar() {
  const { t } = useLanguage();
  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2 style={{ marginBottom: 20 }}>📅 {t('calendar') || 'Daycare Calendar'}</h2>
      <p style={{ color: '#555', marginBottom: 20 }}>View daycare events, holidays, and your upcoming shifts.</p>
      <CalendarView readOnly={true} />
    </div>
  );
}
