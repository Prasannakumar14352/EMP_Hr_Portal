import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from './context';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from './services/authConfig';
import { UserRole } from './types';

const Login = () => {
  const { login, currentUser, isLoading } = useAppContext();
  const { instance } = useMsal();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  
  // If already logged in, redirect
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleMicrosoftLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
        console.error(e);
    });
  };

  // Legacy/Dev Login Handler
  const handleDevLogin = async () => {
     if (email) {
        const success = await login(email);
        if (success) navigate('/');
        else alert("User not found in mock DB");
     }
  };

  const demoLogin = async (role: UserRole) => {
     // Quick helper for development
     const emails: Record<UserRole, string> = {
         [UserRole.EMPLOYEE]: 'alice@nexus.com',
         [UserRole.MANAGER]: 'bob@nexus.com',
         [UserRole.HR]: 'charlie@nexus.com'
     };
     await login(emails[role]);
     navigate('/');
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100" style={{
      backgroundImage: 'url("https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80")',
      backgroundSize: 'cover'
    }}>
      <div className="bg-white p-10 rounded-none shadow-2xl w-[440px] max-w-full">
        <div className="mb-8">
           <div className="flex items-center space-x-2 mb-2">
             <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
               <div className="bg-[#f25022]"></div>
               <div className="bg-[#7fba00]"></div>
               <div className="bg-[#00a4ef]"></div>
               <div className="bg-[#ffb900]"></div>
             </div>
             <span className="text-xl font-semibold text-gray-600">Microsoft</span>
           </div>
           <h2 className="text-2xl font-semibold text-gray-800 mt-4">Sign in</h2>
           <p className="text-sm text-gray-500 mt-1">Use your organizational account</p>
        </div>

        <button 
            onClick={handleMicrosoftLogin}
            className="w-full bg-emerald-600 text-white py-2.5 rounded hover:bg-emerald-700 transition shadow-sm font-medium flex items-center justify-center gap-2"
        >
            Sign in with Microsoft
        </button>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider text-center">Development Mode: Manual Override</p>
          <input 
             type="email" 
             placeholder="Dev Email (e.g. alice@nexus.com)"
             className="w-full border-b border-gray-300 text-sm py-2 mb-3 outline-none focus:border-emerald-600"
             value={email}
             onChange={e => setEmail(e.target.value)}
          />
          <button onClick={handleDevLogin} className="w-full text-xs py-2 bg-gray-100 hover:bg-gray-200 rounded mb-4">Dev Sign In</button>
          
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => demoLogin(UserRole.EMPLOYEE)} className="text-xs py-2 bg-gray-50 hover:bg-emerald-50 text-emerald-700 rounded border border-emerald-100">Employee</button>
            <button onClick={() => demoLogin(UserRole.MANAGER)} className="text-xs py-2 bg-gray-50 hover:bg-emerald-50 text-emerald-700 rounded border border-emerald-100">Manager</button>
            <button onClick={() => demoLogin(UserRole.HR)} className="text-xs py-2 bg-gray-50 hover:bg-emerald-50 text-emerald-700 rounded border border-emerald-100">HR</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
