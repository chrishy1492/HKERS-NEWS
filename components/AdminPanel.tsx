
import React, { useState, useContext } from 'react';
import { Shield, DollarSign, Trash2, Search, BarChart3, Users, Save, Edit } from 'lucide-react';
import { DataContext } from '../contexts/DataContext';
import { UserRole, User } from '../types';

export const AdminPanel: React.FC = () => {
  const { users, visitorLogs, adminUpdateUser, deleteUser } = useContext(DataContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'users' | 'analytics'>('users');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditSave = () => {
    if (editingUser) {
        adminUpdateUser(editingUser.id, editingUser);
        setEditingUser(null);
        alert("用戶資料已更新 (User Updated)");
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-100 min-h-[600px]">
      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-red-600 flex items-center">
          <Shield className="mr-3" size={28}/> 管理員操作台
        </h2>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
           <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md font-bold text-sm ${activeTab === 'users' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}>會員管理</button>
           <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-md font-bold text-sm ${activeTab === 'analytics' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}>流量統計</button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="animate-fade-in">
          {/* Requirement 23: Search Button/Input */}
          <div className="mb-4 relative">
             <input 
               type="text" 
               placeholder="搜尋用戶 ID / 姓名 / Email..." 
               className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-200 outline-none"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
          </div>

          {editingUser ? (
             <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center"><Edit size={18} className="mr-2"/> 編輯用戶: {editingUser.name}</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-xs text-gray-500">姓名</label>
                        <input className="w-full border p-2 rounded" value={editingUser.name} onChange={e=>setEditingUser({...editingUser, name: e.target.value})}/>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Email</label>
                        <input className="w-full border p-2 rounded" value={editingUser.email} onChange={e=>setEditingUser({...editingUser, email: e.target.value})}/>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">積分 (HKER)</label>
                        <input type="number" className="w-full border p-2 rounded" value={editingUser.points} onChange={e=>setEditingUser({...editingUser, points: parseInt(e.target.value) || 0})}/>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">權限角色</label>
                        <select className="w-full border p-2 rounded" value={editingUser.role} onChange={e=>setEditingUser({...editingUser, role: e.target.value as UserRole})}>
                            <option value="user">普通用戶</option>
                            <option value="moderator">版主</option>
                            <option value="admin">管理員</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleEditSave} className="bg-green-600 text-white px-4 py-2 rounded flex items-center"><Save size={16} className="mr-2"/> 儲存</button>
                    <button onClick={() => setEditingUser(null)} className="bg-gray-400 text-white px-4 py-2 rounded">取消</button>
                </div>
             </div>
          ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
                        <tr>
                            <th className="p-3">ID / 用戶</th>
                            <th className="p-3">積分</th>
                            <th className="p-3">角色</th>
                            <th className="p-3">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">
                                    <div className="font-bold">{u.name}</div>
                                    <div className="text-xs text-gray-400 font-mono">{u.id}</div>
                                    <div className="text-xs text-gray-500">{u.email}</div>
                                </td>
                                <td className="p-3 font-mono text-blue-600 font-bold">{u.points}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-red-100 text-red-600' : u.role === 'moderator' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'}`}>
                                        {u.role === 'admin' ? '管理員' : u.role === 'moderator' ? '版主' : '會員'}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2">
                                    <button onClick={() => setEditingUser(u)} className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" title="編輯"><Edit size={16}/></button>
                                    <button onClick={() => {if(confirm(`刪除 ${u.name}?`)) deleteUser(u.id)}} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200" title="刪除"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
         <div className="text-center py-10 text-gray-500">
            <BarChart3 size={48} className="mx-auto mb-4 text-gray-300"/>
            <p>流量記錄已在後台自動運行</p>
            <p className="text-xs">每年每天每小時記錄 (Requirement #1)</p>
         </div>
      )}
    </div>
  );
};
