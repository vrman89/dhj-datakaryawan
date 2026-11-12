export type EmployeeStatus = 
  | 'Internal' 
  | 'Subcont' 
  | 'Outsourcing' 
  | 'Kontrak' 
  | 'Tetap' 
  | 'Lainnya';

export type VerificationStatus = 
  | 'Menunggu Verifikasi' 
  | 'Terverifikasi' 
  | 'Perlu Perbaikan' 
  | 'Tidak Aktif';

export type ActiveStatus = 'Aktif' | 'Nonaktif';

export interface Employee {
  id: string;
  name: string;
  nik: string; // NIK Karyawan (EMP001, etc.)
  nikKtp: string; // NIK KTP 16 digit
  address: string;
  divisionId: string;
  divisionName: string;
  subcontId: string;
  subcontName: string; // Nama Perusahaan / Subcont
  companyName?: string; // Nama Perusahaan / Subcont (alias)
  birthDate: string; // Tanggal lahir (YYYY-MM-DD)
  employeeStatus: EmployeeStatus;
  verificationStatus: VerificationStatus;
  phone: string;
  ktpPhoto?: string;
  facePhoto?: string;
  verificationNote?: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface Division {
  id: string;
  name: string;
  status: ActiveStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Subcont {
  id: string;
  name: string;
  status: ActiveStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  status: 'Aktif' | 'Nonaktif';
  createdAt: string;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'employees' 
  | 'verification' 
  | 'divisions' 
  | 'subconts' 
  | 'reports' 
  | 'settings';
