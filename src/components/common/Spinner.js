import React from 'react';

const Spinner = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
    };

    return (
        <div className="flex justify-center items-center p-4">
            <div 
                className={`animate-spin rounded-full border-4 border-t-blue-600 border-gray-200 ${sizeClasses[size]}`}
            >
            </div>
        </div>
    );
};

export default Spinner;
