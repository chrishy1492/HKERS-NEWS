
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { User, UserRole, Post, RobotLog } from '../../types';
import { MockDB } from '../../services/mockDatabase';
import { Trash2, Edit, Save, Search, RefreshCw, AlertOctagon, Bot, Activity, Clock, Users, UserPlus, Eye, Shield, BarChart3 } from 'lucide-react';

export const Admin: React.FC = () => {
  const { user } = useOutletContext<{ user: User | null }>();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [robotLogs, setRobotLogs] = useState<RobotLog[]>([]);
  const [showRobotMonitor, setShowRobotMonitor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editUser, setEditUser] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  
  const [analytics, setAnalytics] = useState({
      totalMembers: 0,
      newMembersToday: 0,
      activeMembersToday: 0,
      guestsToday: 0,
      totalVisitsToday: 0
  });

  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) {
      navigate('/platform');
      return;
    }
    refreshData();
    // Fast Polling for Real-time Analytics (2s)
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, [user]);

  const refreshData = async () => {
    // 1. Fetch Cloud Data
    const allUsers = await MockDB.getUsers();
    setUsers(allUsers);
    
    const allPosts = await MockDB.getPosts();
    setPosts(allPosts);
    
    const logs = await MockDB.getRobotLogs();
    setRobotLogs(logs);

    // 2. Fetch Calculated Analytics
    const stats = await MockDB.getAnalytics();
    setAnalytics(stats);
  };

  const handleManualSync = async () => {
      await refreshData();
      alert("資料已即時同步更新！(Data Synced Successfully)");
  };

  const handleUpdateUser = async (id: string) => {
    const currentUser = users.find(u => u.id === id);
    if (!currentUser) return;
    
    if (id === user?.id && editData.role && editData.role !== UserRole.ADMIN) {
        alert("Cannot downgrade your own Admin privileges.");
        return;
    }

    const updatedUser = { ...currentUser, ...editData };
    await MockDB.saveUser(updatedUser); 
    refreshData();
    setEditUser(null);
    setEditData({});
    alert("User updated successfully.");
  };

  const handleDeleteUser = async (id: string) => {
    if (id === user?.id) {
        alert("Cannot delete your own admin account!");
        return;
    }
    if (confirm("Are you sure you want to permanently delete this user and all their data?")) {
        await MockDB.deleteUser(id);
        refreshData();
        alert("User deleted.");
    }
  };

  const handleDeletePost = async (id: string) => {
      if(confirm('Delete this post?')) {
        await MockDB.deletePost(id);
        refreshData();
      }
  };

  const handleGlobalPointReset = async () => {
      const val = prompt("Enter new point value for ALL users:");
      if (val && !isNaN(parseInt(val))) {
          await MockDB.resetAllPoints(parseInt(val));
          refreshData();
          alert("All users points updated.");
      }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.includes(searchQuery)
  );

  return (
    <div className="space-y-8 bg-white p-6 rounded-lg shadow pb-20">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-red-600">Admin Control Panel (Live Sync)</h1>
        <div className="text-sm text-gray-500 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             Cloud Connected: {user?.email}
        </div>
      </div>

      {/* TOOLS & SYNC SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-100 p-4 rounded-lg flex items-center gap-2">
            <Search className="text-gray-500" />
            <input 
                className="bg-transparent outline-none flex-1" 
                placeholder="Search User..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {/* REQUESTED FEATURE: Live Stats Button */}
          <button onClick={handleManualSync} className="bg-indigo-600 text-white p-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg transition transform active:scale-95">
             <BarChart3 size={20} />
             即時查看流量與會員 (Sync Stats)
          </button>
          <button onClick={handleGlobalPointReset} className="bg-red-100 text-red-600 p-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-200">
             <AlertOctagon size={20} /> Mass Reset Points
          </button>
          <button onClick={() => setShowRobotMonitor(!showRobotMonitor)} className={`p-4 rounded-lg font-bold flex items-center justify-center gap-2 transition ${showRobotMonitor ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
             <Bot size={20} /> {showRobotMonitor ? 'Hide Robot Monitor' : '🤖 Robot Monitor'}
          </button>
      </div>

      {/* ANALYTICS DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
              <Users size={28} className="text-blue-500 mb-2" />
              <div className="text-3xl font-black text-blue-700">{analytics.totalMembers}</div>
              <div className="text-xs font-bold text-blue-400 uppercase">已註冊會員 (Total Members)</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center text-center">
              <UserPlus size={28} className="text-green-500 mb-2" />
              <div className="text-3xl font-black text-green-700">+{analytics.newMembersToday}</div>
              <div className="text-xs font-bold text-green-400 uppercase">今天新註冊 (New Today)</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col items-center justify-center text-center">
              <Activity size={28} className="text-purple-500 mb-2" />
              <div className="text-3xl font-black text-purple-700">{analytics.activeMembersToday}</div>
              <div className="text-xs font-bold text-purple-400 uppercase">今天到訪會員 (Member Visits)</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col items-center justify-center text-center">
              <Eye size={28} className="text-orange-500 mb-2" />
              <div className="text-3xl font-black text-orange-700">{analytics.guestsToday}</div>
              <div className="text-xs font-bold text-orange-400 uppercase">今天到訪遊客 (Guest Visits)</div>
          </div>
      </div>

      {/* ROBOT MONITOR SECTION */}
      {showRobotMonitor && (
        <div className="bg-slate-900 text-green-400 p-6 rounded-xl font-mono shadow-2xl border-2 border-green-900 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4 border-b border-green-800 pb-2">
                <h2 className="text-lg font-bold flex items-center gap-2"><Activity /> AUTOMATED ROBOT LOGS (Cloud)</h2>
                <div className="text-xs text-green-600">Refreshed: {new Date().toLocaleTimeString()}</div>
            </div>
            <div className="h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {robotLogs.map(log => (
                    <div key={log.id} className="text-xs border-b border-green-900/30 pb-1">
                        <span className="text-gray-500">[{new Date(log.timestamp).toLocaleString()}]</span>
                        <span className={`ml-2 font-bold ${log.action === 'ERROR' ? 'text-red-500' : log.action === 'CLEANUP' ? 'text-yellow-400' : 'text-blue-300'}`}>[{log.action}]</span>
                        {log.region && <span className="ml-2 bg-green-900 text-green-100 px-1 rounded text-[10px]">{log.region}</span>}
                        <span className="ml-2 text-white">{log.details}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* User Table (Enhanced) */}
      <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 bg-gray-50 border-b font-bold flex justify-between items-center">
            <span className="flex items-center gap-2 text-lg"><Users size={20}/> 註冊會員列表 (Member List) - {filteredUsers.length}</span>
            <button onClick={refreshData} className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"><RefreshCw size={14} /> Auto-Syncing...</button>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-bold">
                    <tr>
                        <th className="p-4 text-left">Identity (ID / Name)</th>
                        <th className="p-4 text-left">Contact / Address</th>
                        <th className="p-4 text-left">Role / Activity</th>
                        <th className="p-4 text-left">Points</th>
                        <th className="p-4 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-blue-50 transition-colors">
                            <td className="p-4">
                                {editUser === u.id ? (
                                    <input className="border p-2 rounded w-full mb-1" placeholder="Name" value={editData.name !== undefined ? editData.name : u.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                                ) : (
                                    <div>
                                        <div className="font-bold text-gray-900">{u.name}</div>
                                        <div className="font-mono text-xs text-gray-400 bg-gray-100 px-1 rounded inline-block">{u.id}</div>
                                        <div className="text-[10px] text-gray-400 mt-1">Joined: {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : 'N/A'}</div>
                                    </div>
                                )}
                            </td>
                            <td className="p-4">
                                {editUser === u.id ? (
                                    <div className="space-y-1">
                                        <input className="border p-1 rounded w-full text-xs" placeholder="Email" value={editData.email !== undefined ? editData.email : u.email} onChange={e => setEditData({...editData, email: e.target.value})} />
                                        <input className="border p-1 rounded w-full text-xs" placeholder="Phone" value={editData.phone !== undefined ? editData.phone : u.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
                                        <input className="border p-1 rounded w-full text-xs" placeholder="Addr" value={editData.address !== undefined ? editData.address : u.address} onChange={e => setEditData({...editData, address: e.target.value})} />
                                    </div>
                                ) : (
                                    <div className="space-y-0.5">
                                        <div className="text-gray-700 font-bold">{u.email}</div>
                                        <div className="text-xs text-gray-500">📞 {u.phone}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-[150px]">🏠 {u.address}</div>
                                    </div>
                                )}
                            </td>
                            <td className="p-4">
                                {editUser === u.id ? (
                                    <select 
                                        className="border p-2 rounded w-full"
                                        value={editData.role || u.role}
                                        onChange={e => setEditData({...editData, role: e.target.value as UserRole})}
                                    >
                                        <option value={UserRole.USER}>User</option>
                                        <option value={UserRole.MODERATOR}>Moderator</option>
                                        <option value={UserRole.ADMIN}>Admin</option>
                                    </select>
                                ) : (
                                    <div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === UserRole.ADMIN ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {u.role}
                                        </span>
                                        {u.lastActive && (
                                            <div className="text-[10px] text-gray-400 mt-1">Last: {new Date(u.lastActive).toLocaleTimeString()}</div>
                                        )}
                                    </div>
                                )}
                            </td>
                            <td className="p-4">
                                {editUser === u.id ? (
                                    <input 
                                        type="number" 
                                        className="border p-2 rounded w-24" 
                                        value={editData.points !== undefined ? editData.points : u.points} 
                                        onChange={e => setEditData({...editData, points: parseInt(e.target.value)})} 
                                    />
                                ) : (
                                    <span className="font-mono font-bold text-yellow-600">{u.points.toLocaleString()}</span>
                                )}
                            </td>
                            <td className="p-4">
                                <div className="flex gap-2">
                                    {editUser === u.id ? (
                                        <>
                                            <button onClick={() => handleUpdateUser(u.id)} className="p-2 bg-green-500 text-white rounded hover:bg-green-600"><Save size={16}/></button>
                                            <button onClick={() => setEditUser(null)} className="p-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">X</button>
                                        </>
                                    ) : (
                                        <button onClick={() => { setEditUser(u.id); setEditData({}); }} className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" title="Edit User"><Edit size={16}/></button>
                                    )}
                                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200" title="Remove User"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Post Management */}
      <div className="mt-8 border rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b font-bold">Recent Posts ({posts.length})</div>
        <div className="max-h-96 overflow-y-auto">
            {posts.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 border-b hover:bg-gray-50">
                    <div className="flex-1 overflow-hidden pr-4">
                        <div className="font-bold truncate text-sm">{p.title}</div>
                        <div className="text-xs text-gray-400 flex gap-2">
                            <span>{p.author}</span>
                            <span>{p.region}</span>
                            <span className="flex items-center gap-1"><Clock size={10}/> {new Date(p.timestamp).toLocaleTimeString()}</span>
                            <span className="flex items-center gap-1 text-green-600"><Eye size={10}/> {p.views}</span>
                        </div>
                    </div>
                    <button onClick={() => handleDeletePost(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
