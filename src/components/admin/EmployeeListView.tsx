import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Users,
  RotateCcw,
} from 'lucide-react';
import { Division, Employee, Subcont } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { exportEmployeesToExcel } from '../../services/exportService';
import { useToast } from '../../context/ToastContext';
import { calculateAge, isApproaching55 } from '../../utils/ageUtils';

interface EmployeeListViewProps {
  employees: Employee[];
  divisions: Division[];
  subconts: Subcont[];
  onViewDetail: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onVerify: (employee: Employee) => void;
  onRequestCorrection: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onAddNew: () => void;
}

const ITEMS_PER_PAGE = 8;

export const EmployeeListView: React.FC<EmployeeListViewProps> = ({
  employees,
  divisions,
  subconts,
  onViewDetail,
  onEdit,
  onVerify,
  onRequestCorrection,
  onDelete,
  onAddNew,
}) => {
  const { success } = useToast();

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [subcontFilter, setSubcontFilter] = useState('');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState('');
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('');
  const [pensionFilter, setPensionFilter] = useState<'all' | 'approaching55'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        emp.name.toLowerCase().includes(search) ||
        emp.nik.toLowerCase().includes(search) ||
        (emp.nikKtp && emp.nikKtp.toLowerCase().includes(search)) ||
        (emp.companyName && emp.companyName.toLowerCase().includes(search)) ||
        emp.address.toLowerCase().includes(search);

      // Division
      const matchesDivision = !divisionFilter || emp.divisionId === divisionFilter;

      // Subcont
      const matchesSubcont = !subcontFilter || emp.subcontId === subcontFilter;

      // Employee Status
      const matchesEmpStatus = !employeeStatusFilter || emp.employeeStatus === employeeStatusFilter;

      // Verification Status
      const matchesVerifStatus =
        !verificationStatusFilter || emp.verificationStatus === verificationStatusFilter;

      // Pension Filter (Approaching 55)
      const matchesPension =
        pensionFilter === 'all' || (pensionFilter === 'approaching55' && isApproaching55(emp.birthDate));

      return (
        matchesSearch &&
        matchesDivision &&
        matchesSubcont &&
        matchesEmpStatus &&
        matchesVerifStatus &&
        matchesPension
      );
    });
  }, [
    employees,
    searchTerm,
    divisionFilter,
    subcontFilter,
    employeeStatusFilter,
    verificationStatusFilter,
    pensionFilter,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE) || 1;
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setDivisionFilter('');
    setSubcontFilter('');
    setEmployeeStatusFilter('');
    setVerificationStatusFilter('');
    setPensionFilter('all');
    setCurrentPage(1);
  };

  const handleExport = () => {
    exportEmployeesToExcel(filteredEmployees, 'DHJ_Data_Karyawan_Terfilter');
    success(`Berhasil mengekspor ${filteredEmployees.length} data karyawan ke Excel.`);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Data Karyawan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola, telusuri, dan validasi data tenaga kerja internal serta subkontraktor
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama atau NIK..."
              className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Reset button */}
          {(searchTerm ||
            divisionFilter ||
            subcontFilter ||
            employeeStatusFilter ||
            verificationStatusFilter ||
            pensionFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* 5 Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {/* Divisi */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Divisi</label>
            <select
              value={divisionFilter}
              onChange={(e) => {
                setDivisionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">Semua Divisi</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcont */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Subcont</label>
            <select
              value={subcontFilter}
              onChange={(e) => {
                setSubcontFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">Semua Subcont</option>
              {subconts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Hubungan */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status Karyawan</label>
            <select
              value={employeeStatusFilter}
              onChange={(e) => {
                setEmployeeStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">Semua Status</option>
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
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status Verifikasi</label>
            <select
              value={verificationStatusFilter}
              onChange={(e) => {
                setVerificationStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
            >
              <option value="">Semua Verifikasi</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Terverifikasi">Terverifikasi</option>
              <option value="Perlu Perbaikan">Perlu Perbaikan</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>
          </div>

          {/* Filter Usia / Pensiun 55 */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Usia / Pensiun</label>
            <select
              value={pensionFilter}
              onChange={(e) => {
                setPensionFilter(e.target.value as 'all' | 'approaching55');
                setCurrentPage(1);
              }}
              className={`w-full p-2 text-xs border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium ${
                pensionFilter === 'approaching55'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="all">Semua Usia</option>
              <option value="approaching55">⚠️ Usia 54+ (Mendekati 55)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table on Desktop, Cards on Mobile */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredEmployees.length === 0 ? (
          /* Empty State per section 18 */
          <div className="p-10 sm:p-14 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Belum ada data karyawan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm || divisionFilter || subcontFilter
                  ? 'Tidak ada data yang sesuai dengan filter pencarian Anda.'
                  : 'Mulai input data tenaga kerja pertama Anda melalui tombol di bawah.'}
              </p>
            </div>
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Data</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Karyawan & Usia</th>
                    <th className="py-3 px-4">NIK & Kontak</th>
                    <th className="py-3 px-4 max-w-xs">Alamat</th>
                    <th className="py-3 px-4">Divisi</th>
                    <th className="py-3 px-4">Perusahaan / Subcont</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedEmployees.map((emp, index) => {
                    const rowNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                    const age = calculateAge(emp.birthDate);
                    const near55 = isApproaching55(emp.birthDate);

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                          {rowNumber}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-600 shrink-0">
                              {emp.facePhoto ? (
                                <img src={emp.facePhoto} alt="" className="w-full h-full object-cover" />
                              ) : (
                                emp.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <span className="truncate block">{emp.name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {age !== null && (
                                  <span className="text-[10px] font-normal text-slate-500">
                                    {age} th
                                  </span>
                                )}
                                {near55 && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                                    ⚠️ Pensiun 55
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-mono font-semibold text-blue-700 block">{emp.nik}</span>
                            <span className="text-[11px] text-slate-500 block">{emp.phone || '-'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={emp.address}>
                          {emp.address}
                        </td>
                        <td className="py-3.5 px-4">{emp.divisionName}</td>
                        <td className="py-3.5 px-4">
                          <span className="block font-semibold text-slate-800">
                            {emp.companyName || emp.subcontName}
                          </span>
                          {emp.companyName && emp.companyName !== emp.subcontName && (
                            <span className="text-[10px] text-slate-400 block">{emp.subcontName}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={emp.verificationStatus} size="sm" />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1">
                            {/* Detail */}
                            <button
                              onClick={() => onViewDetail(emp)}
                              title="Lihat Detail"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => onEdit(emp)}
                              title="Edit Data"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Verifikasi */}
                            {emp.verificationStatus !== 'Terverifikasi' && (
                              <button
                                onClick={() => onVerify(emp)}
                                title="Verifikasi Data"
                                className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Minta Perbaikan */}
                            {emp.verificationStatus !== 'Perlu Perbaikan' && (
                              <button
                                onClick={() => onRequestCorrection(emp)}
                                title="Minta Perbaikan"
                                className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Hapus */}
                            <button
                              onClick={() => onDelete(emp)}
                              title="Hapus Data"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View per section 7 */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedEmployees.map((emp, index) => {
                const rowNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                const age = calculateAge(emp.birthDate);
                const near55 = isApproaching55(emp.birthDate);

                return (
                  <div key={emp.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-600 shrink-0">
                          {emp.facePhoto ? (
                            <img src={emp.facePhoto} alt="" className="w-full h-full object-cover" />
                          ) : (
                            emp.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm">{emp.name}</h4>
                            {near55 && (
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[9px] font-bold">
                                ⚠️ Pensiun 55
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-xs font-bold text-blue-600 block">
                            NIK: {emp.nik}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            {age !== null && <span>Usia: {age} th</span>}
                            {emp.phone && <span>• HP: {emp.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={emp.verificationStatus} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Divisi</span>
                        <span className="font-semibold text-slate-700">{emp.divisionName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Perusahaan / Subcont</span>
                        <span className="font-semibold text-slate-700 truncate block">
                          {emp.companyName || emp.subcontName}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Alamat</span>
                        <span className="text-slate-600 truncate block">{emp.address}</span>
                      </div>
                    </div>

                    {/* Action buttons on mobile */}
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => onViewDetail(emp)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                      <button
                        onClick={() => onEdit(emp)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      {emp.verificationStatus !== 'Terverifikasi' && (
                        <button
                          onClick={() => onVerify(emp)}
                          className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verifikasi</span>
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(emp)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <div>
                Menampilkan{' '}
                <span className="font-semibold text-slate-700">
                  {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredEmployees.length)}
                </span>{' '}
                -{' '}
                <span className="font-semibold text-slate-700">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)}
                </span>{' '}
                dari <span className="font-semibold text-slate-700">{filteredEmployees.length}</span>{' '}
                karyawan
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
