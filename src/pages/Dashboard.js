import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

const getPageTitle = (pathname) => {
    switch (pathname) {
        case '/':
            return 'Dashboard';
        case '/perangkat':
            return 'Manajemen Data Perangkat';
        case '/manajemen-admin':
            return 'Manajemen Admin Desa';
        case '/pengaturan':
            return 'Pengaturan Aplikasi';
        default:
            return 'Dashboard';
    }
};

const Dashboard = () => {
    const location = useLocation();
    const pageTitle = getPageTitle(location.pathname);

    return (
        <div className="flex bg-gray-100 min-h-screen">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <Header pageTitle={pageTitle} />
                <div id="page-content">
                    {/* Konten dari nested routes akan dirender di sini */}
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
