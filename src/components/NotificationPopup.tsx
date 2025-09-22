'use client';

import { useEffect } from 'react';

interface NotificationPopupProps {
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    onClose: () => void;
    autoClose?: boolean;
    duration?: number;
}

export default function NotificationPopup({
    isOpen,
    type,
    title,
    message,
    onClose,
    autoClose = true,
    duration = 3000
}: NotificationPopupProps) {
    useEffect(() => {
        if (isOpen && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, duration, onClose]);

    if (!isOpen) return null;

    const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
    const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const iconBgColor = type === 'success' ? 'bg-green-100' : 'bg-red-100';
    const iconTextColor = type === 'success' ? 'text-green-600' : 'text-red-600';
    const icon = type === 'success' ? '✓' : '✕';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${bgColor} border ${borderColor} rounded-lg p-6 max-w-md w-full mx-4 shadow-lg`}>
                <div className="flex items-start">
                    <div className={`${iconBgColor} rounded-full p-2 mr-3 flex-shrink-0`}>
                        <span className={`${iconTextColor} font-bold text-lg`}>{icon}</span>
                    </div>
                    <div className="flex-1">
                        <h3 className={`${textColor} font-semibold text-lg mb-2`}>
                            {title}
                        </h3>
                        <p className={`${textColor} text-sm mb-4`}>
                            {message}
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'success'
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}