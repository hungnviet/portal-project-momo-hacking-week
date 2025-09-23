import React from 'react';

interface TigerLoaderProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function TigerLoader({ size = 'md', className = '' }: TigerLoaderProps) {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
            <img
                src="https://static.momocdn.net/files/Y3ZzdGVjaGRheTIwMjU=/media/tiger.gif"
                alt="Loading tiger"
                className="w-full h-full object-contain"
                style={{
                    maxWidth: '100%',
                    maxHeight: '100%'
                }}
            />
        </div>
    );
}