import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import {
  Users, Wheat, Banknote, ShieldCheck, LayoutDashboard, Settings, RefreshCw,
  Search, ChevronDown, Plus, Check, Pencil, Eye, Trash2, MapPin, ChevronRight,
  Carrot, Apple, Sprout, Flame, Leaf, Citrus
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Default (loading) state — null values trigger the skeleton loader in the UI.
// Shape mirrors the API response: GET /api/admin/metrics → { data: { ... } }
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_METRICS = {
  totalUsers: null,
  activeCrops: null,
  transactions: null,
  platformHealth: null,
};

// Ordered card definitions — icon/label/color are static; values come from state.
const METRIC_CARDS = [
  { key: 'totalUsers', label: 'Total Users', icon: <Users className="w-6 h-6" />, color: 'bg-blue-100   text-blue-600' },
  { key: 'activeCrops', label: 'Active Crops', icon: <Wheat className="w-6 h-6" />, color: 'bg-green-100  text-green-600' },
  { key: 'transactions', label: 'Transactions', icon: <Banknote className="w-6 h-6" />, color: 'bg-yellow-100 text-yellow-600' },
  { key: 'platformHealth', label: 'Platform Health', icon: <ShieldCheck className="w-6 h-6" />, color: 'bg-purple-100 text-purple-600' },
];

const RECENT_ACTIVITY = [
  { id: 1, event: 'New Farmer Registered', actor: 'Ravi Kumar', time: '2 min ago', status: 'success' },
  { id: 2, event: "Crop 'Tomato' Listed", actor: 'Priya Sharma', time: '14 min ago', status: 'info' },
  { id: 3, event: 'Transaction #1024 Completed', actor: 'System', time: '31 min ago', status: 'success' },
  { id: 4, event: 'New Buyer Account Activated', actor: 'Arjun Mehta', time: '1 hr ago', status: 'info' },
  { id: 5, event: 'Failed Login Attempt Blocked', actor: 'unknown@test.com', time: '2 hr ago', status: 'warning' },
];

const STATUS_STYLES = {
  success: 'bg-green-100  text-green-700  dark:bg-green-900/40  dark:text-green-300',
  info: 'bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
};

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar nav items
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
  { id: 'crops', label: 'Crops', icon: <Wheat className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

const MOCK_CROPS = [
  { id: 'CRP-001', name: 'Basmati Rice', isOrganic: true, icon: <Wheat className="w-5 h-5 text-amber-500" />, category: 'Grain', status: 'Active', price: '$2.40', qty: '5,200', farmerInitials: 'RP', farmerName: 'R. Perera', farmerColor: 'bg-blue-900 text-blue-200', location: 'Polonnaruwa', listed: 'May 12' },
  { id: 'CRP-002', name: 'Red Onion', isOrganic: false, icon: <Carrot className="w-5 h-5 text-rose-500" />, category: 'Vegetable', status: 'Active', price: '$1.10', qty: '3,100', farmerInitials: 'AS', farmerName: 'A. Silva', farmerColor: 'bg-green-900 text-green-200', location: 'Dambulla', listed: 'May 14' },
  { id: 'CRP-003', name: 'Cinnamon', isOrganic: true, icon: <Leaf className="w-5 h-5 text-amber-700" />, category: 'Spice', status: 'Pending', price: '$18.50', qty: '420', farmerInitials: 'NF', farmerName: 'N. Fernando', farmerColor: 'bg-purple-900 text-purple-200', location: 'Matale', listed: 'May 15' },
  { id: 'CRP-004', name: 'Pineapple', isOrganic: false, icon: <Citrus className="w-5 h-5 text-yellow-500" />, category: 'Fruit', status: 'Active', price: '$0.85', qty: '8,700', farmerInitials: 'SW', farmerName: 'S. Wickrama', farmerColor: 'bg-orange-900 text-orange-200', location: 'Kurunegala', listed: 'May 10' },
  { id: 'CRP-005', name: 'Black Pepper', isOrganic: false, icon: <Flame className="w-5 h-5 text-slate-800 dark:text-slate-400" />, category: 'Spice', status: 'Inactive', price: '$9.20', qty: '210', farmerInitials: 'KJ', farmerName: 'K. Jayawardena', farmerColor: 'bg-blue-900 text-blue-200', location: 'Kandy', listed: 'Apr 28' },
  { id: 'CRP-006', name: 'Mango', isOrganic: true, icon: <Apple className="w-5 h-5 text-orange-500" />, category: 'Fruit', status: 'Active', price: '$1.65', qty: '6,400', farmerInitials: 'DB', farmerName: 'D. Bandara', farmerColor: 'bg-green-900 text-green-200', location: 'Gampola', listed: 'May 13' },
  { id: 'CRP-007', name: 'Maize', isOrganic: false, icon: <Wheat className="w-5 h-5 text-yellow-600" />, category: 'Grain', status: 'Pending', price: '$0.55', qty: '12,000', farmerInitials: 'LR', farmerName: 'L. Rathnayake', farmerColor: 'bg-blue-900 text-blue-200', location: 'Anuradhapura', listed: 'May 16' },
  { id: 'CRP-008', name: 'Bitter Gourd', isOrganic: true, icon: <Sprout className="w-5 h-5 text-green-600" />, category: 'Vegetable', status: 'Active', price: '$0.90', qty: '1,800', farmerInitials: 'MK', farmerName: 'M. Kumara', farmerColor: 'bg-pink-900 text-pink-200', location: 'Colombo', listed: 'May 11' },
];

// ─────────────────────────────────────────────────────────────────────────────
// AdminPanel Component
// ─────────────────────────────────────────────────────────────────────────────
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  // ── Data fetching — secured with the JWT token stored on login ───────────
  const fetchSystemMetrics = async () => {
    setMetricsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await client.get('/admin/metrics', {
        headers: {
          'x-auth-token': token || '',
        },
      });

      const json = res.data;
      setMetrics(json.data);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('[AdminPanel] fetchSystemMetrics error:', err.message);
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemMetrics();
  }, []);

  const handleRefresh = () => {
    fetchSystemMetrics();
  };

  // Reusable action buttons for crop rows (standard SVG icons, styled round as in local changes)
  const ActionButtons = () => (
    <div className="flex items-center gap-2">
      <button
        title="Approve"
        className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 bg-white text-green-600 shadow-sm hover:bg-slate-50 transition-colors duration-150 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-green-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>
      <button
        title="Edit"
        className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition-colors duration-150 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M4 20l4-1 9-9-3.536-3.536-9 9L4 20z" />
        </svg>
      </button>
      <button
        title="View"
        className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition-colors duration-150 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
      <button
        title="Delete"
        className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 bg-white text-red-500 shadow-sm hover:bg-slate-50 transition-colors duration-150 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-red-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22" />
        </svg>
      </button>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Sub-views
  // ─────────────────────────────────────────────────────────────────────────
  const DashboardView = () => (
    <div>
      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {METRIC_CARDS.map(card => (
          <div key={card.key} className="glass-card dark:bg-slate-800 dark:border dark:border-slate-700/50 hover:-translate-y-0.5 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{card.label}</p>
                {metricsLoading || metrics[card.key] === null ? (
                  <div className="h-7 w-20 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{metrics[card.key]}</p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Overview card */}
      <div className="card-lg dark:bg-slate-800 dark:border dark:border-slate-700 mb-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">System Overview</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Platform Performance</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">All systems operational. No active alerts.</p>
            </div>
            <span className="badge badge-success ml-4">Good</span>
          </div>
          <div className="divider dark:border-slate-700"></div>
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Database Status</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">MySQL connection stable. 45 GB used.</p>
            </div>
            <span className="badge badge-success ml-4">Connected</span>
          </div>
        </div>
      </div>

      {/* ── Recent Platform Activity ────────────────────────────────────── */}
      <div className="card-lg dark:bg-slate-800 dark:border dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recent Platform Activity</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Last 24 hours</span>
        </div>

        {/* Table wrapper */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/60 text-left">
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 w-8">#</th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Event</th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Actor</th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Time</th>
                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {RECENT_ACTIVITY.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors duration-150"
                >
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500 font-mono">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{item.event}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.actor}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{item.time}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge text-xs capitalize ${STATUS_STYLES[item.status]}`}>
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

  const UsersView = () => (
    <div className="card-lg dark:bg-slate-800 dark:border dark:border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">User Management</h3>
        <Link to="/login" className="btn-primary">Add User</Link>
      </div>
      <p className="text-slate-600 dark:text-slate-400">
        View and manage all registered users and their permissions.
      </p>
    </div>
  );

  const CropsView = () => (
    <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-[#1e293b] p-6 text-slate-700 dark:text-slate-300 transition-colors">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Crop Listings Management</h3>
        <p className="text-slate-500 dark:text-[#64748b] text-sm">Review and manage all crop listings on the platform.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex flex-col sm:flex-row flex-1 gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 dark:text-[#475569]" />
            </div>
            <input
              type="text"
              placeholder="Search by crop, farmer, location..."
              className="block w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] rounded-lg text-sm placeholder-slate-400 dark:placeholder-[#475569] text-slate-900 dark:text-slate-200 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
            />
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-green-700">
            Search
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
          <div className="relative">
            <button 
              key={statusFilter}
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className="animate-shudder flex items-center gap-2 bg-white dark:bg-[#1e293b] hover:bg-slate-50 dark:hover:bg-[#334155] border border-slate-200 dark:border-[#334155] text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {statusFilter} <ChevronDown className="w-4 h-4 text-slate-400 dark:text-[#475569]" />
            </button>
            {statusDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-32 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] rounded-lg shadow-lg overflow-hidden z-20">
                <button onClick={() => { setStatusFilter('All Status'); setStatusDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] hover:text-slate-900 dark:hover:text-white transition-colors">All Status</button>
                <button onClick={() => { setStatusFilter('Active'); setStatusDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] hover:text-slate-900 dark:hover:text-white transition-colors">Active</button>
                <button onClick={() => { setStatusFilter('Pending'); setStatusDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] hover:text-slate-900 dark:hover:text-white transition-colors">Pending</button>
                <button onClick={() => { setStatusFilter('Inactive'); setStatusDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] hover:text-slate-900 dark:hover:text-white transition-colors">Inactive</button>
              </div>
            )}
          </div>
          <div className="relative">
            <button 
              key={categoryFilter}
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="animate-shudder flex items-center gap-2 bg-white dark:bg-[#1e293b] hover:bg-slate-50 dark:hover:bg-[#334155] border border-slate-200 dark:border-[#334155] text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {categoryFilter} <ChevronDown className="w-4 h-4 text-slate-400 dark:text-[#475569]" />
            </button>
            {categoryDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-36 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] rounded-lg shadow-lg overflow-hidden z-20">
                <button onClick={() => { setCategoryFilter('All Categories'); setCategoryDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] hover:text-slate-900 dark:hover:text-white transition-colors">All Categories</button>
                <button onClick={() => { setCategoryFilter('Grain'); setCategoryDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] hover:text-slate-900 dark:hover:text-white transition-colors">Grain</button>
                <button onClick={() => { setCategoryFilter('Vegetable'); setCategoryDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] hover:text-slate-900 dark:hover:text-white transition-colors">Vegetable</button>
                <button onClick={() => { setCategoryFilter('Fruit'); setCategoryDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] hover:text-slate-900 dark:hover:text-white transition-colors">Fruit</button>
                <button onClick={() => { setCategoryFilter('Spice'); setCategoryDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] hover:text-slate-900 dark:hover:text-white transition-colors">Spice</button>
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] text-[#022c22] font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            <Plus className="w-4 h-4" /> Add Listing
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-[#1e293b] rounded-lg">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-[#1e293b] transition-colors">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-500 dark:text-[#475569] text-xs uppercase tracking-wider">Crop</th>
              <th className="px-6 py-4 font-semibold text-slate-500 dark:text-[#475569] text-xs uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 font-semibold text-slate-500 dark:text-[#475569] text-xs uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-500 dark:text-[#475569] text-xs uppercase tracking-wider cursor-pointer group">
                Price <span className="opacity-0 group-hover:opacity-100 ml-1">↕</span>
              </th>
              <th className="px-6 py-4 font-semibold text-slate-500 dark:text-[#475569] text-xs uppercase tracking-wider cursor-pointer group">
                Qty (KG) <span className="opacity-0 group-hover:opacity-100 ml-1">↕</span>
              </th>
              <th className="px-6 py-4 font-semibold text-slate-500 dark:text-[#475569] text-xs uppercase tracking-wider">Farmer</th>
              <th className="px-6 py-4 font-semibold text-slate-500 dark:text-[#475569] text-xs uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 font-semibold text-slate-500 dark:text-[#475569] text-xs uppercase tracking-wider">Listed</th>
              <th className="px-6 py-4 font-semibold text-slate-500 dark:text-[#475569] text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]">
            {MOCK_CROPS.filter(crop => 
              (statusFilter === 'All Status' || crop.status === statusFilter) && 
              (categoryFilter === 'All Categories' || crop.category === categoryFilter)
            ).map((crop) => (
              <tr key={crop.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#1e293b] flex items-center justify-center text-slate-500 dark:text-[#94a3b8] transition-colors">
                      {crop.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-200">{crop.name}</span>
                        {crop.isOrganic && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-[#064e3b] text-emerald-700 dark:text-[#34d399] text-[10px] font-medium border border-emerald-200 dark:border-[#065f46]">
                            Organic
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-[#475569]">{crop.id}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-[#94a3b8]">{crop.category}</td>
                <td className="px-6 py-4">
                  {crop.status === 'Active' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-[#064e3b]/50 text-emerald-700 dark:text-[#34d399] text-xs font-medium border border-emerald-200 dark:border-[#065f46]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#10b981]"></span> Active
                    </span>
                  )}
                  {crop.status === 'Pending' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-[#422006]/80 text-amber-700 dark:text-[#fbbf24] text-xs font-medium border border-amber-200 dark:border-[#78350f]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-[#f59e0b]"></span> Pending
                    </span>
                  )}
                  {crop.status === 'Inactive' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-[#94a3b8] text-xs font-medium border border-slate-200 dark:border-[#334155]">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-[#64748b]"></span> Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                  {crop.price}<span className="text-slate-500 dark:text-[#475569] font-normal text-xs"> /kg</span>
                </td>
                <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{crop.qty}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${crop.farmerColor}`}>
                      {crop.farmerInitials}
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 text-sm">{crop.farmerName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#94a3b8]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{crop.location}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-[#94a3b8]">{crop.listed}</td>
                <td className="px-6 py-4 text-right">
                  <ActionButtons />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm text-slate-500 dark:text-[#475569]">Showing 1-8 of 24 listings</span>
        <div className="flex items-center gap-1 text-sm">
          <button className="w-8 h-8 flex items-center justify-center rounded bg-[#4ade80] text-[#022c22] font-semibold">1</button>
          <button className="w-8 h-8 flex items-center justify-center rounded bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors border border-slate-200 dark:border-[#1e293b]">2</button>
          <button className="w-8 h-8 flex items-center justify-center rounded bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors border border-slate-200 dark:border-[#1e293b]">3</button>
          <button className="w-8 h-8 flex items-center justify-center rounded bg-white dark:bg-[#1e293b] text-slate-400 dark:text-[#94a3b8] hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors border border-slate-200 dark:border-[#1e293b]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const SettingsView = () => (
    <div className="card-lg dark:bg-slate-800 dark:border dark:border-slate-700">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">System Settings</h3>
      <div className="space-y-6">
        <div>
          <label className="form-label dark:text-slate-300">Platform Name</label>
          <input type="text" defaultValue="FarmTrust" className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
        </div>
        <div>
          <label className="form-label dark:text-slate-300">Commission Rate (%)</label>
          <input type="number" defaultValue="5" className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
        </div>
        <button className="btn-primary w-full md:w-auto">Save Settings</button>
      </div>
    </div>
  );

  const VIEW_MAP = {
    dashboard: <DashboardView />,
    users: <UsersView />,
    crops: <CropsView />,
    settings: <SettingsView />,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex flex-col md:flex-row">

      {/* ── Left Sidebar ───────────────────────────────────────────────── */}
      <aside className="w-full md:w-64 h-auto md:min-h-screen bg-white dark:bg-slate-800 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-sm flex-shrink-0">
        {/* Sidebar brand strip */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Admin Console
          </p>
        </div>

        {/* Nav items */}
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
                    ? 'bg-primary-50/50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }
                `}
              >
                {isActive && (
                  <span className="hidden md:block absolute left-0 top-0 bottom-0 w-1.5 bg-primary-600 dark:bg-primary-400 rounded-r-md" />
                )}
                {isActive && (
                  <span className="block md:hidden absolute bottom-0 left-0 right-0 h-1.5 bg-primary-600 dark:bg-primary-400 rounded-t-md" />
                )}
                <span className="text-base leading-none">{item.icon}</span>
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="hidden md:block px-5 py-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            FarmTrust v1.0<br />
            {lastRefreshed && <span>Updated {lastRefreshed}</span>}
          </p>
        </div>
      </aside>

      {/* ── Main Content Area ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto w-full md:w-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-primary-900 dark:text-primary-400 leading-tight">
              Admin Control Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
              {activeTab === 'dashboard' ? 'System overview & recent activity' : 
               activeTab === 'crops' ? null : 
               `${activeTab} management`}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={metricsLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${metricsLoading ? 'animate-spin' : ''}`} />
            {metricsLoading ? 'Refreshing…' : 'Refresh Data'}
          </button>
        </div>

        <div className="flex-1 px-4 sm:px-8 py-4 sm:py-8 w-full">
          {/* ── Active view — stat cards live inside DashboardView only ──── */}
          {VIEW_MAP[activeTab]}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;