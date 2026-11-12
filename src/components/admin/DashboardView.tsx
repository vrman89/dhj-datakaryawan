import React from 'react';
import {
  Users,
  Building,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  FileSpreadsheet,
} from 'lucide-react';
import { Division, Employee, Subcont, ActiveTab } from '../../types';
import { StatCard } from '../common/StatCard';
import { Charts } from '../common/Charts';
import { StatusBadge } from '../common/StatusBadge';
import { calculateAge, isApproaching55 } from '../../utils/ageUtils';

interface DashboardViewProps {
  employees: Employee[];
  divisions: Division[];
  subconts: Subcont[];
  onSelectTab: (tab: ActiveTab) => void;
  onSelectEmployeeDetail: (employee: Employee) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  divisions,
  subconts,
  onSelectTab,
  onSelectEmployeeDetail,
}) => {
  const totalEmployees = employees.length;
  const totalInternal = employees.filter(
    (e) => e.subcontName?.toLowerCase() === 'internal' || e.employeeStatus === 'Internal'
  ).length;
  const totalSubcont = totalEmployees - totalInternal;
  const pendingVerification = employees.filter((e) => e.verificationStatus === 'Menunggu Verifikasi');
  const needsCorrection = employees.filter((e) => e.verificationStatus === 'Perlu Perbaikan');

  // Filter employees approaching age 55 (54+ years)
  const retiringEmployees = employees.filter((e) => isApproaching55(e.birthDate));

  // Recent 5 submissions
  const recentEmployees = [...employees]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>Sistem Operasional Aktif</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            EMPLOYEE DATA MANAGEMENT
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Sistem terpadu pendataan tenaga kerja internal dan subkontraktor PT DHJ. Pantau status berkas, verifikasi tenaga kerja, dan ekspor laporan real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onSelectTab('verification')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>Verifikasi ({pendingVerification.length})</span>
          </button>
          <button
            onClick={() => onSelectTab('employees')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Kelola Karyawan</span>
          </button>
        </div>
      </div>

      {/* 5 Statistic Cards per prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="TOTAL KARYAWAN"
          value={totalEmployees}
          subtitle="Semua data terdaftar"
          icon={Users}
          variant="blue"
          badgeText="Internal & Subcont"
          onClick={() => onSelectTab('employees')}
        />
        <StatCard
          title="TOTAL INTERNAL"
          value={totalInternal}
          subtitle="Tenaga kerja internal"
          icon={Building}
          variant="indigo"
          badgeText={`${totalEmployees > 0 ? Math.round((totalInternal / totalEmployees) * 100) : 0}% dari total`}
          onClick={() => onSelectTab('employees')}
        />
        <StatCard
          title="TOTAL SUBCONT"
          value={totalSubcont}
          subtitle="Mitra vendor & subcont"
          icon={Layers}
          variant="blue"
          badgeText={`${totalEmployees > 0 ? Math.round((totalSubcont / totalEmployees) * 100) : 0}% dari total`}
          onClick={() => onSelectTab('employees')}
        />
        <StatCard
          title="MENUNGGU VERIFIKASI"
          value={pendingVerification.length}
          subtitle="Perlu pengecekan berkas"
          icon={Clock}
          variant="amber"
          badgeText="Prioritas Verifikasi"
          onClick={() => onSelectTab('verification')}
        />
        <StatCard
          title="PERLU PERBAIKAN"
          value={needsCorrection.length}
          subtitle="Menunggu revisi karyawan"
          icon={AlertTriangle}
          variant="rose"
          badgeText="Memerlukan revisi"
          onClick={() => onSelectTab('verification')}
        />
      </div>

      {/* Peringatan Karyawan Mendekati Usia 55 Tahun (Pemberitahuan Admin) */}
      {retiringEmployees.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-amber-950">
                    Pemberitahuan: {retiringEmployees.length} Karyawan Mendekati Usia Pensiun (55 Tahun)
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 rounded-full">
                    Penting
                  </span>
                </div>
                <p className="text-xs text-amber-800/90 mt-0.5">
                  Sistem mendeteksi tenaga kerja berikut telah berusia 54 tahun atau lebih berdasarkan tanggal lahir KTP.
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('employees')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300/80 rounded-xl transition-colors shrink-0"
            >
              <span>Lihat di Data Karyawan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
            {retiringEmployees.map((emp) => {
              const age = calculateAge(emp.birthDate);
              return (
                <div
                  key={emp.id}
                  onClick={() => onSelectEmployeeDetail(emp)}
                  className="bg-white p-3.5 rounded-2xl border border-amber-200 hover:border-amber-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden border border-amber-200">
                      {emp.facePhoto ? (
                        <img src={emp.facePhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        emp.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-700 transition-colors">
                        {emp.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        NIK: {emp.nik} • {emp.divisionName}
                      </p>
                      <p className="text-[10px] text-amber-700 font-medium truncate">
                        {emp.companyName || emp.subcontName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-extrabold font-mono">
                      {age !== null ? `${age} th` : '54+ th'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {emp.birthDate ? new Date(emp.birthDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' }) : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3 Visual Charts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Statistik & Analisis Karyawan</h3>
          <span className="text-xs text-slate-500">Pembaruan realtime</span>
        </div>
        <Charts employees={employees} divisions={divisions} subconts={subconts} />
      </div>

      {/* Recent Submissions Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              Pengisian Data Terbaru
            </h4>
            <p className="text-xs text-slate-500">Karyawan yang baru mendaftar atau mengirim data</p>
          </div>
          <button
            onClick={() => onSelectTab('employees')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentEmployees.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Belum ada data karyawan.</div>
          ) : (
            recentEmployees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => onSelectEmployeeDetail(emp)}
                className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                    {emp.facePhoto ? (
                      <img src={emp.facePhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      emp.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {emp.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      NIK: {emp.nik} {emp.phone ? `• ${emp.phone}` : ''} • {emp.divisionName} • {emp.subcontName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={emp.verificationStatus} size="sm" />
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {new Date(emp.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
