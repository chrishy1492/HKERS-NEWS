import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';
import { Save, AlertCircle } from 'lucide-react';

interface ProfileProps {
  userProfile: UserProfile;
  refreshProfile: () => void;
  updatePoints: (amount: number) => Promise<void>;
}

const Profile: React.FC<ProfileProps> = ({ userProfile, refreshProfile, updatePoints }) => {
  const [form, setForm] = useState({ ...userProfile });
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

  useEffect(() => {
    setForm({ ...userProfile });
  }, [userProfile]);

  const handleSave = async () => {
    const { error } = await supabase.from('profiles').update({
       full_name: form.full_name,
       phone: form.phone,
       address: form.address,
       sol_address: form.sol_address
    }).eq('id', userProfile.id);

    if (error) alert('Error saving: ' + error.message);
    else {
      alert('Profile updated!');
      refreshProfile();
    }
  };

  const handleWithdraw = async () => {
    if (withdrawAmount < 1000000) return alert('Minimum withdrawal is 1,000,000 HKER');
    if (userProfile.hker_token < withdrawAmount) return alert('Insufficient points');
    if (!userProfile.sol_address) return alert('Please save your SOL wallet address first.');

    if (confirm(`Withdraw ${withdrawAmount} HKER? Please screenshot the next alert.`)) {
      await updatePoints(-withdrawAmount);
      alert('Withdrawal Request Submitted!\n\nPlease screenshot this and email hkerstoken@gmail.com with your details.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">Account Settings</h2>

      <div className="bg-white p-8 rounded-xl shadow-sm mb-8 space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email (Read Only)</label>
              <input type="text" value={form.email} disabled className="w-full bg-gray-100 p-3 rounded border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
              <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full p-3 rounded border focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
              <input type="text" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-3 rounded border focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">SOL Wallet Address</label>
              <input type="text" value={form.sol_address || ''} onChange={e => setForm({...form, sol_address: e.target.value})} className="w-full p-3 rounded border focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Physical Address</label>
              <input type="text" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} className="w-full p-3 rounded border focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
         </div>
         <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition">
           <Save size={18} /> Save Changes
         </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
         <h3 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
           <AlertCircle size={24} /> Points Withdrawal
         </h3>
         <div className="mb-4">
           <p className="text-gray-700 text-sm">Convert your HKER points to Solana tokens.</p>
           <p className="text-xs text-red-500 mt-1">1 Point = 1 HKER Token. Min 1,000,000.</p>
         </div>
         <div className="flex gap-4">
           <input type="number" placeholder="Amount" value={withdrawAmount || ''} onChange={e => setWithdrawAmount(parseInt(e.target.value))} className="flex-1 p-3 border rounded" />
           <button onClick={handleWithdraw} className="bg-green-600 text-white px-6 py-3 rounded font-bold hover:bg-green-700">Withdraw</button>
         </div>
      </div>
    </div>
  );
};

export default Profile;