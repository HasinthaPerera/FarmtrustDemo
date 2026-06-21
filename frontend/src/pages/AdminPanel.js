import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Wheat, Banknote, ShieldCheck, LayoutDashboard, Settings, RefreshCw,
  Search, ChevronDown, Pencil, Trash2, MapPin, X, UserPlus, AlertTriangle, RotateCcw, Check, ThumbsUp, ThumbsDown
} from 'lucide-react';
import client from '../api/client';

const RECENT_ACTIVITY = [
  { id: 1, event: 'New Farmer Registered', actor: 'Ravi Kumar', time: '2 min ago', status: 'success' },
  { id: 2, event: "Crop 'Tomato' Listed", actor: 'Priya Sharma', time: '14 min ago', status: 'info' },
  { id: 3, event: 'Transaction #1024 Completed', actor: 'System', time: '31 min ago', status: 'success' },
  { id: 4, event: 'New Buyer Account Activated', actor: 'Arjun Mehta', time: '1 hr ago', status: 'info' },
  { id: 5, event: 'Failed Login Attempt Blocked', actor: 'unknown@test.com', time: '2 hr ago', status: 'warning' },
];

const STATUS_STYLES = {
  success: 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50',
  info: 'bg-blue-950/40 text-blue-400 border border-blue-900/50',
  warning: 'bg-amber-950/40 text-amber-500 border border-amber-900/50',
};

// NAV_ITEMS is built dynamically below so we can inject the pending badge count

