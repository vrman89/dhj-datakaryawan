import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Layers, Power } from 'lucide-react';
import { Subcont, Employee } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';

interface SubcontManagementViewProps {
  subconts: Subcont[];
  employees: Employee[];
}

export const SubcontManagementView: React.FC<SubcontManagementViewProps> = ({
  subconts,
  employees,
}) => {
  const { success, error, warning } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubcont, setEditingSubcont] = useState<Subcont | null>(null);
  const [subcontNameInput, setSubcontNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deletingSubcont, setDeletingSubcont] = useState<Subcont | null>(null);

  // Count employees per subcont
  const getEmployeeCount = (subcontId: string) => {
    return employees.filter((e) => e.subcontId === subcontId).length;
  };

  const handleOpenAdd = () => {
    setSubcontNameInput('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sub: Subcont) => {
    setEditingSubcont(sub);
    setSubcontNameInput(sub.name);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcontNameInput.trim()) {
      warning('Nama subcont wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSubcont) {
        await dataService.updateSubcont(editingSubcont.id, {
          name: subcontNameInput.trim(),
        });
        success(`Subcont "${subcontNameInput.trim()}" berhasil diperbarui.`);
        setEditingSubcont(null);
      } else {
        await dataService.createSubcont(subcontNameInput.trim());
        success(`Subcont "${subcontNameInput.trim()}" berhasil ditambahkan.`);
        setIsAddModalOpen(false);
      }
      setSubcontNameInput('');
    } catch (err) {
      error('Gagal menyimpan data subcont.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (sub: Subcont) => {
    const newStatus = sub.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    try {
      await dataService.updateSubcont(sub.id, { status: newStatus });
      success(`Status subcont "${sub.name}" diubah menjadi ${newStatus}.`);
    } catch (err) {
      error('Gagal memperbarui status.');
    }
  };

  const handleDelete = async () => {
    if (!deletingSubcont) return;
    try {
      await dataService.deleteSubcont(deletingSubcont.id);
      success(`Subcont "${deletingSubcont.name}" berhasil dihapus.`);
      setDeletingSubcont(null);
    } catch (err) {
      error('Gagal menghapus subcont.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            DATA SUBCONT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola daftar mitra subkontraktor dan internal. Otomatis sinkron ke pilihan formulir pendaftaran.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Subcont</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Subcont</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Jumlah Karyawan</th>
                <th className="py-3.5 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {subconts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    Belum ada data subcont.
                  </td>
                </tr>
              ) : (
                subconts.map((sub, index) => {
                  const count = getEmployeeCount(sub.id);
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {sub.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={sub.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                          {count} orang
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Toggle Active */}
                          <button
                            onClick={() => handleToggleStatus(sub)}
                            title={sub.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              sub.status === 'Aktif'
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(sub)}
                            title="Edit Subcont"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingSubcont(sub)}
                            title="Hapus Subcont"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || !!editingSubcont}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSubcont(null);
        }}
        title={editingSubcont ? 'Edit Data Subcont' : 'Tambah Subcont Baru'}
        maxWidth="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Nama Subcont / Vendor</label>
            <input
              type="text"
              value={subcontNameInput}
              onChange={(e) => setSubcontNameInput(e.target.value)}
              placeholder="Contoh: Subcont D (PT Multi Teknik)"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              autoFocus
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingSubcont(null);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Subcont'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingSubcont}
        onClose={() => setDeletingSubcont(null)}
        onConfirm={handleDelete}
        title="Hapus Subcont?"
        message={`Apakah Anda yakin ingin menghapus subcont "${deletingSubcont?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Subcont"
        isDangerous
      />
    </div>
  );
};
