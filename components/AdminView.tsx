
import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { UserProfile } from '../types';

interface AdminViewProps {
  supabase: any;
  currentUser: UserProfile | null;
  showNotification: (msg: string, type?: 'info' | 'error') => void;
}

const AdminView: React.FC<AdminViewProps> = ({ supabase, currentUser, showNotification }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    const sub = supabase.channel('admin_panel').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [supabase]);

  const adjustPoints = async (id: string, current: number, plus: boolean) => {
    const newVal = plus ? current + 100000 : Math.max(0, current - 100000);
    await supabase.from('profiles').update({ points: newVal }).eq('id', id);
    showNotification("已手動調整用戶積分 (+/- 10萬)");
  };

  if (currentUser?.role !== 'admin') return <div className="p-20 text-center font-bold text-red-500 uppercase tracking-widest">⚠️ Access Denied: Admin Only</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
       <div className="flex justify-between items-end">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">會員管理系統</h1>
          <div className="text-right">
             <p className="text-[10px] text-slate-400 font-bold uppercase">總註冊人數</p>
             <p className="text-2xl font-black">{users.length}</p>
          </div>
       </div>
       <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center"><RefreshCw className="animate-spin inline-block mr-2" /> 正在載入會員列表...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 border-b border-slate-100 font-black text-slate-400 uppercase">
                    <tr>
                       <th className="p-6">用戶資料</th>
                       <th className="p-6">目前積分</th>
                       <th className="p-6">SOL 地址</th>
                       <th className="p-6">快速操作</th>
                    </tr>
                 </thead>
                 <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                         <td className="p-6">
                            <p className="font-bold text-slate-900">{u.nickname || '未設定'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                         </td>
                         <td className="p-6 font-mono font-bold text-yellow-600">{u.points?.toLocaleString()}</td>
                         <td className="p-6 text-[10px] text-slate-400 truncate max-w-[150px] font-mono">{u.sol_address || '-'}</td>
                         <td className="p-6">
                            <div className="flex gap-2">
                               <button onClick={()=>adjustPoints(u.id, u.points, true)} className="bg-green-100 text-green-600 p-2 rounded-lg hover:bg-green-200 transition" title="加10萬分"><RefreshCw size={14}/></button>
                               <button onClick={()=>adjustPoints(u.id, u.points, false)} className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition" title="減10萬分"><Trash2 size={14}/></button>
                            </div>
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

export default AdminView;
