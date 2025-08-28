import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, where, writeBatch, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import { FiEdit, FiTrash2, FiSearch, FiFilter, FiUpload, FiDownload, FiPlus, FiEye } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { generatePerangkatPDF } from '../utils/generatePerangkatPDF';
import { generatePerangkatXLSX } from '../utils/generatePerangkatXLSX';

const DESA_LIST = [
    "Punggelan", "Petuguran", "Karangsari", "Jembangan", "Tanjungtirta", 
    "Sawangan", "Bondolharjo", "Danakerta", "Badakarya", "Tribuana", 
    "Sambong", "Klapa", "Kecepit", "Mlaya", "Sidarata", "Purwasana", "Tlaga"
];

const isDataLengkap = (perangkat) => {
    const requiredFields = [
        'nama', 'jabatan', 'nik', 'tempat_lahir', 'tgl_lahir', 
        'pendidikan', 'no_sk', 'tgl_pelantikan', 'akhir_jabatan', 
        'foto_url', 'ktp_url'
    ];
    return requiredFields.every(field => perangkat[field] && String(perangkat[field]).trim() !== '');
};


const Perangkat = () => {
    const { currentUser } = useAuth();
    const [allPerangkat, setAllPerangkat] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPerangkat, setSelectedPerangkat] = useState(null);
    const [formData, setFormData] = useState({});
    
    const [fotoProfilFile, setFotoProfilFile] = useState(null);
    const [fotoKtpFile, setFotoKtpFile] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDesa, setFilterDesa] = useState('all');
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalMode, setModalMode] = useState('edit');
    const [exportConfig, setExportConfig] = useState(null);
    const [uploadConfig, setUploadConfig] = useState(null);

   useEffect(() => {
        const fetchConfigs = async () => {
            const exportRef = doc(db, 'settings', 'exportConfig');
            const uploadRef = doc(db, 'settings', 'uploadConfig');
            const exportSnap = await getDoc(exportRef);
            const uploadSnap = await getDoc(uploadRef);
            if (exportSnap.exists()) setExportConfig(exportSnap.data());
            if (uploadSnap.exists()) setUploadConfig(uploadSnap.data());
        };
        fetchConfigs();

        if (!currentUser || (currentUser.role === 'admin_desa' && !currentUser.desa)) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const perangkatCollection = collection(db, 'perangkat');
        const q = currentUser.role === 'admin_kecamatan' 
            ? query(perangkatCollection)
            : query(perangkatCollection, where("desa", "==", currentUser.desa));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllPerangkat(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching data:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser]);

    const filteredPerangkat = useMemo(() => {
        return allPerangkat
            .filter(p => {
                if (currentUser.role === 'admin_desa') return p.desa === currentUser.desa;
                if (filterDesa === 'all') return true;
                return p.desa === filterDesa;
            })
            .filter(p => {
                if (!searchTerm) return true;
                const search = searchTerm.toLowerCase();
                return (p.nama && p.nama.toLowerCase().includes(search)) || 
                       (p.nip && p.nip.includes(search)) ||
                       (p.nik && p.nik.includes(search));
            });
    }, [allPerangkat, searchTerm, filterDesa, currentUser]);

    const handleOpenModal = (perangkat = null, mode = 'edit') => {
        setModalMode(mode);
        setSelectedPerangkat(perangkat);
        const initialDesa = currentUser.role === 'admin_desa' ? currentUser.desa : (perangkat ? perangkat.desa : '');
        setFormData(perangkat ? { ...perangkat } : { desa: initialDesa });
        setFotoProfilFile(null);
        setFotoKtpFile(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (isSubmitting) return;
        setIsModalOpen(false);
        setSelectedPerangkat(null);
        setFormData({});
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const uploadImageToCloudinary = async (file) => {
        if (!file) return null;
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: data
        });
        const result = await res.json();
        return result.secure_url;
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        let dataToSave = { ...formData };
        if (!dataToSave.desa) {
            alert("Desa wajib diisi!");
            setIsSubmitting(false);
            return;
        }

        try {
            const fotoProfilUrl = await uploadImageToCloudinary(fotoProfilFile);
            const fotoKtpUrl = await uploadImageToCloudinary(fotoKtpFile);

            if (fotoProfilUrl) dataToSave.foto_url = fotoProfilUrl;
            if (fotoKtpUrl) dataToSave.ktp_url = fotoKtpUrl;

            if (selectedPerangkat) {
                const docRef = doc(db, 'perangkat', selectedPerangkat.id);
                await updateDoc(docRef, dataToSave);
                alert('Data berhasil diperbarui!');
            } else {
                await addDoc(collection(db, 'perangkat'), dataToSave);
                alert('Data berhasil ditambahkan!');
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving document: ", error);
            alert("Gagal menyimpan data.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async (id) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
            await deleteDoc(doc(db, 'perangkat', id));
        }
    };
    
    const getExportData = () => {
        return allPerangkat
            .filter(p => {
                if (currentUser.role === 'admin_desa') return p.desa === currentUser.desa;
                if (filterDesa === 'all') return true;
                return p.desa === filterDesa;
            })
            .filter(p => {
                if (!searchTerm) return true;
                const search = searchTerm.toLowerCase();
                return (p.nama && p.nama.toLowerCase().includes(search)) || 
                       (p.nip && p.nip.includes(search)) ||
                       (p.nik && p.nik.includes(search));
            });
    };

    const handleExport = (format) => {
        const dataToExport = getExportData();
        
        if (dataToExport.length === 0) {
            alert("Tidak ada data untuk diekspor sesuai filter yang dipilih.");
            return;
        }

        let groupedData = [];
        if (currentUser.role === 'admin_kecamatan' && filterDesa === 'all') {
            const desaGroups = dataToExport.reduce((acc, p) => {
                const desa = p.desa || 'Tanpa Desa';
                (acc[desa] = acc[desa] || []).push(p);
                return acc;
            }, {});
            groupedData = Object.keys(desaGroups).map(desa => ({
                desa: desa,
                perangkat: desaGroups[desa]
            }));
        } else {
            const desaName = currentUser.role === 'admin_desa' ? currentUser.desa : filterDesa;
            groupedData = [{ desa: desaName, perangkat: dataToExport }];
        }
        
        // --- REVISI: Menambahkan pengecekan exportConfig untuk kedua format ---
        if (!exportConfig) {
            alert("Pengaturan ekspor belum dimuat. Silakan atur di halaman Pengaturan.");
            return;
        }

        if (format === 'pdf') {
            generatePerangkatPDF(groupedData, exportConfig);
        } else if (format === 'xlsx') {
            generatePerangkatXLSX(groupedData, exportConfig);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!uploadConfig || Object.keys(uploadConfig).length === 0) {
            alert("Pengaturan format upload Excel belum dimuat atau diatur. Silakan atur di halaman Pengaturan.");
            e.target.value = null;
            return;
        }

        setIsUploading(true);
        
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });

                // 1. Mencari nama desa dari baris pertama
                let desa = 'Unknown';
                if (data && data[0] && data[0][0] && typeof data[0][0] === 'string') {
                    const match = data[0][0].match(/DESA\s(.*?)\s\(/i); // 'i' for case-insensitive
                    if (match && match[1]) {
                        desa = match[1].trim();
                    }
                }

                // 2. Mencari baris header secara dinamis
                const headerRowIndex = data.findIndex(row => row.includes(uploadConfig.nama));
                if (headerRowIndex === -1) {
                    throw new Error(`Format Excel tidak dikenali: Header "${uploadConfig.nama}" tidak ditemukan.`);
                }
                const headers = data[headerRowIndex].map(h => typeof h === 'string' ? h.trim() : h);

                // 3. Memetakan field internal ke indeks kolom berdasarkan uploadConfig
                const colMap = {};
                for (const key in uploadConfig) {
                    const colIndex = headers.indexOf(uploadConfig[key]);
                    if (colIndex !== -1) {
                        colMap[key] = colIndex;
                    }
                }

                // 4. Memproses baris data (dimulai 2 baris setelah header)
                const dataRows = data.slice(headerRowIndex + 2);

                const mappedData = dataRows.map(row => {
                    if (!row[colMap.nama]) return null;

                    const [tempat_lahir, tgl_lahir_str] = (row[colMap.ttl] || '').split(',');
                    
                    return {
                        nama: row[colMap.nama],
                        jabatan: row[colMap.jabatan],
                        nik: String(row[colMap.nik] || ''),
                        no_hp: String(row[colMap.no_hp] || ''),
                        no_sk: row[colMap.no_sk],
                        tgl_pelantikan: row[colMap.tgl_pelantikan],
                        akhir_jabatan: row[colMap.akhir_jabatan],
                        tempat_lahir: tempat_lahir ? tempat_lahir.trim() : '',
                        tgl_lahir: tgl_lahir_str ? tgl_lahir_str.trim() : '',
                        jenis_kelamin: row[colMap.jenis_kelamin_l] ? 'L' : (row[colMap.jenis_kelamin_p] ? 'P' : ''),
                        pendidikan: row[colMap.pendidikan_s1] ? 'S1' : (row[colMap.pendidikan_slta] ? 'SLTA' : ''),
                        desa: desa,
                    };
                }).filter(p => p !== null);

                if (mappedData.length === 0) {
                    throw new Error("Tidak ada data valid yang ditemukan di dalam file Excel.");
                }
                
                const batch = writeBatch(db);
                mappedData.forEach(perangkat => {
                    const docRef = doc(collection(db, 'perangkat'));
                    batch.set(docRef, perangkat);
                });
                await batch.commit();
                alert(`${mappedData.length} data untuk Desa ${desa} berhasil di-upload!`);

            } catch (error) {
                console.error("Error processing Excel file: ", error);
                alert(`Gagal memproses file: ${error.message}`);
            } finally {
                setIsUploading(false);
                e.target.value = null; // Reset file input
            }
        };
        reader.readAsBinaryString(file);
    };

    if (loading) return <Spinner size="lg"/>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="relative lg:col-span-2">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Cari nama, NIP, atau NIK..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg"/>
                </div>
                {currentUser.role === 'admin_kecamatan' && (
                    <div className="relative">
                        <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                         <select value={filterDesa} onChange={(e) => setFilterDesa(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg appearance-none">
                            <option value="all">Semua Desa</option>
                            {DESA_LIST.map(desa => <option key={desa} value={desa}>{desa}</option>)}
                        </select>
                    </div>
                )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 mb-4">
                {currentUser.role === 'admin_kecamatan' && (
                    <>
                        <label className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 cursor-pointer flex items-center gap-2">
                            <FiUpload/> {isUploading ? 'Mengupload...' : 'Upload Excel'}
                            <input type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx, .xls" disabled={isUploading}/>
                        </label>
                        <button onClick={() => handleExport('xlsx')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                            <FiDownload/> Ekspor XLSX
                        </button>
                    </>
                )}
                <button onClick={() => handleExport('pdf')} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"><FiDownload/> Ekspor PDF</button>
                {currentUser.role === 'admin_desa' && (
                    <button onClick={() => handleOpenModal(null, 'edit')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <FiPlus/> Tambah Data
                    </button>
                )}
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th className="px-6 py-3">Nama Lengkap</th>
                            <th className="px-6 py-3">Jabatan</th>
                            {currentUser.role === 'admin_kecamatan' && <th className="px-6 py-3">Desa</th>}
                            <th className="px-6 py-3">Status Data</th>
                            <th className="px-6 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPerangkat.length > 0 ? filteredPerangkat.map((p) => (
                            <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium flex items-center gap-3">
                                    <img src={p.foto_url || `https://ui-avatars.com/api/?name=${p.nama}&background=E2E8F0&color=4A5568`} alt={p.nama} className="w-10 h-10 rounded-full object-cover"/>
                                    <div>
                                        <p className="font-semibold">{p.nama}</p>
                                        <p className="text-xs text-gray-500">{p.nik || 'NIK belum diisi'}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{p.jabatan}</td>
                                {currentUser.role === 'admin_kecamatan' && <td className="px-6 py-4">{p.desa}</td>}
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${isDataLengkap(p) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {isDataLengkap(p) ? 'Lengkap' : 'Belum Lengkap'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex space-x-3">
                                    {currentUser.role === 'admin_kecamatan' ? (
                                        <button onClick={() => handleOpenModal(p, 'view')} className="text-green-600 hover:text-green-800" title="Lihat Detail"><FiEye /></button>
                                    ) : (
                                        <button onClick={() => handleOpenModal(p, 'edit')} className="text-blue-600 hover:text-blue-800" title="Edit"><FiEdit /></button>
                                    )}
                                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800" title="Hapus"><FiTrash2 /></button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-center py-10 text-gray-500">Belum ada data perangkat. Silakan tambahkan data baru.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'edit' ? (selectedPerangkat ? 'Edit Data Perangkat' : 'Tambah Data Perangkat') : 'Detail Data Perangkat'}>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries({
                            desa: 'Desa', nama: 'Nama Lengkap', jabatan: 'Jabatan', nik: 'NIK', jenis_kelamin: 'Jenis Kelamin',
                            tempat_lahir: 'Tempat Lahir', tgl_lahir: 'Tanggal Lahir', pendidikan: 'Pendidikan Terakhir',
                            no_sk: 'Nomor SK', tgl_pelantikan: 'Tanggal Pelantikan', akhir_jabatan: 'Akhir Masa Jabatan',
                            no_hp: 'No. HP / WA', nip: 'NIP/NIPD',
                        }).map(([key, label]) => (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-700">{label}</label>
                                {modalMode === 'view' ? (
                                    <p className="mt-1 p-2 bg-gray-100 rounded-md min-h-[42px]">{formData[key] || '-'}</p>
                                ) : (
                                    key === 'desa' ? (
                                        <select name={key} value={formData[key] || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" required disabled={currentUser.role === 'admin_desa'}>
                                            <option value="">Pilih Desa</option>
                                            {DESA_LIST.map(desa => <option key={desa} value={desa}>{desa}</option>)}
                                        </select>
                                    ) : key === 'jenis_kelamin' ? (
                                        <select name={key} value={formData[key] || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
                                            <option value="">Pilih Jenis Kelamin</option>
                                            <option value="L">Laki-laki</option>
                                            <option value="P">Perempuan</option>
                                        </select>
                                    ) : (
                                        <input type={key.includes('tgl') || key.includes('akhir') ? 'date' : 'text'} name={key} value={formData[key] || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/>
                                    )
                                )}
                            </div>
                        ))}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Foto Profil</label>
                            {modalMode === 'view' ? (
                                formData.foto_url ? <img src={formData.foto_url} alt="Foto Profil" className="mt-2 h-24 w-24 object-cover rounded-md"/> : <p className="mt-1 text-gray-500">- Tidak ada foto -</p>
                            ) : (
                                <>
                                    <input type="file" onChange={(e) => setFotoProfilFile(e.target.files[0])} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                    {formData.foto_url && <img src={formData.foto_url} alt="Foto Profil Saat Ini" className="mt-2 h-24 w-24 object-cover rounded-md"/>}
                                </>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Foto KTP</label>
                            {modalMode === 'view' ? (
                                formData.ktp_url ? <img src={formData.ktp_url} alt="Foto KTP" className="mt-2 h-24 w-auto object-contain rounded-md"/> : <p className="mt-1 text-gray-500">- Tidak ada foto -</p>
                            ) : (
                                <>
                                    <input type="file" onChange={(e) => setFotoKtpFile(e.target.files[0])} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                    {formData.ktp_url && <img src={formData.ktp_url} alt="Foto KTP Saat Ini" className="mt-2 h-24 w-auto object-contain rounded-md"/>}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t mt-6">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 rounded-md mr-2" disabled={isSubmitting}>Tutup</button>
                        {modalMode === 'edit' && (
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center" disabled={isSubmitting}>
                                {isSubmitting && <Spinner size="sm" />}
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        )}
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Perangkat;
