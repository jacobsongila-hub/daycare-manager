// src/utils/formatters.js

export function formatCurrency(amount) {
  // Always format as Shekels (₪) per requirements
  return `₪${Number(amount).toFixed(2)}`;
}

export function calculateAge(dobString) {
  if (!dobString) return '';
  const dob = new Date(dobString);
  const now = new Date();
  
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  
  if (months < 0 || (months === 0 && now.getDate() < dob.getDate())) {
    years--;
    months += 12;
  }
  
  if (now.getDate() < dob.getDate() && months > 0) {
    months--;
  }

  return `${years} years, ${months} months`;
}
