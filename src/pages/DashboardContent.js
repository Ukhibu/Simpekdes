import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const isDataLengkap = (perangkat) => {
    const requiredFields = ['nama', 'nip', 'jabatan', 'nik', 'tempat_lahir', 'tgl_lahir', 'pendidikan', 'no_sk', 'tgl_pelantikan', 'akhir_jabatan', 'no_hp', 'foto_url'];
    return requiredFields.every(field => perangkat[field] && perangkat[field].trim() !== '');
};

const DESA_LIST = [
    "Punggelan", "Petuguran", "Karangsari", "Jembangan", "Tanjungtirta", 
    "Sawangan", "Bondolharjo", "Danakerta", "Badakarya", "Tribuana", 
    "Sambong", "Klapa", "Kecepit", "Mlaya", "Sidarata", "Purwasana", "Tlaga"
];

const DashboardContent = () => {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({ totalPerangkat: 0, lengkap: 0, belumLengkap: 0 });
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // --- FIX: TAMBAHKAN PENJAGA DI SINI ---
        if (!currentUser || (currentUser.role === 'admin_desa' && !currentUser.desa)) {
            setLoading(false);
            return;
        }

        const perangkatCollection = collection(db, 'perangkat');
        const q = currentUser.role === 'admin_kecamatan' 
            ? query(perangkatCollection)
            : query(perangkatCollection, where("desa", "==", currentUser.desa));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => doc.data());
            
            // Calculate stats
            const totalPerangkat = list.length;
            const lengkap = list.filter(isDataLengkap).length;
            setStats({
                totalPerangkat,
                lengkap,
                belumLengkap: totalPerangkat - lengkap
            });

            // Prepare chart data for Admin Kecamatan
            if (currentUser.role === 'admin_kecamatan') {
                const dataLengkapPerDesa = DESA_LIST.map(desa => list.filter(p => p.desa === desa && isDataLengkap(p)).length);
                const dataBelumLengkapPerDesa = DESA_LIST.map(desa => list.filter(p => p.desa === desa && !isDataLengkap(p)).length);
                setChartData({
                    labels: DESA_LIST,
                    datasets: [
                        { label: 'Data Lengkap', data: dataLengkapPerDesa, backgroundColor: 'rgba(34, 197, 94, 0.8)' },
                        { label: 'Belum Lengkap', data: dataBelumLengkapPerDesa, backgroundColor: 'rgba(239, 68, 68, 0.8)' }
                    ]
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    if (loading) return <Spinner />;

    return (
        <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {currentUser.role === 'admin_kecamatan' && (
                    <div className="bg-white p-6 rounded-xl shadow-md"><h3 className="text-gray-500">Total Desa</h3><p className="text-3xl font-bold">{DESA_LIST.length}</p></div>
                )}
                <div className="bg-white p-6 rounded-xl shadow-md"><h3 className="text-gray-500">Total Perangkat</h3><p className="text-3xl font-bold">{stats.totalPerangkat}</p></div>
                <div className="bg-white p-6 rounded-xl shadow-md"><h3 className="text-gray-500">Data Lengkap</h3><p className="text-3xl font-bold text-green-600">{stats.lengkap}</p></div>
                <div className="bg-white p-6 rounded-xl shadow-md"><h3 className="text-gray-500">Belum Lengkap</h3><p className="text-3xl font-bold text-red-600">{stats.belumLengkap}</p></div>
            </div>

            {/* Chart for Admin Kecamatan */}
            {currentUser.role === 'admin_kecamatan' && chartData && (
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold mb-4">Rekapitulasi Data Per Desa</h2>
                    <Bar 
                        options={{
                            responsive: true,
                            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
                            plugins: { legend: { position: 'top' } }
                        }} 
                        data={chartData} 
                    />
                </div>
            )}
        </div>
    );
};

export default DashboardContent;
