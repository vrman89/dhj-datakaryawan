/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ActiveTab, AdminAccount, Division, Employee, Subcont } from './types';
import { dataService } from './services/dataService';
import { testConnection } from './config/firebase';
import { isApproaching55 } from './utils/ageUtils';

// Common components
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ConfirmDialog } from './components/common/ConfirmDialog';

// Employee components
import { EmployeeForm } from './components/employee/EmployeeForm';

// Admin components
import { AdminLoginView } from './components/admin/AdminLoginView';
import { DashboardView } from './components/admin/DashboardView';
import { EmployeeListView } from './components/admin/EmployeeListView';
import { EmployeeDetailModal } from './components/admin/EmployeeDetailModal';
import { EmployeeEditModal } from './components/admin/EmployeeEditModal';
import { VerificationQueueView } from './components/admin/VerificationQueueView';
import { DivisionManagementView } from './components/admin/DivisionManagementView';
import { SubcontManagementView } from './components/admin/SubcontManagementView';
import { ReportsView } from './components/admin/ReportsView';
import { UserManagementView } from './components/admin/UserManagementView';
import { SettingsView } from './components/admin/SettingsView';

const MainApp: React.FC = () => {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();

  // Mode switcher: 'employee' for self-service form, 'admin' for management dashboard
  const [currentMode, setCurrentMode] = useState<'admin' | 'employee'>('employee');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Realtime datasets
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [subconts, setSubconts] = useState<Subcont[]>([]);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);

  // Modal states
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<Employee | null>(null);
  const [selectedEmployeeEdit, setSelectedEmployeeEdit] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [editingEmployeeForForm, setEditingEmployeeForForm] = useState<Employee | null>(null);

  // Initialize and subscribe to realtime Firestore data
  useEffect(() => {
    testConnection();
    dataService.initializeData();

    const unsubEmp = dataService.subscribeEmployees((data) => setEmployees(data));
    const unsubDiv = dataService.subscribeDivisions((data) => setDivisions(data));
    const unsubSub = dataService.subscribeSubconts((data) => setSubconts(data));
    const unsubAdmin = dataService.subscribeAdminAccounts((data) => setAdminAccounts(data));

    return () => {
      unsubEmp();
      unsubDiv();
      unsubSub();
      unsubAdmin();
    };
  }, []);

  // Verification actions
  const handleVerify = async (emp: Employee) => {
    try {
      await dataService.updateEmployee(emp.id, {
        verificationStatus: 'Terverifikasi',
        verificationNote: 'Data terverifikasi oleh Admin.',
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'Admin DHJ',
      });
      success(`Data ${emp.name} (${emp.nik}) berhasil diverifikasi.`);
      if (selectedEmployeeDetail?.id === emp.id) {
        setSelectedEmployeeDetail(null);
      }
    } catch (err) {
      error('Gagal memverifikasi data.');
    }
  };

  const handleRequestCorrection = async (emp: Employee, note: string) => {
    try {
      await dataService.updateEmployee(emp.id, {
        verificationStatus: 'Perlu Perbaikan',
        verificationNote: note,
      });
      success(`Permintaan perbaikan dikirim ke ${emp.name}.`);
      if (selectedEmployeeDetail?.id === emp.id) {
        setSelectedEmployeeDetail(null);
      }
    } catch (err) {
      error('Gagal mengirim permintaan perbaikan.');
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return;
    try {
      await dataService.deleteEmployee(deletingEmployee.id);
      success(`Data ${deletingEmployee.name} berhasil dihapus.`);
      setDeletingEmployee(null);
      if (selectedEmployeeDetail?.id === deletingEmployee.id) {
        setSelectedEmployeeDetail(null);
      }
    } catch (err) {
      error('Gagal menghapus data karyawan.');
    }
  };

  // Count pending verifications & approaching retirement (54+ years)
  const pendingCount = employees.filter((e) => e.verificationStatus === 'Menunggu Verifikasi').length;
  const retiringCount = employees.filter((e) => isApproaching55(e.birthDate)).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentMode={currentMode}
        onSwitchMode={(mode) => {
          setCurrentMode(mode);
          setEditingEmployeeForForm(null);
        }}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Content Body */}
      {currentMode === 'employee' ? (
        /* KARYAWAN VIEW: Clean self-service Form optimized for mobile & desktop */
        <main className="flex-1">
          <EmployeeForm
            divisions={divisions}
            subconts={subconts}
            editingEmployee={editingEmployeeForForm}
            onCancelEdit={() => setEditingEmployeeForForm(null)}
            onSuccessSubmit={() => setEditingEmployeeForForm(null)}
          />
        </main>
      ) : !isAdmin ? (
        /* ADMIN LOGIN VIEW: When non-authenticated user clicks Admin tab */
        <main className="flex-1">
          <AdminLoginView />
        </main>
      ) : (
        /* ADMIN DASHBOARD VIEW: Full enterprise administration system */
        <div className="flex-1 flex">
          {/* Responsive Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            pendingVerificationCount={pendingCount}
            retiringCount={retiringCount}
          />

          {/* Main Admin Content Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
            {activeTab === 'dashboard' && (
              <DashboardView
                employees={employees}
                divisions={divisions}
                subconts={subconts}
                onSelectTab={(tab) => setActiveTab(tab)}
                onSelectEmployeeDetail={(emp) => setSelectedEmployeeDetail(emp)}
              />
            )}

            {activeTab === 'employees' && (
              <EmployeeListView
                employees={employees}
                divisions={divisions}
                subconts={subconts}
                onViewDetail={(emp) => setSelectedEmployeeDetail(emp)}
                onEdit={(emp) => setSelectedEmployeeEdit(emp)}
                onVerify={handleVerify}
                onRequestCorrection={(emp) => handleRequestCorrection(emp, 'Harap periksa kembali kelengkapan data.')}
                onDelete={(emp) => setDeletingEmployee(emp)}
                onAddNew={() => {
                  setEditingEmployeeForForm(null);
                  setCurrentMode('employee');
                }}
              />
            )}

            {activeTab === 'verification' && (
              <VerificationQueueView
                employees={employees}
                onVerify={handleVerify}
                onRequestCorrection={handleRequestCorrection}
                onViewDetail={(emp) => setSelectedEmployeeDetail(emp)}
              />
            )}

            {activeTab === 'subconts' && (
              <SubcontManagementView subconts={subconts} employees={employees} />
            )}

            {activeTab === 'divisions' && (
              <DivisionManagementView divisions={divisions} employees={employees} />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                employees={employees}
                divisions={divisions}
                subconts={subconts}
              />
            )}

            {activeTab === 'users' && (
              <UserManagementView adminAccounts={adminAccounts} />
            )}

            {activeTab === 'settings' && <SettingsView />}
          </main>
        </div>
      )}

      {/* Global Modals for Admin */}
      <EmployeeDetailModal
        employee={selectedEmployeeDetail}
        isOpen={!!selectedEmployeeDetail}
        onClose={() => setSelectedEmployeeDetail(null)}
        onEdit={(emp) => {
          setSelectedEmployeeDetail(null);
          setSelectedEmployeeEdit(emp);
        }}
        onVerify={handleVerify}
        onRequestCorrection={handleRequestCorrection}
        onDelete={(emp) => {
          setSelectedEmployeeDetail(null);
          setDeletingEmployee(emp);
        }}
      />

      <EmployeeEditModal
        isOpen={!!selectedEmployeeEdit}
        onClose={() => setSelectedEmployeeEdit(null)}
        employee={selectedEmployeeEdit}
        divisions={divisions}
        subconts={subconts}
        onSaved={() => setSelectedEmployeeEdit(null)}
      />

      <ConfirmDialog
        isOpen={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        onConfirm={handleDeleteEmployee}
        title="Hapus Data Karyawan?"
        message={`Apakah Anda yakin ingin menghapus data karyawan ${deletingEmployee?.name} (NIK: ${deletingEmployee?.nik}) dari database?`}
        confirmText="Hapus Permanen"
        isDangerous
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          &copy; {new Date().getFullYear()}{' '}
          <strong className="text-slate-800">PT DHJ</strong> &bull; EMPLOYEE DATA MANAGEMENT
          SYSTEM &bull; Versi Produksi 1.0
        </p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}
