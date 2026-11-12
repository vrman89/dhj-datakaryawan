import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  CreditCard,
  MapPin,
  Building2,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Send,
  Search,
  Sparkles,
  Info,
  Phone,
  Camera,
  Upload,
  X,
  Image as ImageIcon,
  IdCard,
  Calendar,
} from 'lucide-react';
import { Division, Employee, EmployeeStatus, Subcont } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { EmployeeCheckStatusModal } from './EmployeeCheckStatusModal';
import { compressImageFile } from '../../utils/imageUtils';
import { calculateAge, isApproaching55 } from '../../utils/ageUtils';

interface EmployeeFormProps {
  divisions: Division[];
  subconts: Subcont[];
  editingEmployee?: Employee | null;
  onCancelEdit?: () => void;
  onSuccessSubmit?: (employee: Employee) => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  divisions,
  subconts,
  editingEmployee,
  onCancelEdit,
  onSuccessSubmit,
}) => {
  const { success, error, warning } = useToast();

  // Form states
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

  // Loading & status
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingNik, setIsCheckingNik] = useState(false);
  const [isProcessingKtp, setIsProcessingKtp] = useState(false);
  const [isProcessingFace, setIsProcessingFace] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isCheckStatusModalOpen, setIsCheckStatusModalOpen] = useState(false);
  const [submittedData, setSubmittedData] = useState<Employee | null>(null);

  // File input refs
  const ktpInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);

  // Filter active divisions & subconts
  const activeDivisions = divisions.filter((d) => d.status === 'Aktif');
  const activeSubconts = subconts.filter((s) => s.status === 'Aktif');

  // Prefill when editing (e.g., from Perlu Perbaikan)
  useEffect(() => {
    if (editingEmployee) {
      setName(editingEmployee.name || '');
      setNik(editingEmployee.nik || '');
      setNikKtp(editingEmployee.nikKtp || '');
      setBirthDate(editingEmployee.birthDate || '');
      setPhone(editingEmployee.phone || '');
      setAddress(editingEmployee.address || '');
      setKtpPhoto(editingEmployee.ktpPhoto || '');
      setFacePhoto(editingEmployee.facePhoto || '');
      setDivisionId(editingEmployee.divisionId || '');
      setSubcontId(editingEmployee.subcontId || '');
      setCompanyName(editingEmployee.companyName || '');
      setEmployeeStatus(editingEmployee.employeeStatus || 'Internal');
      setErrors({});
    } else {
      resetForm();
    }
  }, [editingEmployee]);

  // Real-time validation helper
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Nama lengkap wajib diisi.';
        } else if (value.trim().length < 3) {
          newErrors.name = 'Nama lengkap minimal 3 karakter.';
        } else {
          delete newErrors.name;
        }
        break;

      case 'nik':
        if (!value.trim()) {
          newErrors.nik = 'NIK Karyawan wajib diisi.';
        } else if (value.trim().length < 3) {
          newErrors.nik = 'NIK minimal 3 karakter.';
        } else {
          delete newErrors.nik;
        }
        break;

      case 'nikKtp':
        if (!value.trim()) {
          newErrors.nikKtp = 'NIK KTP (16 digit) wajib diisi.';
        } else if (!/^[0-9]{16}$/.test(value.trim())) {
          newErrors.nikKtp = 'NIK KTP harus terdiri dari 16 digit angka.';
        } else {
          delete newErrors.nikKtp;
        }
        break;

      case 'birthDate':
        if (!value) {
          newErrors.birthDate = 'Tanggal lahir wajib diisi.';
        } else {
          const age = calculateAge(value);
          if (age === null || age < 17) {
            newErrors.birthDate = 'Usia minimal karyawan adalah 17 tahun.';
          } else if (age > 90) {
            newErrors.birthDate = 'Tanggal lahir tidak valid.';
          } else {
            delete newErrors.birthDate;
          }
        }
        break;

      case 'phone':
        if (!value.trim()) {
          newErrors.phone = 'Nomor handphone wajib diisi.';
        } else if (!/^[0-9+ -]{8,20}$/.test(value.trim())) {
          newErrors.phone = 'Format nomor HP tidak valid (minimal 8 digit angka).';
        } else {
          delete newErrors.phone;
        }
        break;

      case 'address':
        if (!value.trim()) {
          newErrors.address = 'Alamat rumah wajib diisi.';
        } else if (value.trim().length < 5) {
          newErrors.address = 'Harap masukkan alamat yang lengkap (minimal 5 karakter).';
        } else {
          delete newErrors.address;
        }
        break;

      case 'divisionId':
        if (!value) {
          newErrors.divisionId = 'Pilih bagian / divisi penugasan.';
        } else {
          delete newErrors.divisionId;
        }
        break;

      case 'subcontId':
        if (!value) {
          newErrors.subcontId = 'Pilih nama subcont atau internal.';
        } else {
          delete newErrors.subcontId;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleNikBlur = async () => {
    if (!nik.trim() || nik.trim().length < 3) return;

    setIsCheckingNik(true);
    try {
      const isUnique = await dataService.isNikUnique(
        nik.trim(),
        editingEmployee ? editingEmployee.id : undefined
      );

      if (!isUnique) {
        setErrors((prev) => ({
          ...prev,
          nik: 'NIK Karyawan sudah terdaftar dalam sistem! Harap gunakan NIK Anda yang valid.',
        }));
        warning('NIK Karyawan sudah terdaftar dalam sistem.');
      } else {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.nik;
          return updated;
        });
      }
    } catch (e) {
      console.warn('Error checking NIK uniqueness:', e);
    } finally {
      setIsCheckingNik(false);
    }
  };

  // Image Upload Handlers
  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Harap pilih file gambar (JPG, PNG, atau WEBP).');
      return;
    }

    setIsProcessingKtp(true);
    try {
      const compressedBase64 = await compressImageFile(file, 900, 0.75);
      setKtpPhoto(compressedBase64);
      success('Foto KTP berhasil dimuat.');
    } catch (err) {
      console.error(err);
      error('Gagal memproses foto KTP.');
    } finally {
      setIsProcessingKtp(false);
    }
  };

  const handleFaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Harap pilih file gambar wajah.');
      return;
    }

    setIsProcessingFace(true);
    try {
      const compressedBase64 = await compressImageFile(file, 600, 0.75);
      setFacePhoto(compressedBase64);
      success('Foto wajah berhasil dimuat.');
    } catch (err) {
      console.error(err);
      error('Gagal memproses foto wajah.');
    } finally {
      setIsProcessingFace(false);
    }
  };

  const resetForm = () => {
    setName('');
    setNik('');
    setNikKtp('');
    setBirthDate('');
    setPhone('');
    setAddress('');
    setKtpPhoto('');
    setFacePhoto('');
    setDivisionId('');
    setSubcontId('');
    setCompanyName('');
    setEmployeeStatus('Internal');
    setErrors({});
    if (ktpInputRef.current) ktpInputRef.current.value = '';
    if (faceInputRef.current) faceInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Full form validation
    const currentErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      currentErrors.name = 'Nama lengkap wajib diisi.';
    } else if (name.trim().length < 3) {
      currentErrors.name = 'Nama lengkap minimal 3 karakter.';
    }

    if (!nik.trim()) {
      currentErrors.nik = 'NIK Karyawan wajib diisi.';
    } else if (nik.trim().length < 3) {
      currentErrors.nik = 'NIK minimal 3 karakter.';
    }

    if (!nikKtp.trim()) {
      currentErrors.nikKtp = 'NIK KTP (16 digit) wajib diisi.';
    } else if (!/^[0-9]{16}$/.test(nikKtp.trim())) {
      currentErrors.nikKtp = 'NIK KTP harus 16 digit angka.';
    }

    if (!birthDate) {
      currentErrors.birthDate = 'Tanggal lahir wajib diisi.';
    } else {
      const age = calculateAge(birthDate);
      if (age === null || age < 17) {
        currentErrors.birthDate = 'Usia minimal karyawan adalah 17 tahun.';
      } else if (age > 90) {
        currentErrors.birthDate = 'Tanggal lahir tidak valid.';
      }
    }

    if (!phone.trim()) {
      currentErrors.phone = 'Nomor handphone wajib diisi.';
    } else if (!/^[0-9+ -]{8,20}$/.test(phone.trim())) {
      currentErrors.phone = 'Format nomor HP tidak valid.';
    }

    if (!address.trim()) {
      currentErrors.address = 'Alamat rumah wajib diisi.';
    } else if (address.trim().length < 5) {
      currentErrors.address = 'Harap isi alamat rumah dengan lengkap.';
    }

    if (!divisionId) {
      currentErrors.divisionId = 'Pilih salah satu bagian / divisi.';
    }

    if (!subcontId) {
      currentErrors.subcontId = 'Pilih nama subcont atau status internal.';
    }

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      error('Data belum lengkap. Silakan lengkapi semua kolom bertanda (*).');
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate NIK uniqueness
      const isUnique = await dataService.isNikUnique(
        nik.trim(),
        editingEmployee ? editingEmployee.id : undefined
      );

      if (!isUnique) {
        setErrors({
          nik: 'NIK Karyawan sudah terdaftar. NIK harus unik dan belum pernah digunakan.',
        });
        error('NIK sudah terdaftar.');
        setIsSubmitting(false);
        return;
      }

      const selectedDivision = activeDivisions.find((d) => d.id === divisionId);
      const selectedSubcont = activeSubconts.find((s) => s.id === subcontId);
      const finalCompanyName = companyName.trim() || selectedSubcont?.name || 'Internal';

      let savedEmp: Employee;

      if (editingEmployee) {
        // Updating existing employee (re-submission after review or edit)
        await dataService.updateEmployee(editingEmployee.id, {
          name: name.trim(),
          nik: nik.trim().toUpperCase(),
          nikKtp: nikKtp.trim(),
          birthDate: birthDate,
          phone: phone.trim(),
          address: address.trim(),
          ktpPhoto: ktpPhoto || '',
          facePhoto: facePhoto || '',
          divisionId,
          divisionName: selectedDivision?.name || 'Umum',
          subcontId,
          subcontName: selectedSubcont?.name || 'Internal',
          companyName: finalCompanyName,
          employeeStatus,
          verificationStatus: 'Menunggu Verifikasi', // Reset status for Admin re-verification
          verificationNote: '', // Clear previous remark
        });

        savedEmp = {
          ...editingEmployee,
          name: name.trim(),
          nik: nik.trim().toUpperCase(),
          nikKtp: nikKtp.trim(),
          birthDate: birthDate,
          phone: phone.trim(),
          address: address.trim(),
          ktpPhoto: ktpPhoto || '',
          facePhoto: facePhoto || '',
          divisionId,
          divisionName: selectedDivision?.name || 'Umum',
          subcontId,
          subcontName: selectedSubcont?.name || 'Internal',
          companyName: finalCompanyName,
          employeeStatus,
          verificationStatus: 'Menunggu Verifikasi',
          verificationNote: '',
          updatedAt: new Date().toISOString(),
        };

        success('Data berhasil diperbarui dan dikirim kembali untuk verifikasi.');
      } else {
        // Creating new employee submission
        savedEmp = await dataService.createEmployee({
          name: name.trim(),
          nik: nik.trim().toUpperCase(),
          nikKtp: nikKtp.trim(),
          birthDate: birthDate,
          phone: phone.trim(),
          address: address.trim(),
          ktpPhoto: ktpPhoto || '',
          facePhoto: facePhoto || '',
          divisionId,
          divisionName: selectedDivision?.name || 'Umum',
          subcontId,
          subcontName: selectedSubcont?.name || 'Internal',
          companyName: finalCompanyName,
          employeeStatus,
          verificationStatus: 'Menunggu Verifikasi',
          verificationNote: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        success('Data berhasil disimpan.');
      }

      setSubmittedData(savedEmp);
      setIsSuccessModalOpen(true);
      resetForm();

      if (onSuccessSubmit) {
        onSuccessSubmit(savedEmp);
      }
    } catch (err) {
      console.error('Submission error:', err);
      error('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Banner & Lookup shortcut */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 sm:p-5 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base">Pendaftaran Mandiri Karyawan</h2>
            <p className="text-xs text-blue-200">
              Form resmi pendataan tenaga kerja PT DHJ & Mitra Subkontraktor
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCheckStatusModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl transition-colors shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Cek Status / Perbaiki</span>
        </button>
      </div>

      {/* Editing Mode Alert */}
      {editingEmployee && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900">Mode Perbaikan Data Karyawan</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Anda sedang memperbarui data untuk NIK:{' '}
                <span className="font-mono font-bold">{editingEmployee.nik}</span>. Data ini akan dikirim
                ulang ke Admin untuk diverifikasi.
              </p>
              {editingEmployee.verificationNote && (
                <div className="mt-2 text-xs bg-white/80 p-2.5 rounded-lg border border-amber-200 text-amber-900 font-medium">
                  Catatan Admin: "{editingEmployee.verificationNote}"
                </div>
              )}
            </div>
          </div>
          {onCancelEdit && (
            <button
              onClick={onCancelEdit}
              className="text-xs font-medium text-amber-700 hover:text-amber-900 px-2 py-1 rounded-lg hover:bg-amber-100 shrink-0"
            >
              Batal
            </button>
          )}
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-100 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            FORM DATA KARYAWAN
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Silakan isi data dengan benar sesuai identitas KTP Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8" noValidate>
          {/* Section 1: Data Identitas & Foto */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Data Identitas Diri & Dokumen
              </h2>
            </div>

            {/* Foto Wajah Karyawan Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Foto Wajah Karyawan (Pas Foto / Selfie)
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {facePhoto ? (
                    <img
                      src={facePhoto}
                      alt="Foto Wajah"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                  {isProcessingFace && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-[10px] font-bold">
                      Memuat...
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => faceInputRef.current?.click()}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>{facePhoto ? 'Ganti Foto' : 'Ambil / Unggah Foto'}</span>
                    </button>

                    {facePhoto && (
                      <button
                        type="button"
                        onClick={() => {
                          setFacePhoto('');
                          if (faceInputRef.current) faceInputRef.current.value = '';
                        }}
                        className="px-2.5 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Foto wajah tampak depan yang jelas (Kamera HP atau galeri).
                  </p>
                </div>
              </div>
              <input
                ref={faceInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFaceUpload}
              />
            </div>

            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-xs font-bold text-slate-700">
                Nama Lengkap (sesuai KTP) <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  validateField('name', e.target.value);
                }}
                placeholder="Contoh: Andi Saputra"
                className={`w-full px-4 py-3 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all ${
                  errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                }`}
              />
              {errors.name ? (
                <p className="text-xs font-medium text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.name}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">Minimal 3 karakter sesuai KTP.</p>
              )}
            </div>

            {/* Grid 2 Kolom: NIK Karyawan & NIK KTP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NIK Karyawan */}
              <div className="space-y-1.5">
                <label htmlFor="nik" className="block text-xs font-bold text-slate-700">
                  NIK Karyawan <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    id="nik"
                    type="text"
                    value={nik}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setNik(val);
                      validateField('nik', val);
                    }}
                    onBlur={handleNikBlur}
                    placeholder="Contoh: EMP001"
                    className={`w-full px-4 py-3 text-sm font-mono tracking-wider bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden uppercase transition-all ${
                      errors.nik ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {isCheckingNik && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-medium">
                      Memeriksa...
                    </span>
                  )}
                </div>
                {errors.nik ? (
                  <p className="text-xs font-medium text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.nik}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">ID tenaga kerja (harus unik).</p>
                )}
              </div>

              {/* NIK KTP */}
              <div className="space-y-1.5">
                <label htmlFor="nikKtp" className="block text-xs font-bold text-slate-700">
                  NIK KTP (16 Digit) <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="nikKtp"
                    type="text"
                    maxLength={16}
                    value={nikKtp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setNikKtp(val);
                      validateField('nikKtp', val);
                    }}
                    placeholder="3216012345670001"
                    className={`w-full pl-10 pr-4 py-3 text-sm font-mono tracking-wider bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all ${
                      errors.nikKtp ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.nikKtp ? (
                  <p className="text-xs font-medium text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.nikKtp}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">16 digit nomor induk kependudukan.</p>
                )}
              </div>
            </div>

            {/* Grid 2 Kolom: Tanggal Lahir & Nomer Handphone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tanggal Lahir */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="birthDate" className="block text-xs font-bold text-slate-700">
                    Tanggal Lahir <span className="text-rose-500 font-bold">*</span>
                  </label>
                  {birthDate && calculateAge(birthDate) !== null && (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      Usia: {calculateAge(birthDate)} tahun
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="birthDate"
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      validateField('birthDate', e.target.value);
                    }}
                    className={`w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all ${
                      errors.birthDate ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.birthDate ? (
                  <p className="text-xs font-medium text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.birthDate}
                  </p>
                ) : isApproaching55(birthDate) ? (
                  <div className="flex items-center gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] font-semibold mt-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Perhatian: Karyawan mendekati usia batas pensiun 55 tahun.</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">Sesuai tanggal lahir di KTP Anda.</p>
                )}
              </div>

              {/* Nomer Handphone */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-xs font-bold text-slate-700">
                  Nomor Handphone / WhatsApp <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      validateField('phone', e.target.value);
                    }}
                    placeholder="Contoh: 081234567890"
                    className={`w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all ${
                      errors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.phone ? (
                  <p className="text-xs font-medium text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.phone}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Nomor aktif untuk keperluan konfirmasi & administrasi.
                  </p>
                )}
              </div>
            </div>

            {/* Foto KTP Upload */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700">
                Foto Dokumen KTP (Kartu Tanda Penduduk)
              </label>
              {ktpPhoto ? (
                <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2">
                  <img
                    src={ktpPhoto}
                    alt="Foto KTP"
                    className="w-full max-h-56 object-contain rounded-xl bg-white"
                  />
                  <div className="mt-2 flex items-center justify-between px-2 pb-1">
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Foto KTP siap dikirim
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setKtpPhoto('');
                        if (ktpInputRef.current) ktpInputRef.current.value = '';
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => ktpInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/70 hover:bg-blue-50/30 transition-colors"
                >
                  <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">
                    {isProcessingKtp ? 'Sedang memproses gambar...' : 'Klik untuk Unggah atau Foto KTP'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pastikan NIK KTP dan tulisan terbaca dengan jelas
                  </p>
                </div>
              )}
              <input
                ref={ktpInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleKtpUpload}
              />
            </div>

            {/* Alamat Rumah */}
            <div className="space-y-1.5">
              <label htmlFor="address" className="block text-xs font-bold text-slate-700">
                Alamat Rumah Tinggal <span className="text-rose-500 font-bold">*</span>
              </label>
              <textarea
                id="address"
                rows={3}
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  validateField('address', e.target.value);
                }}
                placeholder="Masukkan alamat lengkap (Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten)..."
                className={`w-full px-4 py-3 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all ${
                  errors.address ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                }`}
              />
              {errors.address ? (
                <p className="text-xs font-medium text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.address}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Mendukung penulisan alamat panjang dan domisili saat ini.
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Data Pekerjaan */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Data Pekerjaan & Penugasan
              </h2>
            </div>

            {/* Bagian / Divisi */}
            <div className="space-y-1.5">
              <label htmlFor="divisionId" className="block text-xs font-bold text-slate-700">
                Bagian / Divisi <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                id="divisionId"
                value={divisionId}
                onChange={(e) => {
                  setDivisionId(e.target.value);
                  validateField('divisionId', e.target.value);
                }}
                className={`w-full px-4 py-3 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all ${
                  errors.divisionId ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                }`}
              >
                <option value="">-- Pilih Bagian / Divisi --</option>
                {activeDivisions.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.name}
                  </option>
                ))}
              </select>
              {errors.divisionId && (
                <p className="text-xs font-medium text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.divisionId}
                </p>
              )}
            </div>

            {/* Nama Subcont / Kategori */}
            <div className="space-y-1.5">
              <label htmlFor="subcontId" className="block text-xs font-bold text-slate-700">
                Kategori Subcont / Asal Tenaga Kerja <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                id="subcontId"
                value={subcontId}
                onChange={(e) => {
                  setSubcontId(e.target.value);
                  validateField('subcontId', e.target.value);
                  const found = activeSubconts.find((s) => s.id === e.target.value);
                  if (found && found.name.toLowerCase() === 'internal') {
                    setEmployeeStatus('Internal');
                    if (!companyName) setCompanyName('Internal Perusahaan');
                  } else if (found) {
                    setEmployeeStatus('Subcont');
                    if (!companyName || companyName === 'Internal Perusahaan') {
                      setCompanyName(found.name);
                    }
                  }
                }}
                className={`w-full px-4 py-3 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all ${
                  errors.subcontId ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                }`}
              >
                <option value="">-- Pilih Kategori Subcont atau Internal --</option>
                {activeSubconts.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              {errors.subcontId && (
                <p className="text-xs font-medium text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.subcontId}
                </p>
              )}
            </div>

            {/* Nama Perusahaan / Subcont Lengkap */}
            <div className="space-y-1.5">
              <label htmlFor="companyName" className="block text-xs font-bold text-slate-700">
                Nama Perusahaan / Subkontraktor (PT / CV / Vendor)
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Contoh: PT Subcont Konstruksi Prima / CV Mitra Jaya"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Nama badan usaha / perusahaan tempat Anda bernaung (atau isi Internal jika karyawan internal).
              </p>
            </div>

            {/* Status Karyawan */}
            <div className="space-y-1.5">
              <label htmlFor="employeeStatus" className="block text-xs font-bold text-slate-700">
                Status Hubungan Kerja
              </label>
              <select
                id="employeeStatus"
                value={employeeStatus}
                onChange={(e) => setEmployeeStatus(e.target.value as EmployeeStatus)}
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
              >
                <option value="Internal">Internal</option>
                <option value="Subcont">Subcont</option>
                <option value="Outsourcing">Outsourcing</option>
                <option value="Kontrak">Kontrak</option>
                <option value="Tetap">Tetap</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* Information note */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5 text-xs text-blue-800">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                Status berkas Anda akan otomatis disetel ke{' '}
                <span className="font-bold">"Menunggu Verifikasi"</span> setelah tombol kirim ditekan.
              </p>
            </div>
          </div>

          {/* Buttons: Submit & Reset */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isCheckingNik}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Data Berhasil Dikirim"
        maxWidth="sm"
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-in zoom-in-50 duration-300">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <h4 className="text-base font-bold text-slate-900">Pendaftaran Berhasil!</h4>
            <p className="text-xs text-slate-600 leading-relaxed px-2">
              Terima kasih. Data Anda telah berhasil diterima dan akan diverifikasi oleh Admin.
            </p>
          </div>

          {submittedData && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama:</span>
                <span className="font-bold text-slate-800">{submittedData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NIK Karyawan:</span>
                <span className="font-mono font-bold text-blue-600">{submittedData.nik}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NIK KTP:</span>
                <span className="font-mono font-semibold text-slate-800">{submittedData.nikKtp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Lahir / Usia:</span>
                <span className="font-medium text-slate-800">
                  {submittedData.birthDate
                    ? `${new Date(submittedData.birthDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })} (${calculateAge(submittedData.birthDate)} th)`
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor HP:</span>
                <span className="font-semibold text-slate-800">{submittedData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Divisi / Subcont:</span>
                <span className="font-medium text-slate-800">
                  {submittedData.divisionName} / {submittedData.companyName || submittedData.subcontName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Data:</span>
                <span className="font-semibold text-amber-600">Menunggu Verifikasi</span>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSuccessModalOpen(false);
                setIsCheckStatusModalOpen(true);
              }}
              className="w-full py-2 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cek Status Pengajuan NIK
            </button>
          </div>
        </div>
      </Modal>

      {/* Check Status Modal */}
      <EmployeeCheckStatusModal
        isOpen={isCheckStatusModalOpen}
        onClose={() => setIsCheckStatusModalOpen(false)}
        onSelectForEdit={(emp) => {
          setName(emp.name);
          setNik(emp.nik);
          setNikKtp(emp.nikKtp || '');
          setBirthDate(emp.birthDate || '');
          setPhone(emp.phone || '');
          setAddress(emp.address);
          setKtpPhoto(emp.ktpPhoto || '');
          setFacePhoto(emp.facePhoto || '');
          setDivisionId(emp.divisionId);
          setSubcontId(emp.subcontId);
          setCompanyName(emp.companyName || '');
          setEmployeeStatus(emp.employeeStatus);
          setIsCheckStatusModalOpen(false);
        }}
      />
    </div>
  );
};
