import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock, Mail, User, Phone, MapPin, Wallet, X } from 'lucide-react';

interface AuthModalProps {
  onAuthSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [solAddress, setSolAddress] = useState('');
  const [gender, setGender] = useState('M');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else onAuthSuccess();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Sign Up
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (data.user) {
      // 2. Create Profile immediately
      const { error: profileError } = await supabase.from('profiles').upsert([{
        id: data.user.id,
        email: email,
        full_name: fullName,
        role: 'user',
        hker_token: 8888, // Welcome bonus
        phone: phone,
        gender: gender,
        address: address,
        sol_address: solAddress,
        created_at: new Date().toISOString()
      }]);

      if (profileError) {
        console.error("Profile creation failed:", profileError);
        setError("Account created, but profile setup encountered an error. Please contact support.");
      } else {
        alert("Registration Successful! You received 8888 HKER Token.");
        onAuthSuccess();
      }
    } else {
      // Sometimes session is null if email confirmation is required
      alert("Registration submitted. Please check your email for a confirmation link if required.");
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href,
    });
    setLoading(false);
    if (error) setError(error.message);
    else alert('Password reset email sent!');
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-red-600 mb-2">HKER News</h1>
          <p className="text-gray-500 text-sm">Join the Global Chinese Community</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required 
                className="w-full pl-10 p-3 border rounded focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required 
                className="w-full pl-10 p-3 border rounded focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-red-600 text-white p-3 rounded font-bold hover:bg-red-700 transition disabled:opacity-50">
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <div className="flex justify-between text-sm mt-4">
              <button type="button" onClick={() => setMode('forgot')} className="text-gray-500 hover:text-gray-800">Forgot Password?</button>
              <button type="button" onClick={() => setMode('register')} className="text-red-600 font-bold hover:text-red-800">Register (Get 8888 pts)</button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
             <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required 
                className="w-full pl-10 p-2 border rounded focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <select value={gender} onChange={e => setGender(e.target.value)} className="w-full p-2 border rounded outline-none">
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500 outline-none" />
            <input type="password" placeholder="Password (Min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500 outline-none" />
            
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input type="tel" placeholder="Phone (Optional)" value={phone} onChange={e => setPhone(e.target.value)} 
                className="w-full pl-10 p-2 border rounded focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div className="relative">
               <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Address (Optional)" value={address} onChange={e => setAddress(e.target.value)} 
                className="w-full pl-10 p-2 border rounded focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
             <div className="relative">
               <Wallet className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="SOL Wallet (Optional)" value={solAddress} onChange={e => setSolAddress(e.target.value)} 
                className="w-full pl-10 p-2 border rounded focus:ring-2 focus:ring-red-500 outline-none" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-red-600 text-white p-3 rounded font-bold hover:bg-red-700 transition disabled:opacity-50">
              {loading ? 'Creating Profile...' : 'Register & Claim 8888 HKER'}
            </button>
            <div className="text-center text-sm mt-2">
              <button type="button" onClick={() => setMode('login')} className="text-gray-500 underline">Back to Login</button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
           <form onSubmit={handleReset} className="space-y-4">
             <input type="email" placeholder="Registration Email" value={email} onChange={e => setEmail(e.target.value)} required 
                className="w-full p-3 border rounded focus:ring-2 focus:ring-red-500 outline-none" />
             <button type="submit" disabled={loading} className="w-full bg-gray-800 text-white p-3 rounded font-bold hover:bg-gray-700 transition">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="text-center text-sm mt-2">
              <button type="button" onClick={() => setMode('login')} className="text-gray-500 underline">Back</button>
            </div>
           </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;