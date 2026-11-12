import React from 'react';
import { Employee, Division, Subcont } from '../../types';

interface ChartsProps {
  employees: Employee[];
  divisions: Division[];
  subconts: Subcont[];
}

export const Charts: React.FC<ChartsProps> = ({ employees, divisions, subconts }) => {
  const total = employees.length;

  // 1. Group by Division
  const divisionCounts: { [key: string]: number } = {};
  employees.forEach((emp) => {
    const key = emp.divisionName || 'Tidak Diketahui';
    divisionCounts[key] = (divisionCounts[key] || 0) + 1;
  });

  // Sort by count descending
  const sortedDivisions = Object.entries(divisionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8); // Top 8 for clean layout

  // 2. Group by Subcont
  const subcontCounts: { [key: string]: number } = {};
  employees.forEach((emp) => {
    const key = emp.subcontName || 'Tidak Diketahui';
    subcontCounts[key] = (subcontCounts[key] || 0) + 1;
  });
  const sortedSubconts = Object.entries(subcontCounts).sort((a, b) => b[1] - a[1]);

  // 3. Status Data Distribution
  const verifiedCount = employees.filter((e) => e.verificationStatus === 'Terverifikasi').length;
  const pendingCount = employees.filter((e) => e.verificationStatus === 'Menunggu Verifikasi').length;
  const reviewCount = employees.filter((e) => e.verificationStatus === 'Perlu Perbaikan').length;
  const inactiveCount = employees.filter((e) => e.verificationStatus === 'Tidak Aktif').length;

  const verifiedPercent = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;
  const pendingPercent = total > 0 ? Math.round((pendingCount / total) * 100) : 0;
  const reviewPercent = total > 0 ? Math.round((reviewCount / total) * 100) : 0;
  const inactivePercent = total > 0 ? Math.round((inactiveCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart 1: Jumlah Karyawan Berdasarkan Divisi */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Distribusi Divisi</h4>
              <p className="text-xs text-slate-500">Jumlah karyawan per bagian / divisi</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
              {Object.keys(divisionCounts).length} Divisi Aktif
            </span>
          </div>

          <div className="space-y-3.5 mt-2">
            {sortedDivisions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada data divisi</p>
            ) : (
              sortedDivisions.map(([name, count]) => {
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[180px]">{name}</span>
                      <span className="text-slate-500 font-semibold">
                        {count} <span className="font-normal text-slate-400">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Chart 2: Jumlah Karyawan Berdasarkan Subcont */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Distribusi Subcont / Vendor</h4>
              <p className="text-xs text-slate-500">Komparasi internal vs kontraktor</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              {sortedSubconts.length} Entitas
            </span>
          </div>

          <div className="space-y-3 mt-2">
            {sortedSubconts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada data subcont</p>
            ) : (
              sortedSubconts.map(([name, count], index) => {
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                const colors = [
                  'bg-indigo-600',
                  'bg-blue-600',
                  'bg-teal-600',
                  'bg-violet-600',
                  'bg-sky-600',
                ];
                const colorClass = colors[index % colors.length];

                return (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{name}</span>
                      <span className="text-slate-500 font-semibold">
                        {count} orang ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Chart 3: Status Data Karyawan */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Status Validasi Data</h4>
              <p className="text-xs text-slate-500">Progress verifikasi berkas karyawan</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
              {verifiedPercent}% Lolos
            </span>
          </div>

          {/* Multi-segment progress bar */}
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex my-3 p-0.5">
            <div
              style={{ width: `${verifiedPercent}%` }}
              className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
              title={`Terverifikasi: ${verifiedCount}`}
            />
            <div
              style={{ width: `${pendingPercent}%` }}
              className="h-full bg-amber-400 transition-all duration-500"
              title={`Menunggu: ${pendingCount}`}
            />
            <div
              style={{ width: `${reviewPercent}%` }}
              className="h-full bg-rose-500 transition-all duration-500"
              title={`Perlu Perbaikan: ${reviewCount}`}
            />
            <div
              style={{ width: `${inactivePercent}%` }}
              className="h-full bg-slate-400 rounded-r-full transition-all duration-500"
              title={`Tidak Aktif: ${inactiveCount}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
              <span className="text-[11px] font-medium text-emerald-800">Terverifikasi</span>
              <p className="text-lg font-bold text-emerald-900 mt-0.5">{verifiedCount}</p>
            </div>
            <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
              <span className="text-[11px] font-medium text-amber-800">Menunggu</span>
              <p className="text-lg font-bold text-amber-900 mt-0.5">{pendingCount}</p>
            </div>
            <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl">
              <span className="text-[11px] font-medium text-rose-800">Perlu Perbaikan</span>
              <p className="text-lg font-bold text-rose-900 mt-0.5">{reviewCount}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] font-medium text-slate-700">Tidak Aktif</span>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{inactiveCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
