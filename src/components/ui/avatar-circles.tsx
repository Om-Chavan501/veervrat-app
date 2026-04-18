import React from 'react';

import Image from 'next/image';
import Link from 'next/link';

export interface IAvatarData {
    icon: string;
    link: string | undefined;
    label?: string;
}

interface IAvatarCirclesProps {
    className?: string;
    avatarData?: Array<IAvatarData>;
    isLoading?: boolean;
}

const AvatarCircles: React.FC<IAvatarCirclesProps> = ({ className, avatarData, isLoading = false }) => {
    const displayData = isLoading ? Array.from({ length: 4 }, () => ({ icon: '', link: '' })) : avatarData;

    return (
        <div className={`flex -space-x-4 rtl:space-x-reverse ${className}`}>
            {displayData?.map((data, index) => data.link && (
                <Link key={index} style={{ zIndex: index }} className={`group flex items-center justify-center size-9 rounded-full border-2 border-muted-background shadow-sm hover:-translate-y-1 hover:scale-105 transform transition-all duration-300 ease-in-out ${isLoading ? 'animate-pulse' : 'bg-muted hover:bg-muted-foreground'}`}
                    prefetch={false} target="_blank" rel="noopener noreferrer" href={data.link || '#'}>
                    {!isLoading && data.icon ? <Image className="size-4" src={data.icon} alt={`Avatar ${index + 1}`} width={16} height={16} /> : null}
                </Link>
            ))}
        </div>
    );
};

export default AvatarCircles;
