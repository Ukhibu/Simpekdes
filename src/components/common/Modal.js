import React from 'react';
import { FiX } from 'react-icons/fi'; // Menggunakan ikon dari react-icons

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) {
        return null;
    }

    return (
        // Backdrop (latar belakang gelap)
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
            onClick={onClose} // Menutup modal saat mengklik di luar konten
        >
            {/* Konten Modal */}
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-100"
                onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup saat mengklik di dalam konten
            >
                {/* Header Modal */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-700 p-1 rounded-full transition-colors"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Body Modal (Konten dinamis) */}
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
