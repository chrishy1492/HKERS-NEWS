
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { User, UserRole, Post, RobotLog, ADMIN_EMAILS } from '../../types';
import { MockDB } from '../../services/mockDatabase';
import { Trash2, Edit, Save, Search, RefreshCw, AlertOctagon, Bot, Activity, Clock, Shield } from 'lucide-react';

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

  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) {
      navigate('/platform');
      return;
    }
    refreshData();
    // Auto-refresh admin view every 5 seconds
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const refreshData = () => {
    setUsers(MockDB.getUsers());
    setPosts(MockDB.getPosts());
    setRobotLogs(MockDB.getRobotLogs());
  };

  const handleUpdateUser = (id: string) => {
    const currentUser = users.find(u => u.id === id);
    if (!currentUser) return;
    
    // Safety: don't let editing own role lock yourself out
    if (id === user?.id && editData.role && editData.role !== UserRole.ADMIN) {
        alert("Cannot downgrade your own Admin privileges.");
        return;
    }

    const updatedUser = { ...currentUser, ...editData };
    MockDB.saveUser(updatedUser); 
    refreshData();
    setEditUser(null);
    setEditData({});
    alert("User updated successfully.");
  };

  const handleDeleteUser = (id: string) => {
    if(confirm('Are you sure you want to remove this user? This cannot be undone.')) {
        const newUsers = users.filter(u => u.id !== id);
        // MockDB persistence manual override for delete
        localStorage.setItem('hker_users_db_v4', JSON.stringify(newUsers));
        refreshData();
    }
  };

  const handleDeletePost = (id: string) => {
      if(confirm('Delete this post?')) {
        MockDB.deletePost(id);
        refreshData();
      }
  };

  const handleGlobalPointReset = () => {
      const val = prompt("Enter new point value for ALL users:");
      if (val && !isNaN(parseInt(val))) {
          MockDB.resetAllPoints(parseInt(val));
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
        <h1 className="text-2xl font-bold text-red-600">Admin Control Panel</h1>
        <div className="text-sm text-gray-500">
             Admin: {user?.email}
        </div>
      </div>
      
      {/* Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg flex items-center gap-2">
            <Search className="text-gray-500" />
            <input 
                className="bg-transparent outline-none flex-1" 
                placeholder="Search User by Name, Email, ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={handleGlobalPointReset} className="bg-red-100 text-red-600 p-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-200">
             <AlertOctagon size={20} /> Mass Reset Points
          </button>
          <button onClick={() => setShowRobotMonitor(!showRobotMonitor)} className={`p-4 rounded-lg font-bold flex items-center justify-center gap-2 transition ${showRobotMonitor ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
             <Bot size={20} /> {showRobotMonitor ? 'Hide Robot Monitor' : '🤖 Robot Monitor'}
          </button>
      </div>

      {/* ROBOT MONITOR SECTION */}
      {showRobotMonitor && (
        <div className="bg-slate-900 text-green-400 p-6 rounded-xl font-mono shadow-2xl border-2 border-green-900 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4 border-b border-green-800 pb-2">
                <h2 className="text-lg font-bold flex items-center gap-2"><Activity /> AUTOMATED ROBOT LOGS (24/7)</h2>
                <div className="text-xs text-green-600">Refreshed: {new Date().toLocaleTimeString()}</div>
            </div>
            <div className="h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {robotLogs.length === 0 && <div className="text-gray-500 italic">No logs generated yet. Robot is active in background...</div>}
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

      {/* User Table */}
      <div className="overflow-x-auto bg-white rounded-lg border">
        <div className="p-4 bg-gray-50 border-b font-bold flex justify-between">
            <span>User Management ({filteredUsers.length})</span>
            <button onClick={refreshData}><RefreshCw size={16} /></button>
        </div>
        <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
                <tr>
                    <th className="p-3 text-left">ID / Info</th>
                    <th className="p-3 text-left">Role & Access</th>
                    <th className="p-3 text-left">Points</th>
                    <th className="p-3 text-left">Actions</th>
                </tr>
            </thead>
            <tbody>
                {filteredUsers.map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                            {editUser === u.id ? (
                                <div className="flex flex-col gap-1">
                                    <input className="border p-1 rounded" placeholder="Name" value={editData.name !== undefined ? editData.name : u.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                                    <input className="border p-1 rounded" placeholder="Email" value={editData.email !== undefined ? editData.email : u.email} onChange={e => setEditData({...editData, email: e.target.value})} />
                                </div>
                            ) : (
                                <div>
                                    <div className="font-bold">{u.name}</div>
                                    <div className="text-xs text-gray-500">{u.email}</div>
                                    <div className="font-mono text-[10px] text-gray-400">{u.id}</div>
                                </div>
                            )}
                        </td>
                        <td className="p-3">
                             {editUser === u.id ? (
                                 <select 
                                    className="border p-1 rounded"
                                    value={editData.role || u.role}
                                    onChange={e => setEditData({...editData, role: e.target.value as UserRole})}
                                 >
                                     <option value={UserRole.USER}>User</option>
                                     <option value={UserRole.MODERATOR}>Moderator (版主)</option>
                                     <option value={UserRole.ADMIN}>Admin</option>
                                 </select>
                             ) : (
                                 <div className={`text-xs font-bold px-2 py-1 rounded inline-block ${u.role === UserRole.ADMIN ? 'bg-red-100 text-red-600' : u.role === UserRole.MODERATOR ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                     {u.role}
                                 </div>
                             )}
                        </td>
                        <td className="p-3">
                            {editUser === u.id ? (
                                <input 
                                    type="number" 
                                    className="border p-1 rounded w-24" 
                                    value={editData.points !== undefined ? editData.points : u.points} 
                                    onChange={e => setEditData({...editData, points: parseInt(e.target.value)})} 
                                />
                            ) : (
                                <span className="font-bold text-hker-gold">{u.points.toLocaleString()}</span>
                            )}
                        </td>
                        <td className="p-3">
                            <div className="flex gap-2">
                                {editUser === u.id ? (
                                    <>
                                        <button onClick={() => handleUpdateUser(u.id)} className="p-1 bg-green-100 text-green-600 rounded"><Save size={16}/></button>
                                        <button onClick={() => setEditUser(null)} className="p-1 bg-gray-100 text-gray-600 rounded">X</button>
                                    </>
                                ) : (
                                    <button onClick={() => { setEditUser(u.id); setEditData({}); }} className="p-1 bg-blue-100 text-blue-600 rounded"><Edit size={16}/></button>
                                )}
                                <button onClick={() => handleDeleteUser(u.id)} className="p-1 bg-red-100 text-red-600 rounded"><Trash2 size={16}/></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
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
                            <span>({p.replies?.length || 0} replies)</span>
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
