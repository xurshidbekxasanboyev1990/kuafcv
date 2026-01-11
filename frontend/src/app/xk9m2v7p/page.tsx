'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Database,
  Edit,
  Eye,
  EyeOff,
  Globe,
  Key,
  Lock,
  LogOut,
  RefreshCw,
  Save,
  Search,
  Server,
  Settings,
  Shield,
  Trash2,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';

// Maxfiy kalitlar
const SK = 'xurshidbekxasanboyev@kuafcv.uz';
const SP = 'otamonam9900';
const ST = 'xk_super_token_9m2v7p';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface SystemSettings {
  site_name: string;
  site_description: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  max_file_size: number;
  allowed_file_types: string;
}

export default function HiddenPanel() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'system'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Forms
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', role: 'ADMIN' });
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', password: '', role: 'ADMIN' });
  const [actionLoading, setActionLoading] = useState(false);
  
  // Settings
  const [settings, setSettings] = useState<SystemSettings>({
    site_name: 'KUAF CV',
    site_description: 'Talabalar portfolio tizimi',
    maintenance_mode: false,
    registration_enabled: true,
    max_file_size: 10,
    allowed_file_types: 'pdf,doc,docx,jpg,png',
  });

  // Check authentication on load
  useEffect(() => {
    const token = sessionStorage.getItem(ST);
    if (token === 'authenticated') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  // Filter users
  useEffect(() => {
    let filtered = users;
    if (searchQuery) {
      filtered = filtered.filter(u => 
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (roleFilter) {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (loginForm.email === SK && loginForm.password === SP) {
      sessionStorage.setItem(ST, 'authenticated');
      setIsAuthenticated(true);
    } else {
      setLoginError('Noto\'g\'ri ma\'lumotlar');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ST);
    setIsAuthenticated(false);
    router.push('/');
  };

  const fetchAllData = async () => {
    setDataLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch all users
      const res = await fetch('/api/admin/users?limit=1000', { headers });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
      
      // Fetch settings
      const settingsRes = await fetch('/api/admin/settings', { headers });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.settings) {
          setSettings(prev => ({ ...prev, ...settingsData.settings }));
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Change Password
  const handleChangePassword = async () => {
    if (!selectedUser) return;
    if (passwordForm.password.length < 6) {
      showMessage('error', 'Parol kamida 6 ta belgi bo\'lishi kerak');
      return;
    }
    if (passwordForm.password !== passwordForm.confirm) {
      showMessage('error', 'Parollar mos emas');
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ new_password: passwordForm.password }),
      });
      
      if (res.ok) {
        showMessage('success', `${selectedUser.full_name} paroli o'zgartirildi`);
        setShowPasswordModal(false);
        setPasswordForm({ password: '', confirm: '' });
      } else {
        const err = await res.json();
        showMessage('error', err.message || 'Xatolik');
      }
    } catch (err) {
      showMessage('error', 'Server xatoligi');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit User
  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      
      if (res.ok) {
        showMessage('success', 'Foydalanuvchi yangilandi');
        setShowEditModal(false);
        fetchAllData();
      } else {
        const err = await res.json();
        showMessage('error', err.message || 'Xatolik');
      }
    } catch (err) {
      showMessage('error', 'Server xatoligi');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    // Super admin o'zini o'chira olmaydi
    if (selectedUser.email === SK) {
      showMessage('error', 'Super adminni o\'chirib bo\'lmaydi');
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        showMessage('success', `${selectedUser.full_name} o'chirildi`);
        setShowDeleteModal(false);
        fetchAllData();
      } else {
        const err = await res.json();
        showMessage('error', err.message || 'Xatolik');
      }
    } catch (err) {
      showMessage('error', 'Server xatoligi');
    } finally {
      setActionLoading(false);
    }
  };

  // Create User
  const handleCreateUser = async () => {
    if (!createForm.full_name || !createForm.email || !createForm.password) {
      showMessage('error', 'Barcha maydonlarni to\'ldiring');
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(createForm),
      });
      
      if (res.ok) {
        showMessage('success', 'Foydalanuvchi yaratildi');
        setShowCreateModal(false);
        setCreateForm({ full_name: '', email: '', password: '', role: 'ADMIN' });
        fetchAllData();
      } else {
        const err = await res.json();
        showMessage('error', err.message || 'Xatolik');
      }
    } catch (err) {
      showMessage('error', 'Server xatoligi');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ settings }),
      });
      
      if (res.ok) {
        showMessage('success', 'Sozlamalar saqlandi');
      } else {
        showMessage('error', 'Saqlashda xatolik');
      }
    } catch (err) {
      showMessage('error', 'Server xatoligi');
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">Maxfiy Kirish</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                {loginError}
              </div>
            )}
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email kiriting"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Parol</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Parol kiriting"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Kirish
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main panel
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Boshqaruv Paneli</h1>
              <p className="text-gray-400 text-sm">Tizim boshqaruvi</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <LogOut size={18} />
            Chiqish
          </button>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 min-h-[calc(100vh-73px)] p-4 border-r border-gray-700">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Users size={20} />
              Foydalanuvchilar
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Settings size={20} />
              Sozlamalar
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'system' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Server size={20} />
              Tizim
            </button>
          </nav>
          
          {/* Stats */}
          <div className="mt-8 p-4 bg-gray-700/50 rounded-xl">
            <h3 className="text-gray-400 text-sm mb-3">Statistika</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Jami:</span>
                <span className="font-medium">{users.length}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Admin:</span>
                <span className="font-medium">{users.filter(u => u.role === 'ADMIN').length}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Registrar:</span>
                <span className="font-medium">{users.filter(u => u.role === 'REGISTRAR').length}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Employer:</span>
                <span className="font-medium">{users.filter(u => u.role === 'EMPLOYER').length}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Talaba:</span>
                <span className="font-medium">{users.filter(u => u.role === 'STUDENT').length}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6">
          {activeTab === 'users' && (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Foydalanuvchilar</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserIcon size={18} />
                  Yangi qo'shish
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Qidirish..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  title="Role bo'yicha filter"
                >
                  <option value="">Barcha rollar</option>
                  <option value="ADMIN">Admin</option>
                  <option value="REGISTRAR">Registrar</option>
                  <option value="EMPLOYER">Employer</option>
                  <option value="STUDENT">Talaba</option>
                </select>
                <button
                  onClick={fetchAllData}
                  disabled={dataLoading}
                  className="px-4 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors"
                  title="Yangilash"
                >
                  <RefreshCw size={20} className={dataLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">Foydalanuvchi</th>
                      <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">Email</th>
                      <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">Rol</th>
                      <th className="px-4 py-3 text-left text-gray-300 text-sm font-medium">Holat</th>
                      <th className="px-4 py-3 text-right text-gray-300 text-sm font-medium">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                              <UserIcon className="text-gray-400" size={20} />
                            </div>
                            <span className="text-white font-medium">{u.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                            u.role === 'REGISTRAR' ? 'bg-blue-500/20 text-blue-400' :
                            u.role === 'EMPLOYER' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            u.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {u.is_active ? 'Faol' : 'Nofaol'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setPasswordForm({ password: '', confirm: '' });
                                setShowPasswordModal(true);
                              }}
                              className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                              title="Parolni o'zgartirish"
                            >
                              <Key size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setEditForm({ full_name: u.full_name, email: u.email, role: u.role as any });
                                setShowEditModal(true);
                              }}
                              className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                              title="Tahrirlash"
                            >
                              <Edit size={18} />
                            </button>
                            {u.email !== SK && (
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="O'chirish"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredUsers.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    Foydalanuvchilar topilmadi
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Sayt Sozlamalari</h2>
              
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Sayt nomi</label>
                  <input
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Tavsif</label>
                  <textarea
                    value={settings.site_description}
                    onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Maksimal fayl hajmi (MB)</label>
                    <input
                      type="number"
                      value={settings.max_file_size}
                      onChange={(e) => setSettings({ ...settings, max_file_size: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Ruxsat berilgan fayl turlari</label>
                    <input
                      type="text"
                      value={settings.allowed_file_types}
                      onChange={(e) => setSettings({ ...settings, allowed_file_types: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenance_mode}
                      onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                      className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Ta'mirlash rejimi</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.registration_enabled}
                      onChange={(e) => setSettings({ ...settings, registration_enabled: e.target.checked })}
                      className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Ro'yxatdan o'tish yoqilgan</span>
                  </label>
                </div>
                
                <button
                  onClick={handleSaveSettings}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save size={20} />
                  Saqlash
                </button>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Tizim Ma'lumotlari</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Server className="text-blue-400" size={24} />
                    <h3 className="text-lg font-semibold text-white">Server</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-green-400">Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Backend:</span>
                      <span className="text-white">Go 1.23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Frontend:</span>
                      <span className="text-white">Next.js 14</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="text-green-400" size={24} />
                    <h3 className="text-lg font-semibold text-white">Database</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">PostgreSQL:</span>
                      <span className="text-white">15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Redis:</span>
                      <span className="text-white">7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Foydalanuvchilar:</span>
                      <span className="text-white">{users.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Parolni o'zgartirish</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-400">{selectedUser.full_name} uchun yangi parol</p>
              
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  placeholder="Yangi parol"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                placeholder="Parolni tasdiqlang"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600"
                >
                  Bekor
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Foydalanuvchini tahrirlash</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Ism</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Rol</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  title="Rol tanlash"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="REGISTRAR">Registrar</option>
                  <option value="EMPLOYER">Employer</option>
                  <option value="STUDENT">Talaba</option>
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600"
                >
                  Bekor
                </button>
                <button
                  onClick={handleEditUser}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">O'chirishni tasdiqlash</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-6">
                <span className="text-white font-semibold">{selectedUser.full_name}</span> ni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600"
                >
                  Bekor
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'O\'chirilmoqda...' : 'O\'chirish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Yangi foydalanuvchi</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Ism</label>
                <input
                  type="text"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  placeholder="To'liq ism"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Parol</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  placeholder="Parol"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Rol</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  title="Rol tanlash"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="REGISTRAR">Registrar</option>
                  <option value="EMPLOYER">Employer</option>
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600"
                >
                  Bekor
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Yaratilmoqda...' : 'Yaratish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
