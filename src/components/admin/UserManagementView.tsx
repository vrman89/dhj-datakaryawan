import React, { useState } from 'react';
import {
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  User,
  Users,
  Power,
  X,
  AlertCircle,
} from 'lucide-react';
import { ActiveStatus, AdminAccount, AdminRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dataService } from '../../services/dataService';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface UserManagementViewProps {
  adminAccounts: AdminAccount[];
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  adminAccounts,
}) => {
  const { isSuperAdmin, unlockSuperAdmin, lockSuperAdmin, currentUser } = useAuth();
  const { success, error: showToastError } = useToast();

  // Super Admin gate states
  const [gateUsername, setGateUsername] = useState('');
  const [gatePassword, setGatePassword] = useState('');
  const [showGatePassword, setShowGatePassword] = useState(false);
  const [gateError, setGateError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Table password visibility map
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Add/Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formRole, setFormRole] = useState<AdminRole>('ADMIN');
  const [formStatus, setFormStatus] = useState<ActiveStatus>('Aktif');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deletingAccount, setDeletingAccount] = useState<AdminAccount | null>(null);

  const activeSuperAdminCount = adminAccounts.filter(
    (a) => a.role === 'SUPER_ADMIN' && a.status === 'Aktif'
  ).length;

  const handleUnlockSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError('');

    if (!gateUsername.trim() || !gatePassword) {
      const msg = 'Harap masukkan username dan password Super Admin.';
      setGateError(msg);
      showToastError(msg);
      return;
    }

    setIsUnlocking(true);
    try {
      const res = await unlockSuperAdmin(gateUsername, gatePassword);
      if (!res.success) {
        const msg = res.errorMessage || 'Username atau password Super Admin salah.';
        setGateError(msg);
        showToastError(msg);
        return;
      }
      setGateUsername('');
      setGatePassword('');
      success('Akses Super Admin berhasil dibuka!');
    } finally {
      setIsUnlocking(false);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const openAddModal = () => {
    setEditingAccount(null);
    setFormDisplayName('');
    setFormUsername('');
    setFormPassword('');
    setShowFormPassword(false);
    setFormRole('ADMIN');
    setFormStatus('Aktif');
    setIsModalOpen(true);
  };

  const openEditModal = (account: AdminAccount) => {
    setEditingAccount(account);
    setFormDisplayName(account.displayName);
    setFormUsername(account.username);
    setFormPassword(account.password);
    setShowFormPassword(false);
    setFormRole(account.role);
    setFormStatus(account.status);
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formDisplayName.trim();
    const cleanUser = formUsername.trim().toLowerCase();

    if (cleanName.length < 2) {
      showToastError('Nama tampilan minimal 2 karakter.');
      return;
    }
    if (cleanUser.length < 2) {
      showToastError('Username minimal 2 karakter.');
      return;
    }
    if (formPassword.length < 4) {
      showToastError('Password minimal 4 karakter.');
      return;
    }

    // Prevent exact duplicate username + password across different accounts
    const duplicatePair = adminAccounts.some(
      (a) =>
        a.id !== editingAccount?.id &&
        a.username.trim().toLowerCase() === cleanUser &&
        a.password === formPassword
    );
    if (duplicatePair) {
      showToastError('Kombinasi username dan password tersebut sudah digunakan akun lain.');
      return;
    }

    // Guard against removing last active SUPER_ADMIN
    if (
      editingAccount &&
      editingAccount.role === 'SUPER_ADMIN' &&
      editingAccount.status === 'Aktif' &&
      (formRole !== 'SUPER_ADMIN' || formStatus !== 'Aktif') &&
      activeSuperAdminCount <= 1
    ) {
      showToastError('Minimal harus ada 1 akun Super Admin yang aktif.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingAccount) {
        await dataService.updateAdminAccount(editingAccount.id, {
          displayName: cleanName,
          username: cleanUser,
          password: formPassword,
          role: formRole,
          status: formStatus,
        });
        success(`Akun ${cleanName} berhasil diperbarui.`);
      } else {
        await dataService.createAdminAccount({
          displayName: cleanName,
          username: cleanUser,
          password: formPassword,
          role: formRole,
          status: formStatus,
        });
        success(`Akun ${cleanName} berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
    } catch {
      showToastError('Gagal menyimpan akun user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (account: AdminAccount) => {
    const nextStatus: ActiveStatus = account.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    if (
      account.role === 'SUPER_ADMIN' &&
      account.status === 'Aktif' &&
      nextStatus === 'Nonaktif' &&
      activeSuperAdminCount <= 1
    ) {
      showToastError('Tidak dapat menonaktifkan satu-satunya Super Admin yang aktif.');
      return;
    }

    try {
      await dataService.updateAdminAccount(account.id, { status: nextStatus });
      success(`Status akun ${account.displayName} diubah menjadi ${nextStatus}.`);
    } catch {
      showToastError('Gagal memperbarui status akun.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;
    if (
      deletingAccount.role === 'SUPER_ADMIN' &&
      deletingAccount.status === 'Aktif' &&
      activeSuperAdminCount <= 1
    ) {
      showToastError('Tidak dapat menghapus satu-satunya Super Admin yang aktif.');
      setDeletingAccount(null);
      return;
    }

    try {
      await dataService.deleteAdminAccount(deletingAccount.id);
      success(`Akun ${deletingAccount.displayName} berhasil dihapus.`);
      setDeletingAccount(null);
    } catch {
      showToastError('Gagal menghapus akun.');
    }
  };

  // If currently logged in as regular ADMIN (not SUPER_ADMIN), render the Super Admin Login Gate
  if (!isSuperAdmin) {
    return (
      <div className="max-w-lg mx-auto py-8 sm:py-12">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Halaman User &amp; Password
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Halaman ini dilindungi hak akses <strong className="text-amber-300">Super Admin</strong>.
              Masukkan kredensial Super Admin untuk melihat dan mengelola user serta password sistem.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            {gateError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{gateError}</span>
              </div>
            )}

            <form onSubmit={handleUnlockSuperAdmin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  User Super Admin <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={gateUsername}
                    onChange={(e) => {
                      setGateUsername(e.target.value);
                      if (gateError) setGateError('');
                    }}
                    placeholder="Masukkan user super admin"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password Super Admin <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showGatePassword ? 'text' : 'password'}
                    value={gatePassword}
                    onChange={(e) => {
                      setGatePassword(e.target.value);
                      if (gateError) setGateError('');
                    }}
                    placeholder="Masukkan password super admin"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowGatePassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label={showGatePassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showGatePassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUnlocking}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>{isUnlocking ? 'Memverifikasi...' : 'Buka Akses Super Admin'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const totalCount = adminAccounts.length;
  const superAdminTotal = adminAccounts.filter((a) => a.role === 'SUPER_ADMIN').length;
  const regularAdminTotal = adminAccounts.filter((a) => a.role === 'ADMIN').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Manajemen User &amp; Password
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Super Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kelola akun Admin &amp; Super Admin, ubah password, dan atur status akses portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              lockSuperAdmin();
              success('Sesi Super Admin dikunci kembali ke mode Admin standar.');
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Kunci Sesi Super Admin</span>
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Akun</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Super Admin</p>
            <p className="text-2xl font-black text-indigo-700 mt-1">{superAdminTotal}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Biasa</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{regularAdminTotal}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Tampilan</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Password</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {adminAccounts.map((acc, index) => {
                const isRevealed = !!visiblePasswords[acc.id];
                const isSelf = currentUser?.id === acc.id;
                return (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{acc.displayName}</span>
                        {isSelf && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Aktif Saat Ini
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                      {acc.username}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        <span className="font-mono text-xs text-slate-800">
                          {isRevealed ? acc.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(acc.id)}
                          className="text-slate-400 hover:text-slate-700"
                          title={isRevealed ? 'Sembunyikan password' : 'Lihat password'}
                        >
                          {isRevealed ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {acc.role === 'SUPER_ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <KeyRound className="w-3 h-3" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <ShieldCheck className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          acc.status === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(acc)}
                          className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit User & Password"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(acc)}
                          className={`p-2 rounded-xl transition-colors ${
                            acc.status === 'Aktif'
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={acc.status === 'Aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingAccount(acc)}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {adminAccounts.map((acc) => {
          const isRevealed = !!visiblePasswords[acc.id];
          return (
            <div
              key={acc.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900">{acc.displayName}</h3>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">@{acc.username}</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    acc.role === 'SUPER_ADMIN'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {acc.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">Password:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-800">
                    {isRevealed ? acc.password : '••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(acc.id)}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    acc.status === 'Aktif'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {acc.status}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(acc)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(acc)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700"
                  >
                    {acc.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() => setDeletingAccount(acc)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">
                  {editingAccount ? 'Edit User & Password' : 'Tambah User Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Nama Tampilan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  placeholder="Contoh: Firman (Admin)"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Contoh: firman"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showFormPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Role Akses</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as AdminRole)}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ActiveStatus)}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 shadow-sm transition-colors"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        onConfirm={handleDeleteAccount}
        title="Hapus Akun User?"
        message={`Apakah Anda yakin ingin menghapus akun "${deletingAccount?.displayName}" (@${deletingAccount?.username})?`}
        confirmText="Hapus Akun"
        isDangerous
      />
    </div>
  );
};
