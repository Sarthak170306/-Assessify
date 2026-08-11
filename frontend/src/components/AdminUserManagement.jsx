import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Users, Search, RefreshCw, Shield, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminUserManagement() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const headers = {
        'x-clerk-user-id': user?.id || ''
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `${API_BASE_URL}/users?limit=20`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (roleFilter) url += `&role=${encodeURIComponent(roleFilter)}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user, searchTerm, roleFilter]);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      let token = null;
      try { token = await getToken(); } catch (e) {}

      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user?.id || '',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Status toggle error:', err);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> User Directory Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage synchronized PostgreSQL user profiles, roles, and access statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, or clerkId..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="STUDENT">STUDENT</option>
        </select>
      </div>

      {/* User Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-6 text-center text-slate-500">
                  Loading users directory...
                </td>
              </tr>
            ) : usersList.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-6 text-center text-slate-500">
                  No user records found.
                </td>
              </tr>
            ) : (
              usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-slate-100">{u.name || u.email}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                      u.role === 'ADMIN' 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      u.status === 'ACTIVE' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(u.id, u.status)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 inline-flex items-center gap-1"
                    >
                      {u.status === 'ACTIVE' ? (
                        <>
                          <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3.5 h-3.5 text-slate-500" /> Activate
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
