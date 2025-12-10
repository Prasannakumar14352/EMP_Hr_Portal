import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, MOCK_USERS } from './context';
import { UserRole } from './types';

const Login = () => {
  const { login, currentUser } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleNext = () => {
    if (email) setStep(2);
  };

  const handleLogin = () => {
    const success = login(email);
    if (success) navigate('/');
  };

  const demoLogin = (role: UserRole) => {
    const user = MOCK_USERS.find(u => u.role === role);
    if (user) {
        login(user.email);
        navigate('/');
    }
  };

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
           <h2 className="text-2xl font-semibold text-gray-800 mt-4">{step === 1 ? 'Sign in' : 'Enter password'}</h2>
           {step === 2 && (
             <button onClick={() => setStep(1)} className="flex items-center space-x-2 mt-2 p-1 -ml-1 hover:bg-gray-100 rounded text-sm text-gray-800">
               <span className="border rounded-full px-1 border-gray-600">←</span> 
               <span>{email}</span>
             </button>
           )}
        </div>

        {step === 1 ? (
          <>
            <input 
              type="email" 
              placeholder="Email, phone, or Skype"
              className="w-full border-b border-gray-600 focus:border-emerald-600 outline-none py-2 text-base mb-6 bg-transparent transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-sm text-gray-600 mb-8">No account? <a href="#" className="text-emerald-600 hover:underline">Create one!</a></p>
            <div className="flex justify-end">
              <button 
                onClick={handleNext}
                className="bg-emerald-600 text-white px-8 py-2 min-w-[100px] hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <>
             <input 
              type="password" 
              placeholder="Password"
              className="w-full border-b border-gray-600 focus:border-emerald-600 outline-none py-2 text-base mb-6 bg-transparent transition-colors"
            />
            <div className="flex justify-between items-center mb-8">
              <a href="#" className="text-sm text-emerald-600 hover:underline">Forgot password?</a>
            </div>
             <div className="flex justify-end">
              <button 
                onClick={handleLogin}
                className="bg-emerald-600 text-white px-8 py-2 min-w-[100px] hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Sign in
              </button>
            </div>
          </>
        )}

        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider text-center">Development Mode: Quick Login</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => demoLogin(UserRole.EMPLOYEE)} className="text-xs py-2 bg-gray-100 hover:bg-gray-200 rounded">Employee</button>
            <button onClick={() => demoLogin(UserRole.MANAGER)} className="text-xs py-2 bg-gray-100 hover:bg-gray-200 rounded">Manager</button>
            <button onClick={() => demoLogin(UserRole.HR)} className="text-xs py-2 bg-gray-100 hover:bg-gray-200 rounded">HR</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;