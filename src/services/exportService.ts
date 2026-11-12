import * as XLSX from 'xlsx';
import { Employee } from '../types';
import { calculateAge, isApproaching55 } from '../utils/ageUtils';

export function exportEmployeesToExcel(employees: Employee[], fileNamePrefix: string = 'DHJ_Data_Karyawan'): void {
  // Format rows matching exact requested schema with new fields
  const rows = employees.map((emp, index) => {
    const age = calculateAge(emp.birthDate);
    const near55 = isApproaching55(emp.birthDate);

    return {
      'No': index + 1,
      'Nama': emp.name,
      'NIK Karyawan': emp.nik,
      'NIK KTP': emp.nikKtp || '-',
      'Tanggal Lahir': emp.birthDate ? new Date(emp.birthDate).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }) : '-',
      'Usia (Tahun)': age !== null ? `${age} tahun` : '-',
      'Mendekati Usia 55 (Pensiun)': near55 ? 'YA (Peringatan Usia 54+)' : 'Tidak',
      'Nomor HP': emp.phone || '-',
      'Alamat': emp.address,
      'Divisi': emp.divisionName,
      'Kategori Subcont': emp.subcontName,
      'Nama Perusahaan / Subcont': emp.companyName || emp.subcontName,
      'Status Karyawan': emp.employeeStatus,
      'Status Verifikasi': emp.verificationStatus,
      'Catatan Verifikasi': emp.verificationNote || '-',
      'Tanggal Input': emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : '-',
      'Tanggal Update': emp.updatedAt ? new Date(emp.updatedAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 25 }, // Nama
    { wch: 15 }, // NIK Karyawan
    { wch: 20 }, // NIK KTP
    { wch: 18 }, // Tanggal Lahir
    { wch: 14 }, // Usia
    { wch: 26 }, // Mendekati Usia 55
    { wch: 18 }, // Nomor HP
    { wch: 35 }, // Alamat
    { wch: 18 }, // Divisi
    { wch: 18 }, // Kategori Subcont
    { wch: 28 }, // Nama Perusahaan / Subcont
    { wch: 16 }, // Status Karyawan
    { wch: 20 }, // Status Verifikasi
    { wch: 25 }, // Catatan Verifikasi
    { wch: 20 }, // Tanggal Input
    { wch: 20 }  // Tanggal Update
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Karyawan');

  const dateStr = new Date().toISOString().slice(0, 10);
  const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fullFileName);
}
