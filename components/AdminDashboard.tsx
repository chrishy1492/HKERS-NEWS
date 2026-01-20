import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '../constants';

interface AdminDashboardProps {
  userProfile: UserProfile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userProfile }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize Admin Client for privileged operations
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  useEffect(() => {
    if (userProfile.role === 'admin') {
      fetchUsers();

      // Realtime subscription for admin panel to see new users/points instantly
      const channel = supabase.channel('admin_users')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
           // Handle Insert/Update
           if (payload.eventType === 'INSERT') {
              setUsers(prev => [payload.new as UserProfile, ...prev]);
           } else if (payload.eventType === 'UPDATE') {
              setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new as UserProfile : u));
           } else if (payload.eventType === 'DELETE') {
              setUsers(prev => prev.filter(u => u.id !== payload.old.id));
           }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      }
    }
  }, [userProfile]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await adminClient.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as UserProfile[]);
    if (error) alert('Admin Access Error: ' + error.message);
    setLoading(false);
  };

  const updatePoints = async (id: string, current: number) => {
    const newVal = prompt("New Point Balance:", current.toString());
    if (newVal) {
      const { error } = await adminClient.from('profiles').update({ hker_token: parseInt(newVal) }).eq('id', id);
      if (!error) {
        // Optimistic update
        setUsers(users.map(u => u.id === id ? { ...u, hker_token: parseInt(newVal) } : u));
      } else alert(error.message);
    }
  };

  const deleteUser = async (id: string) => {
    if (confirm("Delete this user? This cannot be undone.")) {
       const { error } = await adminClient.from('profiles').delete().eq('id', id);
       if (!error) {
         setUsers(users.filter(u => u.id !== id));
       } else alert(error.message);
    }
  };

  if (userProfile.role !== 'admin') return <div className="p-10 text-center text-red-500">Access Denied</div>;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Admin Control Panel</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow border border-gray-100">
          <div className="text-gray-500">Total Users</div>
          <div className="text-2xl font-bold">{users.length}</div>
        </div>
        <div className="bg-white p-4 rounded shadow border border-gray-100">
          <div className="text-gray-500">New Today</div>
          <div className="text-2xl font-bold text-green-600">
             {users.filter(u => new Date(u.created_at || '').toDateString() === new Date().toDateString()).length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? <div className="p-4">Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-bold">{u.full_name}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                      <div className="text-xs text-slate-400 font-mono">{u.id}</div>
                    </td>
                    <td className="p-4 font-mono">{u.hker_token.toLocaleString()}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{u.role}</span></td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => updatePoints(u.id, u.hker_token)} className="text-blue-600 hover:underline text-sm bg-blue-50 px-2 py-1 rounded">Edit Pts</button>
                      {u.role !== 'admin' && <button onClick={() => deleteUser(u.id)} className="text-red-600 hover:underline text-sm bg-red-50 px-2 py-1 rounded">Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;