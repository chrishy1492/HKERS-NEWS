
export const ADMIN_EMAILS = ['chrishy1494@gmail.com', 'hkerstoken@gmail.com', 'niceleung@gmail.com'];

export const REGIONS = [
  '中國香港', 
  '台灣', 
  '英國', 
  '美國', 
  '加拿大', 
  '澳洲', 
  '歐洲', 
  '日本/韓國', 
  '東南亞'
];

export const TOPICS = [
  '時事', 
  '地產', 
  '財經', 
  '娛樂', 
  '旅遊', 
  '數碼', 
  '汽車', 
  '宗教', 
  '優惠', 
  '校園', 
  '天氣', 
  '社區活動', 
  '移民生活'
];

// 生成 88 款不同的頭像 (1-88)
export const AVATARS = Array.from({ length: 88 }, (_, i) => 
  `https://api.dicebear.com/7.x/avataaars/svg?seed=HKER_Member_v2_${i + 1}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
);

export const SUPABASE_CONFIG = {
  url: 'https://wgkcwnyxjhnlkrdjvzyj.supabase.co',
  key: 'sb_publishable_O_E1KKVTudZg2Ipob5E14g_eExGWDBG'
};
