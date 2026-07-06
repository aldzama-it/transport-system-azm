"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, UserPlus, Trash2, Pencil, Search, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminClient() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  
  const [newNama, setNewNama] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("staff_transport");
  const [isAddingUser, setIsAddingUser] = useState(false);

  const [editUser, setEditUser] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      
      if (data.success) {
        setUsers(data.data);
      } else {
        toast.error(data.error || "Gagal memuat data pengguna");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error("Nama, Email, dan Password wajib diisi");
      return;
    }
    setIsAddingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: newNama, email: newEmail, password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pengguna berhasil ditambahkan");
        setIsAddUserOpen(false);
        setNewNama("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("staff_transport");
        fetchData();
      } else {
        toast.error(data.error || "Gagal menambah pengguna");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingAction(true);
    try {
      const body: any = { nama: editUser.nama, email: editUser.email, role: editUser.role };
      if (editUser.password && editUser.password.trim() !== '') {
        body.password = editUser.password;
      }
      
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pengguna berhasil diperbarui");
        setEditUser(null);
        fetchData();
      } else {
        toast.error(data.error || "Gagal memperbarui pengguna");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsProcessingAction(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pengguna berhasil dihapus");
        setDeleteId(null);
        fetchData();
      } else {
        toast.error(data.error || "Gagal menghapus pengguna");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsProcessingAction(false);
    }
  };

  let processedUsers = [...users];
  if (search) {
    const lowerSearch = search.toLowerCase();
    processedUsers = processedUsers.filter(u => u.nama.toLowerCase().includes(lowerSearch) || u.email.toLowerCase().includes(lowerSearch));
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-2 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-900">Manajemen Pengguna</h1>
          <p className="text-slate-500">Kelola akun dan hak akses pengguna sistem.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-sm focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Dashboard Utama
          </button>
          <button
            onClick={() => router.push('/dashboard/live-tracking')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Live Tracking
          </button>
          <button
            onClick={() => router.push('/dashboard/assets')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-sm focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Data Kendaraan
          </button>
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Akun
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Memuat data...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4 items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari pengguna berdasarkan nama atau email..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 bg-white"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedUsers.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">Data pengguna tidak ditemukan.</td></tr>
                ) : processedUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      {u.nama}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700' : 
                        u.role === 'koor_transport' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role === 'admin' ? 'Admin' : u.role === 'koor_transport' ? 'Koordinator' : 'Staff'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditUser({ ...u, password: '' })}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteId(u.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Tambah Pengguna Baru</h3>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
                  <input type="text" required value={newNama} onChange={e => setNewNama(e.target.value)} placeholder="Masukkan nama..." className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@company.com" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Role Akses</label>
                  <select required value={newRole} onChange={e => setNewRole(e.target.value)} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50">
                    <option value="staff_transport">Staff (Read Only)</option>
                    <option value="koor_transport">Koordinator (Full Dashboard)</option>
                    <option value="admin">Admin (Full Access)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                  <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Masukkan password" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddUserOpen(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors">Batal</button>
                <button type="submit" disabled={isAddingUser || !newNama.trim() || !newEmail.trim() || !newPassword.trim()} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {isAddingUser ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Edit Pengguna</h3>
            <form onSubmit={handleUpdateUser}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
                  <input type="text" required value={editUser.nama} onChange={e => setEditUser({...editUser, nama: e.target.value})} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input type="email" required value={editUser.email} onChange={e => setEditUser({...editUser, email: e.target.value})} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Role Akses</label>
                  <select required value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value})} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50">
                    <option value="staff_transport">Staff (Read Only)</option>
                    <option value="koor_transport">Koordinator (Full Dashboard)</option>
                    <option value="admin">Admin (Full Access)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password Baru <span className="text-slate-400 font-normal text-xs">(Opsional)</span></label>
                  <input type="password" value={editUser.password || ''} onChange={e => setEditUser({...editUser, password: e.target.value})} placeholder="Kosongkan jika tidak ingin mengubah password" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditUser(null)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors">Batal</button>
                <button type="submit" disabled={isProcessingAction || !editUser.nama.trim() || !editUser.email.trim()} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {isProcessingAction ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Hapus Pengguna?</h3>
            <p className="text-slate-600 mb-6">Tindakan ini tidak dapat dibatalkan. Pengguna ini akan kehilangan akses ke sistem secara permanen.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteId(null)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors">Batal</button>
              <button onClick={handleDelete} disabled={isProcessingAction} className="px-6 py-2 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors disabled:opacity-50">
                {isProcessingAction ? "Menghapus..." : "Ya, Hapus Pengguna"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
