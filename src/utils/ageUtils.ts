/**
 * Utility functions for calculating age and pension alerts (Age 55)
 */

export function calculateAge(birthDateString?: string): number | null {
  if (!birthDateString) return null;
  
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
  }
  
  return years >= 0 ? years : null;
}

export function getAgeDetails(birthDateString?: string): { years: number; months: number; totalYearsExact: number } {
  if (!birthDateString) return { years: 0, months: 0, totalYearsExact: 0 };
  
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return { years: 0, months: 0, totalYearsExact: 0 };

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }
  
  const totalYearsExact = years + (months / 12);
  return { years, months, totalYearsExact };
}

export function isApproaching55(birthDateString?: string): boolean {
  if (!birthDateString) return false;
  const age = calculateAge(birthDateString);
  if (age === null) return false;
  // Flag if age is 54 or older (approaching 55 or has reached 55)
  return age >= 54;
}

export function formatAgeString(birthDateString?: string): string {
  if (!birthDateString) return '-';
  const { years, months } = getAgeDetails(birthDateString);
  if (years < 0) return '-';
  return `${years} tahun ${months > 0 ? `${months} bulan` : ''}`.trim();
}
