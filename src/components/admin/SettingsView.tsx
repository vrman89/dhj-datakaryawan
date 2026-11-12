import React, { useState } from 'react';
import {
  Settings,
  Database,
  Shield,
  RotateCcw,
  BookOpen,
  Terminal,
  CloudUpload,
  CheckCircle2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import firebaseConfig from '../../../firebase-applet-config.json';

export const SettingsView: React.FC = () => {
  const { success, error } = useToast();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await dataService.resetToSeedData();
      success('Data berhasil di-reset ke sample bawaan (EMP001, EMP002, EMP003, dsb).');
      setIsResetConfirmOpen(false);
    } catch (e) {
      error('Gagal me-reset data sample.');
    } finally {
      setIsResetting(false);
    }
  };

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    success('Perintah berhasil disalin ke clipboard.');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Pengaturan & Dokumentasi Sistem
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Informasi infrastruktur Firebase, panduan instalasi, dan pemeliharaan data
        </p>
      </div>

      {/* Grid: Firebase Info & Reset Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Firebase Environment Status */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Status Database Firebase</h3>
              <p className="text-[11px] text-slate-400">Google Cloud Firestore & Authentication</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Project ID:</span>
              <span className="font-bold text-blue-700">{firebaseConfig.projectId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Database ID:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                {firebaseConfig.firestoreDatabaseId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Auth Domain:</span>
              <span className="text-slate-700">{firebaseConfig.authDomain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Security Rules:</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Deployed & Active
              </span>
            </div>
          </div>
        </div>

        {/* Data Maintenance & Reset */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Muat Ulang Data Sample</h3>
                <p className="text-[11px] text-slate-400">Seed data bawaan (Andi, Budi, Rizky, dll)</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              Tombol ini akan memperbarui dan mengembalikan data sample resmi ke Firestore dan cache lokal,
              termasuk data karyawan EMP001 (Andi Saputra), EMP002 (Budi Santoso), EMP003 (Rizky Pratama),
              serta 12 Divisi dan 4 Subcont.
            </p>
          </div>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            disabled={isResetting}
            className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>{isResetting ? 'Me-reset Data...' : 'Reset ke Sample Seed Data'}</span>
          </button>
        </div>
      </div>

      {/* Panduan Instalasi & Deploy Lengkap */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Panduan Menjalankan & Deploy ke Firebase Hosting
            </h3>
            <p className="text-xs text-slate-500">
              Instruksi teknis langkah demi langkah untuk pengembang
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Section 1: Menjalankan di Lokal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-600" />
                <span>1. Panduan Menjalankan Project di Komputer Lokal</span>
              </h4>
              <button
                onClick={() =>
                  copyToClipboard(
                    `# 1. Clone & install dependencies\nnpm install\n\n# 2. Jalankan mode development\nnpm run dev\n\n# 3. Buka di browser http://localhost:3000`,
                    'local'
                  )
                }
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSection === 'local' ? 'Tersalin!' : 'Salin Perintah'}</span>
              </button>
            </div>
            <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
{`# 1. Clone repository & install dependencies
npm install

# 2. Jalankan server lokal
npm run dev

# 3. Buka aplikasi di http://localhost:3000`}
            </pre>
          </div>

          {/* Section 2: Panduan Deploy ke Firebase Hosting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-emerald-600" />
                <span>2. Panduan Deploy ke Firebase Hosting & Firestore Rules</span>
              </h4>
              <button
                onClick={() =>
                  copyToClipboard(
                    `# 1. Install Firebase CLI jika belum ada\nnpm install -g firebase-tools\n\n# 2. Login ke Google Firebase\nfirebase login\n\n# 3. Build aplikasi frontend untuk produksi\nnpm run build\n\n# 4. Deploy website & security rules ke Firebase\nfirebase deploy --only hosting,firestore:rules`,
                    'deploy'
                  )
                }
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSection === 'deploy' ? 'Tersalin!' : 'Salin Perintah'}</span>
              </button>
            </div>
            <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
{`# 1. Install Firebase CLI global
npm install -g firebase-tools

# 2. Login dengan akun Google Anda
firebase login

# 3. Inisialisasi hosting jika diperlukan
firebase init hosting
# Pilihlah: 'dist' sebagai public directory, dan 'Yes' untuk single-page app rewrite

# 4. Build aplikasi produksi
npm run build

# 5. Deploy langsung ke Firebase Hosting dan Firestore Security Rules
firebase deploy --only hosting,firestore:rules`}
            </pre>
          </div>

          {/* Section 3: Ringkasan Fitur Produksi */}
          <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
            <h5 className="font-bold text-blue-900 text-xs">Keunggulan Arsitektur DHJ Employee Data:</h5>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>
                <strong className="text-slate-900">Validasi NIK Unik:</strong> Dilakukan secara realtime di sisi klien dan dicek langsung terhadap database Firestore.
              </li>
              <li>
                <strong className="text-slate-900">Dukungan Form Mobile:</strong> Form pendaftaran dioptimalkan untuk layar ponsel Android dengan input besar dan responsif.
              </li>
              <li>
                <strong className="text-slate-900">Format Export Excel Resmi:</strong> Menghasilkan file .xlsx asli yang dapat langsung diolah tim payroll dan HR.
              </li>
              <li>
                <strong className="text-slate-900">Workflow Verifikasi Berkas:</strong> Alur approval dan permintaan perbaikan data dengan catatan revisi interaktif.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Reset */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="Reset Data ke Sample?"
        message="Tindakan ini akan mengembalikan data karyawan, divisi, dan subcont ke data awal bawaan sistem. Lanjutkan?"
        confirmText="Reset Data"
        isLoading={isResetting}
        isDangerous
      />
    </div>
  );
};
