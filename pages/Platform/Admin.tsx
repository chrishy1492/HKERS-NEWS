
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../../types';
import { MockDB } from '../../services/mockDatabase';
import { Trash2, Edit, Save, Search, RefreshCw, AlertOctagon, Users, UserPlus, Zap, X } from 'lucide-react';

export const Admin: React.FC = () => {
  const { user } = useOutletContext<{ user: User | null }>();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [editUser, setEditUser] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) { navigate('/platform'); return; }
    refreshData();
    // Poll Supabase every 10 seconds for real-time dashboard updates
    const int = setInterval(refreshData, 10000); 
    return () => clearInterval(int);
  }, [user]);

  const refreshData = async () => {
    // These functions now hit Supabase directly for accurate counts
    const allUsers = await MockDB.getUsers();
    const analytics = await MockDB.getAnalytics();
    setUsers(allUsers);
    setStats(analytics);
  };

  const handleUpdateUser = async (id: string) => {
    const currentUser = users.find(u => u.id === id);
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...editData };
    await MockDB.saveUser(updatedUser); 
    setEditUser(null);
    alert("User Updated!");
    refreshData();
  };

  const handleDeleteUser = async (id: string) => {
      if(confirm("DANGER: Delete this user and all their data?")) {
          await MockDB.deleteUser(id);
          refreshData();
      }
  };

  const filteredUsers = users.filter(u => 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.includes(searchQuery)
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs mb-1"><Users size={14}/> TOTAL USERS (DB)</div>
              <div className="text-2xl font-black">{stats?.totalMembers || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
              <div className="flex items-center gap-2 text-green-600 font-bold text-xs mb-1"><UserPlus size={14}/> NEW TODAY</div>
              <div className="text-2xl font-black">{stats?.newMembersToday || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
              <div className="flex items-center gap-2 text-purple-600 font-bold text-xs mb-1"><Zap size={14}/> ACTIVE TODAY</div>
              <div className="text-2xl font-black">{stats?.activeMembersToday || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
              <div className="flex items-center gap-2 text-orange-600 font-bold text-xs mb-1"><AlertOctagon size={14}/> GUESTS (Synced)</div>
              <div className="text-2xl font-black">{stats?.guestsToday || 0}</div>
          </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><AlertOctagon className="text-red-600"/> Admin Control Panel (Live Supabase)</h1>
            <div className="flex gap-2">
                <input placeholder="Search User / ID..." className="border p-2 rounded text-sm w-48 focus:w-64 transition-all" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
                <button onClick={refreshData} className="bg-gray-100 p-2 rounded hover:bg-gray-200"><RefreshCw size={18}/></button>
            </div>
        </div>

        {/* User List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                      <th className="p-3 rounded-l">ID</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Points</th>
                      <th className="p-3 text-right rounded-r">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition">
                          <td className="p-3 font-mono text-xs text-gray-400">{u.id}</td>
                          <td className="p-3">
                              <div className="font-bold">{u.name}</div>
                              <div className="text-xs text-gray-400">{u.email}</div>
                          </td>
                          <td className="p-3">
                              {editUser === u.id ? (
                                  <select value={editData.role || u.role} onChange={e=>setEditData({...editData, role: e.target.value as UserRole})} className="border p-1 rounded">
                                      <option value="USER">User</option>
                                      <option value="MODERATOR">Moderator</option>
                                      <option value="ADMIN">Admin</option>
                                  </select>
                              ) : <span className={`px-2 py-1 rounded text-xs font-bold ${u.role==='ADMIN'?'bg-red-100 text-red-600':u.role==='MODERATOR'?'bg-blue-100 text-blue-600':'bg-gray-100 text-gray-600'}`}>{u.role}</span>}
                          </td>
                          <td className="p-3 font-mono">
                              {editUser === u.id ? <input type="number" value={editData.points ?? u.points} onChange={e=>setEditData({...editData, points: parseInt(e.target.value)})} className="border p-1 w-24 rounded"/> : u.points.toLocaleString()}
                          </td>
                          <td className="p-3 flex justify-end gap-2">
                              {editUser === u.id ? (
                                  <>
                                      <button onClick={()=>setEditUser(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={16}/></button>
                                      <button onClick={()=>handleUpdateUser(u.id)} className="p-1 text-green-600 hover:text-green-700"><Save size={16}/></button>
                                  </>
                              ) : (
                                  <button onClick={()=>{setEditUser(u.id); setEditData({});}} className="p-1 text-blue-400 hover:text-blue-600"><Edit size={16}/></button>
                              )}
                              <button onClick={()=>handleDeleteUser(u.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
