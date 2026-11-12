import React, { useState } from 'react';
import {
  User,
  CreditCard,
  MapPin,
  Building,
  Layers,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Edit,
  Trash2,
  Clock,
  Send,
  Phone,
  ExternalLink,
  ZoomIn,
} from 'lucide-react';
import { Employee } from '../../types';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { calculateAge, isApproaching55 } from '../../utils/ageUtils';

interface EmployeeDetailModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
  onVerify: (employee: Employee) => void;
  onRequestCorrection: (employee: Employee, note: string) => void;
  onDelete: (employee: Employee) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  isOpen,
  onClose,
  onEdit,
  onVerify,
  onRequestCorrection,
  onDelete,
}) => {
  const [isNoteInputOpen, setIsNoteInputOpen] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');
  const [isKtpZoomed, setIsKtpZoomed] = useState(false);

  if (!employee) return null;

  const age = calculateAge(employee.birthDate);
  const near55 = isApproaching55(employee.birthDate);

  const handleSendCorrection = () => {
    if (!correctionNote.trim()) return;
    onRequestCorrection(employee, correctionNote.trim());
    setIsNoteInputOpen(false);
    setCorrectionNote('');
    onClose();
  };

  // WhatsApp clean number
  const cleanPhone = (employee.phone || '').replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsNoteInputOpen(false);
          setCorrectionNote('');
          onClose();
        }}
        title="DATA KARYAWAN"
        subtitle={`Informasi rincian profil ID: ${employee.id}`}
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Retirement Alert Banner if approaching 55 */}
          {near55 && (
            <div className="p-4 bg-amber-500/10 border-2 border-amber-400 rounded-2xl flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-amber-950">
                  Pemberitahuan Pensiun: Karyawan Mendekati Usia 55 Tahun
                </p>
                <p className="text-xs text-amber-900/90 mt-0.5">
                  Berdasarkan tanggal lahir, karyawan saat ini berusia{' '}
                  <span className="font-bold underline">{age !== null ? `${age} tahun` : '54+ tahun'}</span>{' '}
                  dan mendekati batas usia pensiun kerja 55 tahun. Harap perhatikan administrasi masa pensiun tenaga kerja.
                </p>
              </div>
            </div>
          )}

          {/* Top Profile Summary with Face Photo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl bg-slate-200 border-2 border-white shadow-md overflow-hidden shrink-0 flex items-center justify-center font-extrabold text-xl text-slate-700">
                {employee.facePhoto ? (
                  <img
                    src={employee.facePhoto}
                    alt={employee.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  employee.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900">{employee.name}</h3>
                  {near55 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[10px] font-extrabold">
                      ⚠️ 54+ Thn
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono font-semibold text-blue-600">NIK: {employee.nik}</p>
                {employee.phone && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {employee.phone}
                    </span>
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${waNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 transition-colors"
                      >
                        <span>WhatsApp</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Status Validasi</span>
              <StatusBadge status={employee.verificationStatus} />
            </div>
          </div>

          {/* Detailed Fields List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Nama Lengkap</span>
              <span className="font-bold text-slate-800 text-sm">{employee.name}</span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">NIK Karyawan</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{employee.nik}</span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">NIK KTP (16 Digit)</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{employee.nikKtp || '-'}</span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium block">Tanggal Lahir & Usia</span>
                {near55 && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    Pensiun 55
                  </span>
                )}
              </div>
              <span className="font-bold text-slate-800 text-sm block">
                {employee.birthDate
                  ? new Date(employee.birthDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '-'}
              </span>
              {age !== null && (
                <span className="text-[11px] text-blue-700 font-semibold block">
                  Usia saat ini: {age} tahun
                </span>
              )}
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Nomor Handphone</span>
              <span className="font-semibold text-slate-800 text-sm">{employee.phone || '-'}</span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Status Hubungan Kerja</span>
              <div className="pt-0.5">
                <StatusBadge status={employee.employeeStatus} size="sm" />
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Bagian / Divisi</span>
              <span className="font-bold text-slate-800 text-sm">{employee.divisionName}</span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Nama Perusahaan / Subcont</span>
              <span className="font-bold text-slate-800 text-sm block">
                {employee.companyName || employee.subcontName}
              </span>
              {employee.companyName && employee.companyName !== employee.subcontName && (
                <span className="text-[11px] text-slate-500 block">Kategori: {employee.subcontName}</span>
              )}
            </div>

            <div className="sm:col-span-2 p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Alamat Rumah Tinggal</span>
              <p className="font-medium text-slate-800 text-xs sm:text-sm leading-relaxed">
                {employee.address}
              </p>
            </div>

            {/* Foto KTP Preview */}
            <div className="sm:col-span-2 p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium block">Dokumen Foto KTP</span>
                {employee.ktpPhoto && (
                  <button
                    type="button"
                    onClick={() => setIsKtpZoomed(true)}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-xs flex items-center gap-1"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Perbesar KTP</span>
                  </button>
                )}
              </div>

              {employee.ktpPhoto ? (
                <div
                  onClick={() => setIsKtpZoomed(true)}
                  className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 cursor-pointer group max-h-48 flex items-center justify-center p-1"
                >
                  <img
                    src={employee.ktpPhoto}
                    alt="KTP"
                    className="max-h-44 object-contain rounded-lg group-hover:scale-102 transition-transform"
                  />
                  <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                    <ZoomIn className="w-4 h-4" />
                    <span>Klik untuk memperbesar</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                  Foto KTP belum diunggah oleh karyawan.
                </div>
              )}
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Tanggal Pengisian Data</span>
              <span className="font-medium text-slate-800 text-xs">
                {employee.createdAt
                  ? new Date(employee.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '-'}
              </span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Tanggal Pembaruan Terakhir</span>
              <span className="font-medium text-slate-800 text-xs">
                {employee.updatedAt
                  ? new Date(employee.updatedAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : '-'}
              </span>
            </div>

            {employee.verifiedAt && (
              <div className="sm:col-span-2 p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1">
                <span className="text-emerald-700 font-medium block">Diverifikasi Pada</span>
                <span className="font-bold text-emerald-900 text-xs">
                  {new Date(employee.verifiedAt).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                  {employee.verifiedBy ? ` oleh ${employee.verifiedBy}` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Verification Note if present */}
          {employee.verificationNote && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Catatan Verifikasi / Perbaikan:
              </span>
              <p className="text-amber-800">{employee.verificationNote}</p>
            </div>
          )}

          {/* Form to submit 'Minta Perbaikan' note */}
          {isNoteInputOpen && (
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl space-y-3 animate-in fade-in">
              <label className="block text-xs font-bold text-slate-800">
                Catatan Permintaan Perbaikan untuk Karyawan:
              </label>
              <textarea
                rows={2}
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                placeholder="Contoh: Foto KTP buram dan alamat belum lengkap nomor rumah..."
                className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNoteInputOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendCorrection}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Permintaan</span>
                </button>
              </div>
            </div>
          )}

          {/* 4 Action Buttons as specifically requested */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onDelete(employee);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(employee);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Data</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNoteInputOpen(!isNoteInputOpen)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Minta Perbaikan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onVerify(employee);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verifikasi</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Lightbox for KTP Zoom */}
      {isKtpZoomed && employee.ktpPhoto && (
        <Modal
          isOpen={isKtpZoomed}
          onClose={() => setIsKtpZoomed(false)}
          title={`Foto KTP - ${employee.name} (${employee.nik})`}
          maxWidth="2xl"
        >
          <div className="p-2 text-center">
            <img
              src={employee.ktpPhoto}
              alt="Foto KTP Full"
              className="w-full max-h-[75vh] object-contain rounded-xl mx-auto shadow-sm"
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsKtpZoomed(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
