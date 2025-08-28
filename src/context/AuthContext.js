import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    // KASUS IDEAL: User ditemukan di Auth & Firestore.
                    // Gabungkan data untuk mendapatkan user yang lengkap.
                    setCurrentUser({ 
                        uid: user.uid, 
                        email: user.email, 
                        ...userDoc.data() // Menambahkan 'nama', 'role', dan 'desa'
                    });
                } else {
                    // FIX TEGAS: Jika dokumen user tidak ada di Firestore,
                    // jangan izinkan dia masuk. Ini mencegah data yang tidak lengkap.
                    console.error("FATAL: User terautentikasi tapi tidak punya dokumen di Firestore. Logout paksa.", user.uid);
                    setCurrentUser(null);
                    await signOut(auth); // Paksa user untuk logout
                }
            } else {
                // Tidak ada user yang login
                setCurrentUser(null);
            }
            
            // Pindahkan setLoading(false) ke paling akhir.
            // Ini memastikan aplikasi baru berjalan setelah semua proses di atas selesai.
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
    };

    // Jangan render anak-anaknya (seluruh aplikasi) jika masih loading
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
