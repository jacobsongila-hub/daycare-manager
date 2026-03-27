import React from 'react';
import { Link } from 'react-router-dom';
import CalendarView from '../../components/CalendarView';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminCalendar() {
  const { t } = useLanguage();

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1565c0, #1976d2)',
        color: 'white',
        padding: 25,
        borderRadius: 16,
        marginBottom: 25,
        boxShadow: '0 4px 12px rgba(21,101,192,0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, fontSize: '7rem', opacity: 0.08 }}>📅</div>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: 800 }}>
          📅 {t('calendar') || 'Calendar'}
        </h2>
        <p style={{ margin: 0, opacity: 0.85, fontSize: '0.95rem' }}>
          {t('calendarAdminHint') || 'Tap any day to add or edit events — holidays, closures, and special days.'}
        </p>

        {/* Quick Links */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <Link to="/admin/staff-schedule"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: 20, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            💼 {t('staffschedule') || 'Staff Schedule'}
          </Link>
          <Link to="/admin/shift-requests"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: 20, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            📋 {t('shiftrequests') || 'Shift Requests'}
          </Link>
        </div>
      </div>

      <CalendarView readOnly={false} />
    </div>
  );
}
