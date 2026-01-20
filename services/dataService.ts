import { supabase, checkSupabaseConnection } from './supabaseClient';
import { User, Post, Stat } from '../types';

// 管理員名單
const ADMIN_EMAILS = [
  'chrishy1494@gmail.com',
  'hkerstoken@gmail.com',
  'niceleung@gmail.com'
];

export const saveUser = async (user: User): Promise<boolean> => {
  console.log("開始執行 saveUser, 資料內容:", user); // 調試點
  const isConnected = await checkSupabaseConnection();
  
  // 1. 更新本地快取
  const cachedUsersJson = localStorage.getItem('hker_users_cache');
  let cachedUsers: User[] = cachedUsersJson ? JSON.parse(cachedUsersJson) : [];
  const existingIdx = cachedUsers.findIndex(u => u.id === user.id);
  if (existingIdx >= 0) cachedUsers[existingIdx] = user;
  else cachedUsers.push(user);
  localStorage.setItem('hker_users_cache', JSON.stringify(cachedUsers));

  // 2. 同步到 Supabase Cloud
  if (isConnected) {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        display_name: user.displayName, // 確保資料庫欄位名正確
        phone: user.phone,
        address: user.address,
        wallet_address: user.walletAddress,
        gender: user.gender,
        joined_at: user.joinedAt || Date.now(),
        last_login: Date.now(),
        points: user.points || 0
      });
      
    if (error) {
      console.error("Supabase 儲存失敗:", error.message);
      return false;
    }
    console.log("Supabase 儲存成功！");
    return true;
  } else {
    console.warn("目前處於離線模式，僅存入本地快取。");
    return true; 
  }
};

// 其他 getUsers, deleteUser 等保留你原本的邏輯即可...