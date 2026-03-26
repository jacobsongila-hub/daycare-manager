const fs = require('fs');
const path = require('path');

const srcPaths = [
  'pages/admin/AdminAttendance.jsx',
  'pages/admin/FamilyManagement.jsx',
  'pages/admin/AdminCalendar.jsx',
  'pages/admin/AdminSettings.jsx',
  'pages/admin/Announcements.jsx',
  'pages/admin/ShiftManager.jsx',
  'pages/staff/StaffAttendance.jsx',
  'pages/staff/StaffNotes.jsx',
  'pages/staff/StaffShifts.jsx',
  'pages/staff/StaffCalendar.jsx',
  'pages/staff/StaffDocs.jsx',
  'pages/parent/ParentCalendar.jsx',
  'pages/parent/ParentDocs.jsx',
  'pages/parent/ParentProfile.jsx'
];

srcPaths.forEach(p => {
  const fullPath = path.join(__dirname, 'src', p);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const componentName = path.basename(p, '.jsx');
  const content = `import React from 'react';\n\nexport default function ${componentName}() {\n  return (\n    <div className="page-container">\n      <h2>${componentName}</h2>\n      <p>Under construction...</p>\n    </div>\n  );\n}\n`;
  
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content);
    console.log('Created: ' + fullPath);
  }
});
