import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Building, Power, Check, X } from 'lucide-react';
import { Division, Employee } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';

interface DivisionManagementViewProps {
  divisions: Division[];
  employees: Employee[];
}

export const DivisionManagementView: React.FC<DivisionManagementViewProps> = ({
  divisions,
  employees,
}) => {
  const { success, error, warning } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [divisionNameInput, setDivisionNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deletingDivision, setDeletingDivision] = useState<Division | null>(null);

  // Count employees per division
  const getEmployeeCount = (divisionId: string) => {
    return employees.filter((e) => e.divisionId === divisionId).length;
  };

  const handleOpenAdd = () => {
    setDivisionNameInput('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (div: Division) => {
    setEditingDivision(div);
    setDivisionNameInput(div.name);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!divisionNameInput.trim()) {
      warning('Nama divisi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDivision) {
        await dataService.updateDivision(editingDivision.id, {
          name: divisionNameInput.trim(),
        });
        success(`Divisi "${divisionNameInput.trim()}" berhasil diperbarui.`);
        setEditingDivision(null);
      } else {
        await dataService.createDivision(divisionNameInput.trim());
        success(`Divisi "${divisionNameInput.trim()}" berhasil ditambahkan.`);
        setIsAddModalOpen(false);
      }
      setDivisionNameInput('');
    } catch (err) {
      error('Gagal menyimpan data divisi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (div: Division) => {
    const newStatus = div.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    try {
      await dataService.updateDivision(div.id, { status: newStatus });
      success(`Status divisi "${div.name}" diubah menjadi ${newStatus}.`);
    } catch (err) {
      error('Gagal memperbarui status.');
    }
  };

  const handleDelete = async () => {
    if (!deletingDivision) return;
    try {
      await dataService.deleteDivision(deletingDivision.id);
      success(`Divisi "${deletingDivision.name}" berhasil dihapus.`);
      setDeletingDivision(null);
    } catch (err) {
      error('Gagal menghapus divisi.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            DATA DIVISI
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola daftar bagian dan divisi perusahaan. Perubahan otomatis diterapkan ke form pendaftaran.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Divisi</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Divisi</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Jumlah Karyawan</th>
                <th className="py-3.5 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {divisions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    Belum ada data divisi.
                  </td>
                </tr>
              ) : (
                divisions.map((div, index) => {
                  const count = getEmployeeCount(div.id);
                  return (
                    <tr key={div.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {div.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={div.status} size="sm" />
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
                            onClick={() => handleToggleStatus(div)}
                            title={div.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              div.status === 'Aktif'
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(div)}
                            title="Edit Divisi"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingDivision(div)}
                            title="Hapus Divisi"
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
        isOpen={isAddModalOpen || !!editingDivision}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingDivision(null);
        }}
        title={editingDivision ? 'Edit Data Divisi' : 'Tambah Divisi Baru'}
        maxWidth="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Nama Divisi / Bagian</label>
            <input
              type="text"
              value={divisionNameInput}
              onChange={(e) => setDivisionNameInput(e.target.value)}
              placeholder="Contoh: Quality Assurance"
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
                setEditingDivision(null);
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Divisi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingDivision}
        onClose={() => setDeletingDivision(null)}
        onConfirm={handleDelete}
        title="Hapus Divisi?"
        message={`Apakah Anda yakin ingin menghapus divisi "${deletingDivision?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Divisi"
        isDangerous
      />
    </div>
  );
};
