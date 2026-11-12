import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  CheckCircle2,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { Division, Employee, Subcont } from '../../types';
import { exportEmployeesToExcel } from '../../services/exportService';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { calculateAge, isApproaching55 } from '../../utils/ageUtils';

interface ReportsViewProps {
  employees: Employee[];
  divisions: Division[];
  subconts: Subcont[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  employees,
  divisions,
  subconts,
}) => {
  const { success } = useToast();

  const [divisionFilter, setDivisionFilter] = useState('');
  const [subcontFilter, setSubcontFilter] = useState('');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState('');
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('');
  const [pensionFilter, setPensionFilter] = useState<'all' | 'approaching55'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (divisionFilter && emp.divisionId !== divisionFilter) return false;
      if (subcontFilter && emp.subcontId !== subcontFilter) return false;
      if (employeeStatusFilter && emp.employeeStatus !== employeeStatusFilter) return false;
      if (verificationStatusFilter && emp.verificationStatus !== verificationStatusFilter) return false;
      if (pensionFilter === 'approaching55' && !isApproaching55(emp.birthDate)) return false;

      if (startDate) {
        const empDate = new Date(emp.createdAt).toISOString().slice(0, 10);
        if (empDate < startDate) return false;
      }
      if (endDate) {
        const empDate = new Date(emp.createdAt).toISOString().slice(0, 10);
        if (empDate > endDate) return false;
      }
      return true;
    });
  }, [
    employees,
    divisionFilter,
    subcontFilter,
    employeeStatusFilter,
    verificationStatusFilter,
    pensionFilter,
    startDate,
    endDate,
  ]);

  const handleExport = () => {
    exportEmployeesToExcel(filteredEmployees, 'DHJ_Laporan_Karyawan');
    success(`Berhasil mengunduh file Excel (${filteredEmployees.length} baris).`);
  };

  const handleReset = () => {
    setDivisionFilter('');
    setSubcontFilter('');
    setEmployeeStatusFilter('');
    setVerificationStatusFilter('');
    setPensionFilter('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Laporan & Export Excel
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unduh data rekapitulasi tenaga kerja internal dan subcont dalam format resmi .xlsx
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={filteredEmployees.length === 0}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Download File Excel (.xlsx)</span>
        </button>
      </div>

      {/* Filter Parameters Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Kriteria Filter Laporan</span>
          </div>
          <button
            onClick={handleReset}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Kriteria</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Divisi */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Berdasarkan Divisi</label>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Bagian / Divisi</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcont */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Berdasarkan Subcont</label>
            <select
              value={subcontFilter}
              onChange={(e) => setSubcontFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Subcont / Vendor</option>
              {subconts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Hubungan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Status Karyawan</label>
            <select
              value={employeeStatusFilter}
              onChange={(e) => setEmployeeStatusFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Hubungan Kerja</option>
              <option value="Internal">Internal</option>
              <option value="Subcont">Subcont</option>
              <option value="Outsourcing">Outsourcing</option>
              <option value="Kontrak">Kontrak</option>
              <option value="Tetap">Tetap</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Status Verifikasi */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Status Verifikasi</label>
            <select
              value={verificationStatusFilter}
              onChange={(e) => setVerificationStatusFilter(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status Verifikasi</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Terverifikasi">Terverifikasi</option>
              <option value="Perlu Perbaikan">Perlu Perbaikan</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>
          </div>

          {/* Filter Usia / Pensiun 55 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Filter Usia / Pensiun</label>
            <select
              value={pensionFilter}
              onChange={(e) => setPensionFilter(e.target.value as 'all' | 'approaching55')}
              className={`w-full p-2.5 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium ${
                pensionFilter === 'approaching55'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="all">Semua Kelompok Usia</option>
              <option value="approaching55">⚠️ Usia 54+ (Mendekati Pensiun 55)</option>
            </select>
          </div>

          {/* Rentang Tanggal Mulai */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Dari Tanggal Input</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Rentang Tanggal Selesai */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Sampai Tanggal Input</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Box & Data Preview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500">Hasil filter:</span>{' '}
            <span className="font-extrabold text-slate-900 text-sm">
              {filteredEmployees.length} Karyawan
            </span>{' '}
            <span className="text-slate-400">siap diekspor</span>
          </div>

          <span className="text-[11px] text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200 font-mono">
            Format file: Microsoft Excel OpenXML (.xlsx)
          </span>
        </div>

        {/* Preview Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold sticky top-0 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center">No</th>
                <th className="py-2.5 px-4">Nama</th>
                <th className="py-2.5 px-4">NIK</th>
                <th className="py-2.5 px-4">Usia</th>
                <th className="py-2.5 px-4">Divisi</th>
                <th className="py-2.5 px-4">Perusahaan / Subcont</th>
                <th className="py-2.5 px-4">Status Karyawan</th>
                <th className="py-2.5 px-4">Status Verifikasi</th>
                <th className="py-2.5 px-4">Tanggal Input</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                    Tidak ada data karyawan yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => {
                  const age = calculateAge(emp.birthDate);
                  const near55 = isApproaching55(emp.birthDate);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{emp.name}</span>
                          {near55 && (
                            <span className="px-1 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[9px] font-bold">
                              Pensiun 55
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-blue-700">{emp.nik}</td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {age !== null ? `${age} th` : '-'}
                      </td>
                      <td className="py-2.5 px-4">{emp.divisionName}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {emp.companyName || emp.subcontName}
                      </td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={emp.employeeStatus} size="sm" />
                      </td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={emp.verificationStatus} size="sm" />
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {new Date(emp.createdAt).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
