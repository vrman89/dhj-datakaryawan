import React, { useState, useEffect, useRef } from 'react';
import { Division, Employee, EmployeeStatus, Subcont, VerificationStatus } from '../../types';
import { Modal } from '../common/Modal';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { Camera, CreditCard, User, X, Calendar, Building2 } from 'lucide-react';
import { compressImageFile } from '../../utils/imageUtils';
import { calculateAge, isApproaching55 } from '../../utils/ageUtils';

interface EmployeeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  divisions: Division[];
  subconts: Subcont[];
  onSaved: () => void;
}

export const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({
  isOpen,
  onClose,
  employee,
  divisions,
  subconts,
  onSaved,
}) => {
  const { success, error, warning } = useToast();

  const [name, setName] = useState('');
  const [nik, setNik] = useState('');
  const [nikKtp, setNikKtp] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ktpPhoto, setKtpPhoto] = useState<string>('');
  const [facePhoto, setFacePhoto] = useState<string>('');
  const [divisionId, setDivisionId] = useState('');
  const [subcontId, setSubcontId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [employeeStatus, setEmployeeStatus] = useState<EmployeeStatus>('Internal');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('Menunggu Verifikasi');
  const [verificationNote, setVerificationNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const ktpInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setNik(employee.nik || '');
      setNikKtp(employee.nikKtp || '');
      setBirthDate(employee.birthDate || '');
      setPhone(employee.phone || '');
      setAddress(employee.address || '');
      setKtpPhoto(employee.ktpPhoto || '');
      setFacePhoto(employee.facePhoto || '');
      setDivisionId(employee.divisionId || '');
      setSubcontId(employee.subcontId || '');
      setCompanyName(employee.companyName || '');
      setEmployeeStatus(employee.employeeStatus || 'Internal');
      setVerificationStatus(employee.verificationStatus || 'Menunggu Verifikasi');
      setVerificationNote(employee.verificationNote || '');
    }
  }, [employee]);

  if (!employee) return null;

  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 900, 0.75);
      setKtpPhoto(compressed);
    } catch {
      error('Gagal memproses gambar KTP.');
    }
  };

  const handleFaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 600, 0.75);
      setFacePhoto(compressed);
    } catch {
      error('Gagal memproses gambar wajah.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nik.trim() || !address.trim() || !divisionId || !subcontId) {
      error('Harap lengkapi semua kolom wajib.');
      return;
    }

    setIsSaving(true);
    try {
      const isUnique = await dataService.isNikUnique(nik.trim(), employee.id);
      if (!isUnique) {
        warning('NIK sudah terdaftar pada karyawan lain.');
        setIsSaving(false);
        return;
      }

      const selectedDiv = divisions.find((d) => d.id === divisionId);
      const selectedSub = subconts.find((s) => s.id === subcontId);

      await dataService.updateEmployee(employee.id, {
        name: name.trim(),
        nik: nik.trim().toUpperCase(),
        nikKtp: nikKtp.trim(),
        birthDate: birthDate,
        phone: phone.trim(),
        address: address.trim(),
        ktpPhoto: ktpPhoto || '',
        facePhoto: facePhoto || '',
        divisionId,
        divisionName: selectedDiv?.name || employee.divisionName,
        subcontId,
        subcontName: selectedSub?.name || employee.subcontName,
        companyName: companyName.trim() || selectedSub?.name || 'Internal',
        employeeStatus,
        verificationStatus,
        verificationNote: verificationNote.trim(),
        ...(verificationStatus === 'Terverifikasi' && !employee.verifiedAt
          ? { verifiedAt: new Date().toISOString(), verifiedBy: 'Admin DHJ' }
          : {}),
      });

      success('Data karyawan berhasil diperbarui.');
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      error('Gagal memperbarui data.');
    } finally {
      setIsSaving(false);
    }
  };

  const calculatedAge = calculateAge(birthDate);
  const near55 = isApproaching55(birthDate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Data Karyawan"
      subtitle={`Perbarui data untuk ID: ${employee.id}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Face photo edit */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
            {facePhoto ? (
              <img src={facePhoto} alt="Face" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Foto Wajah Karyawan</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => faceInputRef.current?.click()}
                className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-[11px] font-semibold flex items-center gap-1"
              >
                <Camera className="w-3 h-3 text-blue-600" />
                <span>Ganti Foto</span>
              </button>
              {facePhoto && (
                <button
                  type="button"
                  onClick={() => setFacePhoto('')}
                  className="text-rose-600 hover:text-rose-700 text-[11px] font-medium"
                >
                  Hapus
                </button>
              )}
            </div>
            <input
              ref={faceInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFaceUpload}
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">NIK Karyawan *</label>
            <input
              type="text"
              value={nik}
              onChange={(e) => setNik(e.target.value.toUpperCase())}
              className="w-full p-2.5 font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">NIK KTP (16 Digit) *</label>
            <input
              type="text"
              maxLength={16}
              value={nikKtp}
              onChange={(e) => setNikKtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="3216012345670001"
              className="w-full p-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tanggal Lahir */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">Tanggal Lahir</label>
              {calculatedAge !== null && (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                  Usia: {calculatedAge} th
                </span>
              )}
            </div>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
            />
            {near55 && (
              <p className="text-[10px] font-bold text-amber-700 mt-1 flex items-center gap-1">
                ⚠️ Karyawan mendekati usia pensiun 55 tahun.
              </p>
            )}
          </div>

          {/* Nomor Handphone */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nomor Handphone / WA</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Status Hubungan Kerja</label>
            <select
              value={employeeStatus}
              onChange={(e) => setEmployeeStatus(e.target.value as EmployeeStatus)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
            >
              <option value="Internal">Internal</option>
              <option value="Subcont">Subcont</option>
              <option value="Outsourcing">Outsourcing</option>
              <option value="Kontrak">Kontrak</option>
              <option value="Tetap">Tetap</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Bagian / Divisi *</label>
            <select
              value={divisionId}
              onChange={(e) => setDivisionId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
              required
            >
              <option value="">-- Pilih Divisi --</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.status === 'Nonaktif' ? '(Nonaktif)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Kategori Subcont / Asal *</label>
            <select
              value={subcontId}
              onChange={(e) => setSubcontId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
              required
            >
              <option value="">-- Pilih Subcont --</option>
              {subconts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.status === 'Nonaktif' ? '(Nonaktif)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan / Subcont</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="PT Subcont Konstruksi Prima"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Alamat Rumah *</label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
            required
          />
        </div>

        {/* KTP Photo input */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700">Foto KTP</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => ktpInputRef.current?.click()}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700"
              >
                {ktpPhoto ? 'Ganti Foto KTP' : 'Unggah KTP'}
              </button>
              {ktpPhoto && (
                <button
                  type="button"
                  onClick={() => setKtpPhoto('')}
                  className="text-rose-600 hover:text-rose-700 text-[11px] font-medium"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
          {ktpPhoto ? (
            <img src={ktpPhoto} alt="KTP Preview" className="max-h-32 object-contain rounded-lg border bg-white mx-auto" />
          ) : (
            <p className="text-[11px] text-slate-400">Belum ada foto KTP terunggah.</p>
          )}
          <input
            ref={ktpInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleKtpUpload}
          />
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <label className="block font-bold text-slate-700">Status Verifikasi Berkas</label>
          <select
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
          >
            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
            <option value="Terverifikasi">Terverifikasi</option>
            <option value="Perlu Perbaikan">Perlu Perbaikan</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>

          {verificationStatus === 'Perlu Perbaikan' && (
            <div>
              <label className="block font-medium text-slate-600 mb-1">Catatan Perbaikan</label>
              <input
                type="text"
                value={verificationNote}
                onChange={(e) => setVerificationNote(e.target.value)}
                placeholder="Misal: Foto KTP buram atau alamat belum lengkap..."
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