const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Users state
  const [users, setUsers] = useState([]);

  // Crops state — populated from API
  const [crops, setCrops] = useState([]);
  const [isLoadingCrops, setIsLoadingCrops] = useState(false);
  const [cropActionLoading, setCropActionLoading] = useState(null); // id of crop being actioned

  // Dashboard metrics state
  const [metrics, setMetrics] = useState({
    totalUsers: '0',
    activeCrops: '0',
    transactions: '$0',
    platformHealth: '99.9%'
  });

  // Pending crops count for nav badge
  const pendingCount = crops.filter(c => c.status === 'pending').length;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Fetch crops from API
  const fetchCrops = useCallback(async () => {
    setIsLoadingCrops(true);
    try {
      const res = await client.get('/admin/crops');
      setCrops(res.data);
    } catch (err) {
      console.error('Error loading crops:', err);
    } finally {
      setIsLoadingCrops(false);
    }
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      setIsLoadingUsers(true);
      try {
        const token = localStorage.getItem('token');
        if (token) client.defaults.headers.common['x-auth-token'] = token;

        const [activeRes, trashRes] = await Promise.all([
          client.get('/admin/users'),
          client.get('/admin/users/trash'),
        ]);
        setUsers(activeRes.data);
        setDeletedUsers(trashRes.data);

        try {
          const metricsRes = await client.get('/admin/metrics');
          if (metricsRes.data?.success) setMetrics(metricsRes.data.data);
        } catch (metricsErr) {
          setMetrics(prev => ({ ...prev, totalUsers: activeRes.data.length.toString(), transactions: '$14,920' }));
        }
      } catch (err) {
        console.error('Error loading admin panel data:', err);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchAdminData();
    fetchCrops();
  }, [lastRefreshed, fetchCrops]);

  // Search & Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('Active Only'); // Defaults to Active Only in mockup

  const [cropSearchQuery, setCropSearchQuery] = useState('');
  const [cropStatusFilter, setCropStatusFilter] = useState('All Status');
  
  // Filter dropdown states
  const [openUserFilterDropdown, setOpenUserFilterDropdown] = useState(null);
  const [openCropFilterDropdown, setOpenCropFilterDropdown] = useState(null);

  // Approve a crop via API
  const handleApproveCrop = async (cropId) => {
    setCropActionLoading(cropId);
    try {
      await client.put(`/admin/crops/${cropId}/approve`);
      setCrops(prev => prev.map(c => c.id === cropId ? { ...c, status: 'approved' } : c));
    } catch (err) {
      console.error('Error approving crop:', err);
    } finally {
      setCropActionLoading(null);
    }
  };

  // Reject a crop via API
  const handleRejectCrop = async (cropId) => {
    setCropActionLoading(cropId);
    try {
      await client.put(`/admin/crops/${cropId}/reject`);
      setCrops(prev => prev.map(c => c.id === cropId ? { ...c, status: 'rejected' } : c));
    } catch (err) {
      console.error('Error rejecting crop:', err);
    } finally {
      setCropActionLoading(null);
    }
  };

  // Admin hard-delete a crop
  const handleAdminDeleteCrop = async (cropId) => {
    setCropActionLoading(cropId);
    try {
      await client.delete(`/admin/crops/${cropId}`);
      setCrops(prev => prev.filter(c => c.id !== cropId));
    } catch (err) {
      console.error('Error deleting crop:', err);
    } finally {
      setCropActionLoading(null);
      setIsDeleteCropModalOpen(false);
      setDeletingCropId(null);
    }
  };

  // Modals management states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCropModalOpen, setIsAddCropModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteCropModalOpen, setIsDeleteCropModalOpen] = useState(false);

  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'buyer', status: 'active', district: 'Colombo' });
  const [newCrop, setNewCrop] = useState({ name: '', category: 'Grain', price: '', qty: '', farmerName: '', location: '', listed: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [editingCrop, setEditingCrop] = useState(null);
  const [isEditCropModalOpen, setIsEditCropModalOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [deletingCropId, setDeletingCropId] = useState(null);

  const handleEditCrop = (e) => {
    e.preventDefault();
    if (editingCrop) {
      setCrops(crops.map(c => c.id === editingCrop.id ? { ...editingCrop } : c));
      setIsEditCropModalOpen(false);
      setEditingCrop(null);
    }
  };

  const handleDeleteCrop = () => {
    if (deletingCropId) handleAdminDeleteCrop(deletingCropId);
  };

  const handleAddCrop = (e) => {
    e.preventDefault();
    const newId = `CRP-00${crops.length + 1}`.slice(-3);
    const initials = newCrop.farmerName ? newCrop.farmerName.substring(0, 2).toUpperCase() : 'NA';
    setCrops([{
      id: `CRP-${newId}`,
      name: newCrop.name,
      category: newCrop.category,
      price: newCrop.price,
      qty: newCrop.qty,
      farmerName: newCrop.farmerName,
      location: newCrop.location,
      listed: newCrop.listed,
      status: 'Active',
      isOrganic: false,
      farmerInitials: initials,
      farmerColor: 'bg-emerald-900 text-emerald-200'
    }, ...crops]);
    setIsAddCropModalOpen(false);
    setNewCrop({ name: '', category: 'Grain', price: '', qty: '', farmerName: '', location: '', listed: '' });
  };

  // Trash bin states
  const [showTrash, setShowTrash] = useState(false);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [isPermanentDeleteModalOpen, setIsPermanentDeleteModalOpen] = useState(false);
  const [permanentDeletingUserId, setPermanentDeletingUserId] = useState(null);
  
  // Validation error states
  const [addError, setAddError] = useState('');
  const [editError, setEditError] = useState('');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefreshed(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }, 600);
  };

  // User Action Handlers
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      setAddError('Name, email and password are required.');
      return;
    }

    try {
      const res = await client.post('/admin/users', newUser);
      setUsers([res.data, ...users]);
      setNewUser({ name: '', email: '', password: '', role: 'buyer', status: 'active', district: 'Colombo' });
      setAddError('');
      setIsAddModalOpen(false);
    } catch (err) {
      setAddError(err.response?.data?.msg || 'Failed to create user. Please try again.');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser.name || !editingUser.email) return;

    try {
      const res = await client.put(`/admin/users/${editingUser.id}`, editingUser);
      if (res.data.status === 'inactive') {
        setDeletedUsers([res.data, ...deletedUsers]);
        setUsers(users.filter(u => u.id !== editingUser.id));
      } else {
        setUsers(users.map(u => u.id === editingUser.id ? res.data : u));
      }
      setEditingUser(null);
      setEditError('');
      setIsEditModalOpen(false);
    } catch (err) {
      setEditError(err.response?.data?.msg || 'Failed to update user.');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await client.delete(`/admin/users/${deletingUserId}`);
      const userToTrash = users.find(u => u.id === deletingUserId);
      if (userToTrash) {
        setDeletedUsers([{ ...userToTrash, status: 'inactive' }, ...deletedUsers]);
        setUsers(users.filter(u => u.id !== deletingUserId));
      }
      setDeletingUserId(null);
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Error trashing user:', err);
    }
  };

  const handleRestoreUser = async (user) => {
    try {
      const res = await client.put(`/admin/users/${user.id}`, {
        ...user,
        status: 'active'
      });
      setUsers([res.data, ...users]);
      setDeletedUsers(deletedUsers.filter(u => u.id !== user.id));
    } catch (err) {
      console.error('Error restoring user:', err);
    }
  };

  const handlePermanentDeleteUser = async () => {
    try {
      await client.delete(`/admin/users/${permanentDeletingUserId}/permanent`);
      setDeletedUsers(deletedUsers.filter(u => u.id !== permanentDeletingUserId));
      setPermanentDeletingUserId(null);
      setIsPermanentDeleteModalOpen(false);
    } catch (err) {
      console.error('Error permanently deleting user:', err);
    }
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Sub-views
  // ─────────────────────────────────────────────────────────────────────────
  
  // 1. Dashboard View
  const DashboardView = () => (
    <div className="space-y-8 animate-pageSlideFade">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: metrics.totalUsers, icon: <Users className="w-6 h-6" />, color: 'bg-blue-900/30 text-blue-400 border border-blue-800/50' },
          { label: 'Active Crops', value: metrics.activeCrops, icon: <Wheat className="w-6 h-6" />, color: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' },
          { label: 'Transactions', value: metrics.transactions, icon: <Banknote className="w-6 h-6" />, color: 'bg-amber-900/30 text-amber-400 border border-amber-800/50' },
          { label: 'Platform Health', value: metrics.platformHealth, icon: <ShieldCheck className="w-6 h-6" />, color: 'bg-purple-900/30 text-purple-400 border border-purple-800/50' },
        ].map((card, idx) => (
          <div key={idx} className="bg-[#1e293b]/70 border border-slate-700/50 backdrop-blur-md rounded-2xl p-6 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[#94a3b8] text-sm font-medium mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* System Overview Card */}
      <div className="bg-[#1e293b]/70 border border-slate-700/50 backdrop-blur-md rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-6">System Overview</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-semibold text-white mb-1">Platform Performance</p>
              <p className="text-[#94a3b8] text-sm">All systems operational. No active alerts.</p>
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-900/50">Good</span>
          </div>
          <div className="border-t border-slate-700/50 my-4"></div>
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-semibold text-white mb-1">Database Status</p>
              <p className="text-[#94a3b8] text-sm">MySQL connection stable. 45 GB used.</p>
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-900/50">Connected</span>
          </div>
        </div>
      </div>

      {/* Recent Platform Activity */}
      <div className="bg-[#1e293b]/70 border border-slate-700/50 backdrop-blur-md rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Recent Platform Activity</h3>
          <span className="text-xs text-[#94a3b8] font-medium">Last 24 hours</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700/50 text-left">
                <th className="px-4 py-3 font-semibold text-[#94a3b8] w-8">#</th>
                <th className="px-4 py-3 font-semibold text-[#94a3b8]">Event</th>
                <th className="px-4 py-3 font-semibold text-[#94a3b8]">Actor</th>
                <th className="px-4 py-3 font-semibold text-[#94a3b8]">Time</th>
                <th className="px-4 py-3 font-semibold text-[#94a3b8] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {RECENT_ACTIVITY.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-[#64748b] font-mono">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-white">{item.event}</td>
                  <td className="px-4 py-3 text-[#94a3b8]">{item.actor}</td>
                  <td className="px-4 py-3 text-[#94a3b8] whitespace-nowrap">{item.time}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // 2. Users View (Main focus to match user's image)
  const UsersView = () => {
    // Client-side filtering logic
    const targetUsers = showTrash ? deletedUsers : users;
    
    const filteredUsers = targetUsers.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = 
        roleFilter === 'All Roles' || 
        user.role.toLowerCase() === roleFilter.toLowerCase();
      
      const matchesStatus = 
        showTrash ? true : (
          statusFilter === 'All Statuses' || 
          (statusFilter === 'Active Only' && user.status === 'active') || 
          (statusFilter === 'Inactive Only' && user.status === 'inactive')
        );

      return matchesSearch && matchesRole && matchesStatus;
    });

    return (
      <div className="space-y-6 animate-pageSlideFade">
        {/* Search & Filter Bar */}
        <div className="bg-[#1e293b]/90 border border-slate-700/50 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#94a3b8]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={showTrash ? "Search trash by name or email..." : "Search users by name or email..."}
              className="block w-full pl-10 pr-4 py-2 bg-[#0f172a] border border-slate-700/70 rounded-lg text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex w-full md:w-auto items-center gap-3">
            {/* Roles Filter Dropdown */}
            <div className="relative w-full md:w-40">
              <button
                onClick={() => setOpenUserFilterDropdown(openUserFilterDropdown === 'role' ? null : 'role')}
                className="flex items-center justify-between w-full px-3 py-2 bg-[#0f172a] border border-slate-700/70 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer transition-colors"
              >
                <span className="capitalize">{roleFilter === 'All Roles' ? 'All Roles' : roleFilter}</span>
                <ChevronDown className="h-4 w-4 text-[#94a3b8]" />
              </button>
              {openUserFilterDropdown === 'role' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenUserFilterDropdown(null)} />
                  <div className="absolute left-0 mt-2 w-full bg-[#0f172a] border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-1.5 flex flex-col gap-0.5">
                      {['All Roles', 'buyer', 'farmer', 'admin'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setRoleFilter(opt); setOpenUserFilterDropdown(null); }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/80 rounded-lg transition-colors capitalize"
                        >
                          <span className="font-medium">{opt}</span>
                          {roleFilter === opt && <Check className="w-4 h-4 text-emerald-500" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Status Filter Dropdown - Hidden in Trash view */}
            {!showTrash && (
              <div className="relative w-full md:w-40">
                <button
                  onClick={() => setOpenUserFilterDropdown(openUserFilterDropdown === 'status' ? null : 'status')}
                  className="flex items-center justify-between w-full px-3 py-2 bg-[#0f172a] border border-slate-700/70 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer transition-colors"
                >
                  <span>{statusFilter}</span>
                  <ChevronDown className="h-4 w-4 text-[#94a3b8]" />
                </button>
                {openUserFilterDropdown === 'status' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenUserFilterDropdown(null)} />
                    <div className="absolute left-0 mt-2 w-full bg-[#0f172a] border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="p-1.5 flex flex-col gap-0.5">
                        {['All Statuses', 'Active Only', 'Inactive Only'].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => { setStatusFilter(opt); setOpenUserFilterDropdown(null); }}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/80 rounded-lg transition-colors"
                          >
                            <span className="font-medium">{opt}</span>
                            {statusFilter === opt && <Check className="w-4 h-4 text-emerald-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Trash Bin Toggle Button */}
            <button
              onClick={() => setShowTrash(!showTrash)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border whitespace-nowrap ${
                showTrash 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/30' 
                  : 'bg-[#1e293b] border-slate-700 text-[#94a3b8] hover:text-white hover:bg-slate-800'
              }`}
            >
              {showTrash ? (
                <>
                  <Users className="w-4 h-4" /> Active Users
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Trash ({deletedUsers.length})
                </>
              )}
            </button>

            {/* Add User Button */}
            {!showTrash && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" /> Add User
              </button>
            )}
          </div>
        </div>

        {/* User Table Card */}
        <div className="bg-[#1e293b]/70 border border-slate-700/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#1e293b]/90 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Registered Date</th>
                  <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {isLoadingUsers ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-700/60" />
                          <div className="h-3 w-28 bg-slate-700/60 rounded-full" />
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-3 w-40 bg-slate-700/60 rounded-full" /></td>
                      <td className="px-6 py-4"><div className="h-5 w-14 bg-slate-700/60 rounded-full" /></td>
                      <td className="px-6 py-4"><div className="h-5 w-14 bg-slate-700/60 rounded-full" /></td>
                      <td className="px-6 py-4"><div className="h-3 w-24 bg-slate-700/60 rounded-full" /></td>
                      <td className="px-6 py-4"><div className="h-3 w-12 bg-slate-700/60 rounded-full" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-[#64748b]">
                      {showTrash ? "No deleted users found in the trash." : "No users found matching filters."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* USER */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shadow-sm border border-slate-600">
                            {getInitials(user.name)}
                          </div>
                          <span className="font-bold text-white text-base">{user.name}</span>
                        </div>
                      </td>

                      {/* EMAIL */}
                      <td className="px-6 py-4 text-[#94a3b8] text-sm">{user.email}</td>

                      {/* ROLE */}
                      <td className="px-6 py-4">
                        {user.role === 'admin' && (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-blue-950/40 text-blue-400 border border-blue-900/50">
                            Admin
                          </span>
                        )}
                        {user.role === 'farmer' && (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-emerald-950/40 text-emerald-400 border border-emerald-900/50">
                            Farmer
                          </span>
                        )}
                        {user.role === 'buyer' && (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-amber-950/40 text-amber-500 border border-amber-900/50">
                            Buyer
                          </span>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                          showTrash 
                            ? 'bg-rose-950/40 text-rose-400 border border-rose-900/50'
                            : user.status === 'active' 
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' 
                              : 'bg-rose-950/40 text-rose-400 border border-rose-900/50'
                        }`}>
                          {showTrash ? 'deleted' : user.status}
                        </span>
                      </td>

                      {/* REGISTERED DATE */}
                      <td className="px-6 py-4 text-[#94a3b8] text-sm">{user.registeredDate || formatDate(user.createdAt)}</td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4">
                        {showTrash ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleRestoreUser(user)}
                              className="p-1 text-emerald-500 hover:text-emerald-400 transition-colors"
                              title="Restore User"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setPermanentDeletingUserId(user.id); setIsPermanentDeleteModalOpen(true); }}
                              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => { setEditingUser(user); setIsEditModalOpen(true); }}
                              className="p-1 text-[#94a3b8] hover:text-white transition-colors"
                              title="Edit User"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setDeletingUserId(user.id); setIsDeleteModalOpen(true); }}
                              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 3. Crops View — live data with Approve / Reject actions
  const cropsView = (
    <div className="space-y-6 animate-pageSlideFade">
      {/* Pending Review banner */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-950/30 border border-amber-700/40 rounded-xl px-5 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300 font-medium">
            <span className="font-bold">{pendingCount} crop{pendingCount > 1 ? 's' : ''}</span> awaiting your review. Approve or reject them below.
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-[#1e293b]/90 border border-slate-700/50 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[#94a3b8]" />
          </div>
          <input
            type="text"
            placeholder="Search by crop name, farmer, district..."
            value={cropSearchQuery}
            onChange={(e) => setCropSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 bg-[#0f172a] border border-slate-700/70 rounded-lg text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div className="flex w-full md:w-auto items-center gap-3">
          {/* Status filter */}
          <div className="relative w-full sm:w-40">
            <button
              onClick={() => setOpenCropFilterDropdown(openCropFilterDropdown === 'status' ? null : 'status')}
              className="flex items-center justify-between w-full bg-[#0f172a] border border-slate-700/70 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 cursor-pointer transition-colors"
            >
              <span>{cropStatusFilter}</span>
              <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
            </button>
            {openCropFilterDropdown === 'status' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenCropFilterDropdown(null)} />
                <div className="absolute left-0 mt-2 w-full bg-[#0f172a] border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-1.5 flex flex-col gap-0.5">
                    {['All Status', 'pending', 'approved', 'rejected'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setCropStatusFilter(opt); setOpenCropFilterDropdown(null); }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/80 rounded-lg transition-colors capitalize"
                      >
                        <span className="font-medium">{opt}</span>
                        {cropStatusFilter === opt && <Check className="w-4 h-4 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            onClick={fetchCrops}
            disabled={isLoadingCrops}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e293b] text-[#94a3b8] hover:bg-slate-800 hover:text-white transition-colors border border-slate-700 text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingCrops ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-slate-700/50 rounded-xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#1e293b]/90 border-b border-slate-700/50">
            <tr>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Crop</th>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Price</th>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Qty (KG)</th>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Farmer</th>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">District</th>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Listed</th>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {isLoadingCrops ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-3 bg-slate-700/60 rounded-full" /></td>
                  ))}
                </tr>
              ))
            ) : (
              crops
                .filter(c => {
                  const farmerName = c.farmer?.name || '';
                  const district = c.district || '';
                  const matchesSearch =
                    c.name.toLowerCase().includes(cropSearchQuery.toLowerCase()) ||
                    farmerName.toLowerCase().includes(cropSearchQuery.toLowerCase()) ||
                    district.toLowerCase().includes(cropSearchQuery.toLowerCase());
                  const matchesStatus = cropStatusFilter === 'All Status' || c.status === cropStatusFilter;
                  return matchesSearch && matchesStatus;
                })
                .map((crop) => {
                  const isActioning = cropActionLoading === crop.id;
                  const farmerName = crop.farmer?.name || 'Unknown';
                  const farmerInitials = farmerName.slice(0, 2).toUpperCase();
                  return (
                    <tr key={crop.id} className={`hover:bg-slate-800/30 transition-colors ${
                      crop.status === 'pending' ? 'border-l-2 border-amber-500/50' : ''
                    }`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#0f172a] border border-slate-700 flex items-center justify-center flex-shrink-0">
                            <Wheat className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{crop.name}</span>
                            <span className="text-xs text-slate-500 mt-0.5">#{crop.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                          crop.status === 'approved' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' :
                          crop.status === 'pending'  ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' :
                          'bg-rose-950/40 text-rose-400 border border-rose-900/50'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            crop.status === 'approved' ? 'bg-emerald-400' :
                            crop.status === 'pending'  ? 'bg-amber-400 animate-pulse' :
                            'bg-rose-400'
                          }`} />
                          {crop.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-white font-medium">
                        Rs. {Number(crop.price).toFixed(2)} <span className="text-slate-500 text-xs">/kg</span>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">{crop.quantity}</td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                            {farmerInitials}
                          </div>
                          <span className="text-slate-300 font-medium">{farmerName}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-[#94a3b8]">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{crop.district}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-[#94a3b8]">
                        {new Date(crop.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Approve */}
                          {crop.status !== 'approved' && (
                            <button
                              onClick={() => handleApproveCrop(crop.id)}
                              disabled={isActioning}
                              title="Approve"
                              className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-900/50 transition-colors disabled:opacity-40"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Reject */}
                          {crop.status !== 'rejected' && (
                            <button
                              onClick={() => handleRejectCrop(crop.id)}
                              disabled={isActioning}
                              title="Reject"
                              className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 border border-rose-900/50 transition-colors disabled:opacity-40"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Delete */}
                          <button
                            onClick={() => { setDeletingCropId(crop.id); setIsDeleteCropModalOpen(true); }}
                            disabled={isActioning}
                            title="Delete"
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
            )}
            {!isLoadingCrops && crops.filter(c => {
              const farmerName = c.farmer?.name || '';
              const district = c.district || '';
              return (
                (c.name.toLowerCase().includes(cropSearchQuery.toLowerCase()) ||
                 farmerName.toLowerCase().includes(cropSearchQuery.toLowerCase()) ||
                 district.toLowerCase().includes(cropSearchQuery.toLowerCase())) &&
                (cropStatusFilter === 'All Status' || c.status === cropStatusFilter)
              );
            }).length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-[#64748b]">
                  No crops found matching the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 4. Settings View (Styled with dark theme)
  const SettingsView = () => (
    <div className="bg-[#1e293b]/70 border border-slate-700/50 backdrop-blur-md rounded-2xl p-8 text-slate-300 shadow-lg animate-pageSlideFade">
      <h3 className="text-xl font-bold text-white mb-6">System Settings</h3>
      <div className="space-y-6 max-w-xl">
        <div>
          <label className="block text-sm font-semibold text-[#94a3b8] mb-2">Platform Name</label>
          <input
            type="text"
            defaultValue="FarmTrust"
            className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#94a3b8] mb-2">Commission Rate (%)</label>
          <input
            type="number"
            defaultValue="5"
            className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:shadow-emerald-900/20 transition-all">
          Save Settings
        </button>
      </div>
    </div>
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'users',     label: 'Users',     icon: <Users className="w-5 h-5" /> },
    {
      id: 'crops', label: 'Crops', icon: <Wheat className="w-5 h-5" />,
      badge: pendingCount > 0 ? pendingCount : null
    },
    { id: 'settings',  label: 'Settings',  icon: <Settings className="w-5 h-5" /> },
  ];

  const VIEW_MAP = {
    dashboard: <DashboardView />,
    users: <UsersView />,
    crops: cropsView,
    settings: <SettingsView />,
  };

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-64px)] flex flex-col md:flex-row transition-colors duration-300"
      style={{
        background: 'linear-gradient(180deg, #fff1f5 0%, #f3e8ff 35%, #e0f2fe 70%, #d1fae5 100%)'
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          background: 'linear-gradient(180deg, #1e0a2e 0%, #1a1040 35%, #0d1f3c 70%, #022c22 100%)'
        }}
      />
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30 dark:opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #f9a8d4, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-25 dark:opacity-15 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #c4b5fd, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full opacity-30 dark:opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #7dd3fc, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-[400px] h-[300px] rounded-full opacity-0 dark:opacity-25 blur-[90px]"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row w-full h-full">
      {/* Left Sidebar */}
      <aside className="w-full md:w-64 bg-[#0f172a] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col flex-shrink-0 shadow-xl">
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#64748b]">
            Admin Control Console
          </p>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-4 flex flex-row md:flex-col overflow-x-auto gap-2 md:space-y-1">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  relative flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                  transition-all duration-200 text-left overflow-hidden
                  ${isActive
                    ? 'bg-emerald-900/10 text-[#10b981] border-l-4 border-[#10b981]'
                    : 'text-[#94a3b8] hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent'
                  }
                `}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="whitespace-nowrap flex-1">{item.label}</span>
                {item.badge && (
                  <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="hidden md:block px-5 py-4 border-t border-slate-800">
          <p className="text-xs text-[#64748b] leading-relaxed">
            FarmTrust Admin Panel v2.0<br />
            {lastRefreshed && <span>Sync: {lastRefreshed}</span>}
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto w-full md:w-auto p-4 sm:p-8">
        
        {/* Main Content Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#10b981] tracking-tight">
              Admin Control Center
            </h1>
            <p className="text-xs text-[#94a3b8] mt-1 uppercase font-semibold tracking-wider">
              {activeTab === 'users' ? 'Users Management' : 
               activeTab === 'crops' ? 'Crop Listings Management' : 
               `${activeTab} Management`}
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e293b] text-[#94a3b8] hover:bg-slate-800 hover:text-white transition-colors border border-slate-700 shadow-sm text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Render View */}
        <div className="flex-1 w-full">
          {VIEW_MAP[activeTab]}
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────────────────
          MODALS & DIALOGS
          ───────────────────────────────────────────────────────────────────────── */}
      
      {/* 1. Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 text-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-pageSlideFade">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-[#182232]">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" /> Add New User
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-700 rounded transition-colors">
                <X className="w-5 h-5 text-[#94a3b8]" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="Enter email"
                  value={newUser.email}
                  onChange={(e) => { setAddError(''); setNewUser({ ...newUser, email: e.target.value }); }}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Set initial password"
                  value={newUser.password}
                  onChange={(e) => { setAddError(''); setNewUser({ ...newUser, password: e.target.value }); }}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {addError && (
                  <p className="mt-1 text-xs text-red-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {addError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="farmer">Farmer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Status</label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">District</label>
                <select
                  value={newUser.district}
                  onChange={(e) => setNewUser({ ...newUser, district: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {DISTRICTS.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setAddError(''); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-semibold transition-colors"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 text-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-pageSlideFade">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-[#182232]">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-400" /> Edit User
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-slate-700 rounded transition-colors">
                <X className="w-5 h-5 text-[#94a3b8]" />
              </button>
            </div>
            
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => { setEditError(''); setEditingUser({ ...editingUser, email: e.target.value }); }}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {editError && (
                  <p className="mt-1 text-xs text-red-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {editError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="farmer">Farmer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">District</label>
                <select
                  value={editingUser.district}
                  onChange={(e) => setEditingUser({ ...editingUser, district: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {DISTRICTS.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-semibold transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Dialog */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 text-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-pageSlideFade space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-lg text-white">Delete User</h3>
            </div>
            <p className="text-sm text-slate-300">
              Are you sure you want to delete this user? They will be moved to the Trash Bin.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setDeletingUserId(null); setIsDeleteModalOpen(false); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Permanent Delete Confirmation Dialog */}
      {isPermanentDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 text-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-pageSlideFade space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle className="w-6 h-6 flex-shrink-0 animate-bounce" />
              <h3 className="font-bold text-lg text-white">Delete Permanently</h3>
            </div>
            <p className="text-sm text-slate-300 font-medium">
              Are you sure you want to permanently delete this account? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setPermanentDeletingUserId(null); setIsPermanentDeleteModalOpen(false); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-red-900/30"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add Crop Modal */}
      {isAddCropModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 text-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-pageSlideFade">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-[#182232]">
              <h3 className="font-bold text-lg text-white">Add New Crop</h3>
            </div>
            
            <form onSubmit={handleAddCrop} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Crop Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati rice"
                  value={newCrop.name}
                  onChange={(e) => setNewCrop({ ...newCrop, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Category</label>
                <select
                  value={newCrop.category}
                  onChange={(e) => setNewCrop({ ...newCrop, category: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Grain">Grain</option>
                  <option value="Vegetable">Vegetable</option>
                  <option value="Fruit">Fruit</option>
                  <option value="Spice">Spice</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Price</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. $2.45"
                    value={newCrop.price}
                    onChange={(e) => setNewCrop({ ...newCrop, price: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Qty (KG)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 52"
                    value={newCrop.qty}
                    onChange={(e) => setNewCrop({ ...newCrop, qty: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Farmer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. R. Premadasa"
                  value={newCrop.farmerName}
                  onChange={(e) => setNewCrop({ ...newCrop, farmerName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dambulla"
                    value={newCrop.location}
                    onChange={(e) => setNewCrop({ ...newCrop, location: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Listed Date</label>
                  <input
                    type="text"
                    required
                    placeholder="Jun 4"
                    value={newCrop.listed}
                    onChange={(e) => setNewCrop({ ...newCrop, listed: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCropModalOpen(false)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-semibold transition-colors text-white shadow-lg shadow-emerald-500/20"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Crop Modal */}
      {isDeleteCropModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 text-white rounded-2xl w-full max-w-sm shadow-2xl p-8 animate-pageSlideFade space-y-4">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">
                Delete {crops.find(c => c.id === deletingCropId)?.name} permanently?
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                This crop and all its data will be removed forever and cannot be recovered.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-6">
              <button
                onClick={() => { setDeletingCropId(null); setIsDeleteCropModalOpen(false); }}
                className="px-4 py-2.5 bg-transparent border border-slate-700 hover:bg-slate-800 rounded-xl text-sm font-semibold transition-colors w-full"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCrop}
                className="px-4 py-2.5 bg-transparent border border-slate-700 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 rounded-xl text-sm font-semibold transition-colors w-full"
              >
                Delete forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Edit Crop Modal */}
      {isEditCropModalOpen && editingCrop && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 text-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-pageSlideFade">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-[#182232]">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-400" /> Edit Crop
              </h3>
              <button onClick={() => setIsEditCropModalOpen(false)} className="p-1 hover:bg-slate-700 rounded transition-colors">
                <X className="w-5 h-5 text-[#94a3b8]" />
              </button>
            </div>
            
            <form onSubmit={handleEditCrop} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Crop Name</label>
                <input
                  type="text"
                  required
                  value={editingCrop.name}
                  onChange={(e) => setEditingCrop({ ...editingCrop, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Category</label>
                <select
                  value={editingCrop.category}
                  onChange={(e) => setEditingCrop({ ...editingCrop, category: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Grain">Grain</option>
                  <option value="Vegetable">Vegetable</option>
                  <option value="Fruit">Fruit</option>
                  <option value="Spice">Spice</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Price</label>
                  <input
                    type="text"
                    required
                    value={editingCrop.price}
                    onChange={(e) => setEditingCrop({ ...editingCrop, price: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Qty (KG)</label>
                  <input
                    type="text"
                    required
                    value={editingCrop.qty}
                    onChange={(e) => setEditingCrop({ ...editingCrop, qty: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Farmer</label>
                <input
                  type="text"
                  required
                  value={editingCrop.farmerName}
                  onChange={(e) => setEditingCrop({ ...editingCrop, farmerName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={editingCrop.location}
                    onChange={(e) => setEditingCrop({ ...editingCrop, location: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Listed Date</label>
                  <input
                    type="text"
                    required
                    value={editingCrop.listed}
                    onChange={(e) => setEditingCrop({ ...editingCrop, listed: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditCropModalOpen(false)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-semibold transition-colors text-white shadow-lg shadow-emerald-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default AdminPanel;