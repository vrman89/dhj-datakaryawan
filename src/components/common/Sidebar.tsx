import React from 'react';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Building,
  Layers,
  FileSpreadsheet,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingVerificationCount: number;
  retiringCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  pendingVerificationCount,
  retiringCount = 0,
}) => {
  const { logout, currentUser } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'employees' as ActiveTab,
      label: 'Data Karyawan',
      icon: Users,
      badge: retiringCount > 0 ? `${retiringCount} Usia 54+` : null,
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
    },
    {
      id: 'verification' as ActiveTab,
      label: 'Verifikasi Data',
      icon: CheckSquare,
      badge: pendingVerificationCount > 0 ? pendingVerificationCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'subconts' as ActiveTab,
      label: 'Data Subcont',
      icon: Layers,
      badge: null,
    },
    {
      id: 'divisions' as ActiveTab,
      label: 'Data Divisi',
      icon: Building,
      badge: null,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Laporan & Export',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Pengaturan',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-1 overflow-y-auto">
          {/* Mobile close button */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 lg:hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Navigasi Admin
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs border border-blue-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold shadow-2xs ${
                      item.badgeColor || 'bg-blue-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer profile & logout */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <p className="text-xs font-bold text-slate-800 truncate">
              {currentUser?.name || 'Administrator'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {currentUser?.email || 'admin@dhj.co.id'}
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>
    </>
  );
};
