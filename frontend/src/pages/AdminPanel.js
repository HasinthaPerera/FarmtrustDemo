import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Wheat, Banknote, ShieldCheck, LayoutDashboard, Settings, RefreshCw,
  Search, ChevronDown, Plus, Pencil, Trash2, MapPin, ChevronRight, X, UserPlus, AlertTriangle
} from 'lucide-react';

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

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
  { id: 'crops', label: 'Crops', icon: <Wheat className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

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

  // Users local state initialized to match the screenshot
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'albat',
      email: 'ainstain1234@gmail.com',
      role: 'buyer',
      status: 'active',
      registeredDate: 'May 20, 2026',
      district: 'Colombo'
    },
    {
      id: 2,
      name: 'FarmTrust Admin',
      email: 'admin@farmtrust.com',
      role: 'admin',
      status: 'active',
      registeredDate: 'May 20, 2026',
      district: 'Colombo'
    },
    {
      id: 3,
      name: 'John Farmer',
      email: 'farmer@farmtrust.com',
      role: 'farmer',
      status: 'active',
      registeredDate: 'May 20, 2026',
      district: 'Anuradhapura'
    },
    {
      id: 4,
      name: 'Sarah Buyer',
      email: 'buyer@farmtrust.com',
      role: 'buyer',
      status: 'active',
      registeredDate: 'May 20, 2026',
      district: 'Kandy'
    },
    {
      id: 5,
      name: 'Banuka',
      email: 'banuka@gmail.com',
      role: 'farmer',
      status: 'active',
      registeredDate: 'May 19, 2026',
      district: 'Gampaha'
    }
  ]);

  // Crops local state
  const [crops, setCrops] = useState([
    { id: 'CRP-001', name: 'Basmati Rice', isOrganic: true, category: 'Grain', status: 'Active', price: '$2.40', qty: '5,200', farmerInitials: 'RP', farmerName: 'R. Perera', farmerColor: 'bg-blue-900 text-blue-200', location: 'Polonnaruwa', listed: 'May 12' },
    { id: 'CRP-002', name: 'Red Onion', isOrganic: false, category: 'Vegetable', status: 'Active', price: '$1.10', qty: '3,100', farmerInitials: 'AS', farmerName: 'A. Silva', farmerColor: 'bg-green-900 text-green-200', location: 'Dambulla', listed: 'May 14' },
    { id: 'CRP-003', name: 'Cinnamon', isOrganic: true, category: 'Spice', status: 'Pending', price: '$18.50', qty: '420', farmerInitials: 'NF', farmerName: 'N. Fernando', farmerColor: 'bg-purple-900 text-purple-200', location: 'Matale', listed: 'May 15' },
    { id: 'CRP-004', name: 'Pineapple', isOrganic: false, category: 'Fruit', status: 'Active', price: '$0.85', qty: '8,700', farmerInitials: 'SW', farmerName: 'S. Wickrama', farmerColor: 'bg-orange-900 text-orange-200', location: 'Kurunegala', listed: 'May 10' },
    { id: 'CRP-005', name: 'Black Pepper', isOrganic: false, category: 'Spice', status: 'Inactive', price: '$9.20', qty: '210', farmerInitials: 'KJ', farmerName: 'K. Jayawardena', farmerColor: 'bg-blue-900 text-blue-200', location: 'Kandy', listed: 'Apr 28' },
    { id: 'CRP-006', name: 'Mango', isOrganic: true, category: 'Fruit', status: 'Active', price: '$1.65', qty: '6,400', farmerInitials: 'DB', farmerName: 'D. Bandara', farmerColor: 'bg-green-900 text-green-200', location: 'Gampola', listed: 'May 13' },
    { id: 'CRP-007', name: 'Maize', isOrganic: false, category: 'Grain', status: 'Pending', price: '$0.55', qty: '12,000', farmerInitials: 'LR', farmerName: 'L. Rathnayake', farmerColor: 'bg-blue-900 text-blue-200', location: 'Anuradhapura', listed: 'May 16' },
    { id: 'CRP-008', name: 'Bitter Gourd', isOrganic: true, category: 'Vegetable', status: 'Active', price: '$0.90', qty: '1,800', farmerInitials: 'MK', farmerName: 'M. Kumara', farmerColor: 'bg-pink-900 text-pink-200', location: 'Colombo', listed: 'May 11' },
  ]);

  // Dashboard metrics
  const metrics = {
    totalUsers: users.length,
    activeCrops: crops.filter(c => c.status === 'Active').length,
    transactions: '$14,920',
    platformHealth: '99.9%'
  };

  // Search & Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('Active Only'); // Defaults to Active Only in mockup

  const [cropSearchQuery, setCropSearchQuery] = useState('');
  const [cropStatusFilter, setCropStatusFilter] = useState('All Status');
  const [cropCategoryFilter, setCropCategoryFilter] = useState('All Categories');

  // Modals management states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'buyer', status: 'active', district: 'Colombo' });
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefreshed(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }, 600);
  };

  // User Action Handlers
  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const createdUser = {
      id: Date.now(),
      ...newUser,
      registeredDate: formattedDate
    };

    setUsers([createdUser, ...users]);
    setNewUser({ name: '', email: '', role: 'buyer', status: 'active', district: 'Colombo' });
    setIsAddModalOpen(false);
  };

  const handleEditUser = (e) => {
    e.preventDefault();
    if (!editingUser.name || !editingUser.email) return;

    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
    setIsEditModalOpen(false);
  };

  const handleDeleteUser = () => {
    setUsers(users.filter(u => u.id !== deletingUserId));
    setDeletingUserId(null);
    setIsDeleteModalOpen(false);
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
    const filteredUsers = users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = 
        roleFilter === 'All Roles' || 
        user.role.toLowerCase() === roleFilter.toLowerCase();
      
      const matchesStatus = 
        statusFilter === 'All Statuses' || 
        (statusFilter === 'Active Only' && user.status === 'active') || 
        (statusFilter === 'Inactive Only' && user.status === 'inactive');

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
              placeholder="Search users by name or email..."
              className="block w-full pl-10 pr-4 py-2 bg-[#0f172a] border border-slate-700/70 rounded-lg text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex w-full md:w-auto items-center gap-3">
            {/* Roles Filter Dropdown */}
            <div className="relative w-full md:w-40">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700/70 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
              >
                <option value="All Roles">All Roles</option>
                <option value="buyer">Buyer</option>
                <option value="farmer">Farmer</option>
                <option value="admin">Admin</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-[#94a3b8]" />
              </div>
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative w-full md:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700/70 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Active Only">Active Only</option>
                <option value="Inactive Only">Inactive Only</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-[#94a3b8]" />
              </div>
            </div>

            {/* Add User Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" /> Add User
            </button>
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-[#64748b]">
                      No users found matching filters.
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
                          user.status === 'active' 
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' 
                            : 'bg-rose-950/40 text-rose-400 border border-rose-900/50'
                        }`}>
                          {user.status}
                        </span>
                      </td>

                      {/* REGISTERED DATE */}
                      <td className="px-6 py-4 text-[#94a3b8] text-sm">{user.registeredDate}</td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4">
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

  // 3. Crops View (Styled with dark theme)
  const CropsView = () => (
    <div className="bg-[#1e293b]/70 border border-slate-700/50 backdrop-blur-md rounded-2xl p-6 text-slate-300 transition-colors shadow-lg animate-pageSlideFade">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-1">Crop Listings Management</h3>
        <p className="text-[#94a3b8] text-sm">Review and manage all crop listings on the platform.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex flex-col sm:flex-row flex-1 gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#94a3b8]" />
            </div>
            <input
              type="text"
              placeholder="Search by crop, farmer, location..."
              value={cropSearchQuery}
              onChange={(e) => setCropSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-[#0f172a] border border-slate-700/70 rounded-lg text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
          <div className="relative">
            <select
              value={cropStatusFilter}
              onChange={(e) => setCropStatusFilter(e.target.value)}
              className="flex items-center gap-2 bg-[#0f172a] border border-slate-700/70 text-white px-4 py-2 rounded-lg text-sm appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer pr-8"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#94a3b8] absolute right-3 top-3 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={cropCategoryFilter}
              onChange={(e) => setCropCategoryFilter(e.target.value)}
              className="flex items-center gap-2 bg-[#0f172a] border border-slate-700/70 text-white px-4 py-2 rounded-lg text-sm appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer pr-8"
            >
              <option value="All Categories">All Categories</option>
              <option value="Grain">Grain</option>
              <option value="Vegetable">Vegetable</option>
              <option value="Fruit">Fruit</option>
              <option value="Spice">Spice</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#94a3b8] absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-slate-700/50 rounded-xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#1e293b]/90 border-b border-slate-700/50">
            <tr>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Crop</th>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Price</th>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Qty (KG)</th>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Farmer</th>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 font-bold text-[#94a3b8] text-xs uppercase tracking-wider">Listed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {crops
              .filter(c => {
                const matchesSearch = c.name.toLowerCase().includes(cropSearchQuery.toLowerCase()) || c.farmerName.toLowerCase().includes(cropSearchQuery.toLowerCase()) || c.location.toLowerCase().includes(cropSearchQuery.toLowerCase());
                const matchesStatus = cropStatusFilter === 'All Status' || c.status === cropStatusFilter;
                const matchesCategory = cropCategoryFilter === 'All Categories' || c.category === cropCategoryFilter;
                return matchesSearch && matchesStatus && matchesCategory;
              })
              .map((crop) => (
                <tr key={crop.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">{crop.name}</td>
                  <td className="px-6 py-4 text-[#94a3b8]">{crop.category}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                      crop.status === 'Active' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' : 
                      crop.status === 'Pending' ? 'bg-amber-950/40 text-amber-500 border border-amber-900/50' : 
                      'bg-slate-800 text-[#94a3b8] border border-slate-700'
                    }`}>
                      {crop.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{crop.price} <span className="text-slate-500 text-xs">/kg</span></td>
                  <td className="px-6 py-4">{crop.qty}</td>
                  <td className="px-6 py-4">{crop.farmerName}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[#94a3b8]">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{crop.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#94a3b8]">{crop.listed}</td>
                </tr>
              ))}
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

  const VIEW_MAP = {
    dashboard: <DashboardView />,
    users: <UsersView />,
    crops: <CropsView />,
    settings: <SettingsView />,
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0b0f19] flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Left Sidebar */}
      <aside className="w-full md:w-64 bg-[#0f172a] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col flex-shrink-0 shadow-xl">
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#64748b]">
            Admin Control Console
          </p>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-4 flex flex-row md:flex-col overflow-x-auto gap-2 md:space-y-1">
          {NAV_ITEMS.map(item => {
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
                <span className="whitespace-nowrap">{item.label}</span>
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
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
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
                  onClick={() => setIsAddModalOpen(false)}
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
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
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
              Are you sure you want to delete this user? This action is permanent and cannot be undone.
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

    </div>
  );
};

export default AdminPanel;