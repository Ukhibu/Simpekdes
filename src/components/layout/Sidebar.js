import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

import { FiGrid, FiUsers, FiUserPlus, FiSettings, FiLogOut, FiBarChart2 } from 'react-icons/fi';

const Sidebar = () => {
    const { currentUser } = useAuth();
    const { branding } = useBranding();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Gagal logout:', error);
        }
    };

    const navLinkClasses = ({ isActive }) => 
        `flex items-center px-4 py-3 text-gray-200 hover:bg-gray-700 rounded-md transition-colors duration-200 ${
            isActive ? 'bg-blue-600 text-white' : ''
        }`;

    return (
        <aside className="w-64 bg-gray-800 text-white flex flex-col h-screen">
            <div className="h-20 flex items-center justify-center border-b border-gray-700 px-4">
                <img src={branding.loginLogoUrl} alt="Logo" className="w-10 h-10 mr-3 object-contain" />
                <span className="text-xl font-bold whitespace-nowrap">{branding.appName}</span>
            </div>
            <nav className="flex-grow p-4 space-y-2">
                <NavLink to="/" end className={navLinkClasses}>
                    <FiGrid className="w-5 h-5 mr-3" />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/perangkat" className={navLinkClasses}>
                    <FiUsers className="w-5 h-5 mr-3" />
                    <span>Data Perangkat</span>
                </NavLink>
                
                {currentUser && currentUser.role === 'admin_kecamatan' && (
                    <>
                        {/* FITUR BARU */}
                        <NavLink to="/rekapitulasi-aparatur" className={navLinkClasses}>
                            <FiBarChart2 className="w-5 h-5 mr-3" />
                            <span>Rekap Aparatur</span>
                        </NavLink>
                        <NavLink to="/manajemen-admin" className={navLinkClasses}>
                            <FiUserPlus className="w-5 h-5 mr-3" />
                            <span>Manajemen Admin</span>
                        </NavLink>
                        <NavLink to="/pengaturan" className={navLinkClasses}>
                            <FiSettings className="w-5 h-5 mr-3" />
                            <span>Pengaturan Aplikasi</span>
                        </NavLink>
                    </>
                )}
            </nav>
            <div className="p-4 border-t border-gray-700">
                <button 
                    onClick={handleLogout} 
                    className="flex items-center w-full px-4 py-3 text-gray-200 hover:bg-red-600 hover:text-white rounded-md transition-colors"
                >
                    <FiLogOut className="w-5 h-5 mr-3" />
                    <span>Keluar</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
