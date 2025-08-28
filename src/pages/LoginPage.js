import React, { useState } from 'react';
import { useBranding } from '../context/BrandingContext';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Spinner from '../components/common/Spinner'; 
import { FiEye, FiEyeOff } from 'react-icons/fi';

const LoginPage = () => {
    const { branding, loading: brandingLoading } = useBranding();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Email atau password yang Anda masukkan salah.');
        }
        setIsLoggingIn(false);
    };

    if (brandingLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg text-center">
                <img src={branding.loginLogoUrl} alt="Logo Aplikasi" className="w-24 h-24 mx-auto mb-4 object-contain" />
                <h1 className="text-3xl font-bold text-gray-800">{branding.appName}</h1>
                <p className="text-gray-500">{branding.loginTitle}</p>
                <p className="font-semibold text-gray-600">{branding.loginSubtitle}</p>
                
                <form onSubmit={handleLogin} className="space-y-6 text-left pt-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 mt-1 border rounded-md" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 mt-1 border rounded-md" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={isLoggingIn} className="w-full flex justify-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                            {isLoggingIn ? <Spinner size="sm" /> : 'Masuk'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
