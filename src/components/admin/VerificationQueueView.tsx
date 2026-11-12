import React, { useState } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  MessageSquare,
  Send,
  Sparkles,
  Search,
} from 'lucide-react';
import { Employee } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { calculateAge, isApproaching55 } from '../../utils/ageUtils';

interface VerificationQueueViewProps {
  employees: Employee[];
  onVerify: (employee: Employee) => void;
  onRequestCorrection: (employee: Employee, note: string) => void;
  onViewDetail: (employee: Employee) => void;
}

export const VerificationQueueView: React.FC<VerificationQueueViewProps> = ({
  employees,
  onVerify,
  onRequestCorrection,
  onViewDetail,
}) => {
  const { success, warning } = useToast();

  const [activeTab, setActiveTab] = useState<'pending' | 'correction' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Note dialog state
  const [selectedEmpForNote, setSelectedEmpForNote] = useState<Employee | null>(null);
  const [noteText, setNoteText] = useState('');

  const pendingEmployees = employees.filter((e) => e.verificationStatus === 'Menunggu Verifikasi');
  const correctionEmployees = employees.filter((e) => e.verificationStatus === 'Perlu Perbaikan');

  const displayedList = employees.filter((emp) => {
    if (activeTab === 'pending' && emp.verificationStatus !== 'Menunggu Verifikasi') return false;
    if (activeTab === 'correction' && emp.verificationStatus !== 'Perlu Perbaikan') return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.nik.toLowerCase().includes(q) ||
        (emp.nikKtp && emp.nikKtp.toLowerCase().includes(q)) ||
        emp.divisionName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenCorrection = (emp: Employee) => {
    setSelectedEmpForNote(emp);
    setNoteText(emp.verificationNote || '');
  };

  const handleSendCorrection = () => {
    if (!selectedEmpForNote) return;
    if (!noteText.trim()) {
      warning('Harap masukkan catatan bagian mana yang perlu diperbaiki.');
      return;
    }
    onRequestCorrection(selectedEmpForNote, noteText.trim());
    setSelectedEmpForNote(null);
    setNoteText('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Verifikasi Data Karyawan
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tinjau pengajuan berkas mandiri karyawan. Setujui verifikasi atau berikan catatan revisi.
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Menunggu ({pendingEmployees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('correction')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'correction'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Perlu Perbaikan ({correctionEmployees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Semua Status</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari antrean..."
            className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden w-full sm:w-64"
          />
        </div>
      </div>

      {/* Queue Cards */}
      {displayedList.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak ada antrean verifikasi</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Semua data karyawan pada kriteria ini telah selesai diproses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedList.map((emp) => {
            const age = calculateAge(emp.birthDate);
            const near55 = isApproaching55(emp.birthDate);

            return (
              <div
                key={emp.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                          {emp.name}
                        </h4>
                        {near55 && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[10px] font-extrabold">
                            ⚠️ Mendekati 55 Th
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono font-semibold text-blue-600 mt-0.5">
                        NIK: {emp.nik} {age !== null ? `• Usia: ${age} th` : ''} {emp.phone ? `• HP: ${emp.phone}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={emp.verificationStatus} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Bagian / Divisi</span>
                      <span className="font-semibold text-slate-700">{emp.divisionName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Perusahaan / Subcont</span>
                      <span className="font-semibold text-slate-700 truncate block">
                        {emp.companyName || emp.subcontName}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">Alamat Tinggal</span>
                      <p className="font-medium text-slate-700 line-clamp-2">{emp.address}</p>
                    </div>
                  </div>

                {emp.verificationNote && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Catatan Perbaikan Terakhir:
                    </span>
                    <p className="text-rose-900 font-medium">{emp.verificationNote}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onViewDetail(emp)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Detail</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCorrection(emp)}
                    className="px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Minta Perbaikan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onVerify(emp)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verifikasi</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal for Minta Perbaikan */}
      <Modal
        isOpen={!!selectedEmpForNote}
        onClose={() => setSelectedEmpForNote(null)}
        title="Minta Perbaikan Data Karyawan"
        subtitle={
          selectedEmpForNote
            ? `Kirimkan instruksi perbaikan untuk ${selectedEmpForNote.name} (NIK: ${selectedEmpForNote.nik})`
            : undefined
        }
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            Karyawan dapat melihat catatan ini saat mengecek status atau melakukan pengisian ulang formulir pendaftaran.
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Rincian Catatan / Bagian yang Harus Diperbaiki:
            </label>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Contoh: Alamat rumah belum lengkap nomor RT/RW dan nomor rumah. Harap perbarui data Anda..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedEmpForNote(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSendCorrection}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simpan & Minta Perbaikan</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
