import React, { useState } from 'react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const stats = [
    { label: 'Total Users', value: '1,234', icon: '👥', color: 'bg-blue-100 text-blue-600' },
    { label: 'Active Crops', value: '456', icon: '🌾', color: 'bg-green-100 text-green-600' },
    { label: 'Transactions', value: '$12,890', icon: '💰', color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Platform Health', value: '99.9%', icon: '✨', color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-primary-900 dark:text-primary-400">Admin Control Center</h1>
          <button className="btn-secondary">Refresh</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="glass-card dark:bg-slate-800 dark:border dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted dark:text-slate-400 text-sm mb-2">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <div className="flex space-x-1 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-3 px-6 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'dashboard'
                  ? 'border-primary-600 text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-6 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'users'
                  ? 'border-primary-600 text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              👥 Users
            </button>
            <button
              onClick={() => setActiveTab('crops')}
              className={`py-3 px-6 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'crops'
                  ? 'border-primary-600 text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              🌾 Crops
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 px-6 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'settings'
                  ? 'border-primary-600 text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>

        <div className="card-lg dark:bg-slate-800 dark:border dark:border-slate-700">
          {activeTab === 'dashboard' && (
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">System Overview</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Platform Performance</p>
                    <p className="text-slate-600 dark:text-slate-400">All systems operational. No active alerts.</p>
                  </div>
                  <span className="badge badge-success">Good</span>
                </div>
                <div className="divider"></div>
                <div className="flex items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Database Status</p>
                    <p className="text-slate-600 dark:text-slate-400">MongoDB connection stable. 45GB used.</p>
                  </div>
                  <span className="badge badge-success">Connected</span>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User Management</h3>
                <button className="btn-primary">Add User</button>
              </div>
              <p className="text-slate-600 dark:text-slate-400">View and manage all registered users and their permissions.</p>
            </div>
          )}
          {activeTab === 'crops' && (
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Crop Listings Management</h3>
              <p className="text-slate-600 dark:text-slate-400">Review and manage all crop listings on the platform.</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">System Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="form-label dark:text-slate-300">Platform Name</label>
                  <input type="text" defaultValue="FarmTrust" className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                </div>
                <div>
                  <label className="form-label dark:text-slate-300">Commission Rate (%)</label>
                  <input type="number" defaultValue="5" className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                </div>
                <button className="btn-primary">Save Settings</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;