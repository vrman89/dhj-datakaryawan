import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle2, Clock, Edit3, ArrowRight } from 'lucide-react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { dataService } from '../../services/dataService';
import { Employee } from '../../types';
import { useToast } from '../../context/ToastContext';
import { calculateAge } from '../../utils/ageUtils';

interface EmployeeCheckStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForEdit: (employee: Employee) => void;
}

export const EmployeeCheckStatusModal: React.FC<EmployeeCheckStatusModalProps> = ({
  isOpen,
  onClose,
  onSelectForEdit,
}) => {
  const [nikInput, setNikInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundEmployee, setFoundEmployee] = useState<Employee | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { warning } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nikInput.trim()) {
      warning('Silakan masukkan nomor NIK Anda.');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const emp = await dataService.getEmployeeByNik(nikInput.trim());
      setFoundEmployee(emp);
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSearch = () => {
    setNikInput('');
    setFoundEmployee(null);
    setHasSearched(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleResetSearch();
        onClose();
      }}
      title="Cek Status Pengajuan & Perbaikan Data"
      subtitle="Ketik NIK Anda untuk melihat status verifikasi atau memperbaiki data."
      maxWidth="md"
    >
      <div className="space-y-5">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={nikInput}
              onChange={(e) => setNikInput(e.target.value.toUpperCase())}
              placeholder="Masukkan NIK Anda (misal: EMP001)..."
              className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden uppercase font-mono tracking-wider"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Mencari...' : 'Periksa'}
          </button>
        </form>

        {hasSearched && !foundEmployee && !isLoading && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">NIK Tidak Ditemukan</p>
            <p className="text-xs text-slate-500">
              Tidak ditemukan data karyawan dengan NIK <span className="font-mono font-bold text-slate-700">{nikInput}</span>. Silakan periksa kembali atau isi formulir pendaftaran baru.
            </p>
          </div>
        )}

        {foundEmployee && (
          <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700 shrink-0">
                  {foundEmployee.facePhoto ? (
                    <img src={foundEmployee.facePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    foundEmployee.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{foundEmployee.name}</h4>
                  <p className="text-xs font-mono font-semibold text-blue-600">
                    NIK: {foundEmployee.nik} {foundEmployee.phone ? `• ${foundEmployee.phone}` : ''}
                  </p>
                </div>
              </div>
              <StatusBadge status={foundEmployee.verificationStatus} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-medium">Bagian / Divisi</span>
                <span className="font-semibold text-slate-800">{foundEmployee.divisionName}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-medium">Perusahaan / Subcont</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {foundEmployee.companyName || foundEmployee.subcontName}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-medium">Tanggal Lahir & Usia</span>
                <span className="font-semibold text-slate-800">
                  {foundEmployee.birthDate
                    ? `${new Date(foundEmployee.birthDate).toLocaleDateString('id-ID')} (${calculateAge(foundEmployee.birthDate)} th)`
                    : '-'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-medium">Status Karyawan</span>
                <span className="font-semibold text-slate-800">{foundEmployee.employeeStatus}</span>
              </div>
            </div>

            {/* Note from admin if verification needed */}
            {foundEmployee.verificationStatus === 'Perlu Perbaikan' && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>Catatan Perbaikan dari Admin:</span>
                </div>
                <p className="text-xs text-rose-900 font-medium leading-relaxed bg-white/70 p-2.5 rounded-lg border border-rose-100">
                  {foundEmployee.verificationNote || 'Harap periksa kembali kelengkapan data diri dan alamat rumah.'}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    onSelectForEdit(foundEmployee);
                    onClose();
                  }}
                  className="w-full mt-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Perbaiki & Kirim Ulang Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {foundEmployee.verificationStatus === 'Menunggu Verifikasi' && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <p>Data Anda sedang dalam antrean verifikasi oleh Admin HR.</p>
              </div>
            )}

            {foundEmployee.verificationStatus === 'Terverifikasi' && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p>Selamat! Data Anda telah terverifikasi secara resmi di sistem.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
