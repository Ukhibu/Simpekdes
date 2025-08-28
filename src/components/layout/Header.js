import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ pageTitle }) => {
    const { currentUser } = useAuth();

    return (
        <header className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">{pageTitle || 'Selamat Datang'}</h1>
                <p className="text-gray-500">Selamat datang kembali, {currentUser?.nama || 'Pengguna'}!</p>
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-right">
                    <p className="font-semibold">{currentUser?.nama || 'Nama Pengguna'}</p>
                    <span className="text-sm px-2 py-1 font-semibold text-blue-800 bg-blue-200 rounded-full">
                        {currentUser?.role === 'admin_kecamatan' ? 'Admin Kecamatan' : `Admin Desa ${currentUser?.desa}`}
                    </span>
                </div>
                <img 
                    src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.nama || 'A'}&background=E2E8F0&color=4A5568`} 
                    alt="Avatar" 
                    className="w-12 h-12 rounded-full object-cover"
                />
            </div>
        </header>
    );
};

export default Header;
