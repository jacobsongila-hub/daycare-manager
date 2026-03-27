import React from 'react';
import CalendarView from '../../components/CalendarView';
import { useLanguage } from '../../context/LanguageContext';

export default function ParentCalendar() {
  const { t } = useLanguage();

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)',
        color: 'white',
        padding: 25,
        borderRadius: 16,
        marginBottom: 25,
        boxShadow: '0 4px 12px rgba(106,27,154,0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, fontSize: '7rem', opacity: 0.08 }}>📅</div>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: 800 }}>
          📅 {t('calendar') || 'Calendar'}
        </h2>
        <p style={{ margin: 0, opacity: 0.85, fontSize: '0.95rem' }}>
          {t('calendarParentHint') || 'View upcoming events, daycare closures, and holidays.'}
        </p>
      </div>

      <CalendarView readOnly={true} />
    </div>
  );
}
