'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface HeaderProps {
    title?: string;
    subtitle?: string;
    showBackButton?: boolean;
    backHref?: string;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    lastUpdated?: Date;
    children?: React.ReactNode;
}

export default function Header({
    title = 'Request Hub',
    subtitle = 'Centralize decentralized workflows',
    showBackButton = false,
    backHref = '/',
    onRefresh,
    isRefreshing = false,
    lastUpdated,
    children
}: HeaderProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="relative bg-white border-b border-pink-100 shadow-sm">
            {/* Gradient background overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-50 via-white to-blue-50 opacity-70"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between">
                    {/* Left section - Logo and title */}
                    <div className="flex items-center space-x-4">
                        {showBackButton && (
                            <Link
                                href={backHref}
                                className="inline-flex items-center p-2 rounded-lg hover:bg-white/50 transition-colors group"
                            >
                                <svg className="w-5 h-5 text-gray-600 group-hover:text-pink-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span className="ml-1 text-sm font-medium text-gray-600 group-hover:text-indigo-600 transition-colors">Back</span>
                            </Link>
                        )}

                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity blur-lg"></div>
                                <div className="relative bg-white rounded-xl p-2 shadow-sm group-hover:shadow-md transition-shadow">
                                    <Image
                                        src="/logo.png"
                                        alt="Project Portal Logo"
                                        width={40}
                                        height={40}
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            </div>

                            {/* Title and subtitle */}
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold gradient-text group-hover:scale-105 transition-transform">
                                    {title}
                                </h1>
                                <p className="text-sm text-gray-600 mt-1 hidden sm:block">
                                    {subtitle}
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* Right section - Actions and info */}
                    <div className="flex items-center space-x-4">
                        {/* Last updated info */}
                        {mounted && lastUpdated && (
                            <div className="hidden md:flex flex-col text-right">
                                <span className="text-xs text-gray-500">Last updated</span>
                                <span className="text-sm font-medium text-gray-700">
                                    {lastUpdated.toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        )}

                        {/* Refresh button */}
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                disabled={isRefreshing}
                                className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                                title="Refresh data"
                            >
                                <svg
                                    className={`w-4 h-4 mr-2 transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                <span className="hidden sm:inline">
                                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                </span>
                            </button>
                        )}

                        {/* Custom children (like Create Project button) */}
                        {children}
                    </div>
                </div>
            </div>
        </header>
    );
}