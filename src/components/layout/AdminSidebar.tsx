'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SITE_CONFIG } from '@/constants/siteConstants';
import { cn } from '@/lib/utils';
import { BookOpen, FileText, FolderKanban, ImageIcon, Layers, LayoutDashboard, Mail, Menu, MessageSquare, Settings, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface INavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: number;
}

const navItems: INavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Topics', href: '/admin/topics', icon: Layers },
    { label: 'Subtopics', href: '/admin/subtopics', icon: Layers },
    { label: 'Articles', href: '/admin/articles', icon: FileText },
    { label: 'Blogs', href: '/admin/blogs', icon: BookOpen },
    { label: 'Projects', href: '/admin/projects', icon: FolderKanban },
    { label: 'Media', href: '/admin/media', icon: ImageIcon },
    { label: 'Comments', href: '/admin/comments', icon: MessageSquare },
    { label: 'Contacts', href: '/admin/contacts', icon: MessageSquare },
    { label: 'Subscribers', href: '/admin/subscribers', icon: Mail },
    { label: 'Newsletters', href: '/admin/newsletters', icon: Mail },
];

const bottomNavItems: INavItem[] = [{ label: 'Settings', href: '/admin/settings', icon: Settings }];

// Icon width + padding
const ICON_RAIL_WIDTH = 64; // w-16
const EXPANDED_WIDTH = 256; // w-64

const AdminSidebar = (): React.ReactElement => {
    const pathname = usePathname();
    const [isHovered, setIsHovered] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const isActive = (href: string): boolean => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

    // Desktop nav item with fixed icon position
    const DesktopNavItem = ({ item }: { item: INavItem }) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href={item.href}
                        className={cn(
                            // Layout
                            'relative flex items-center',
                            // Sizing - fixed height
                            'h-10 w-full',
                            // Typography
                            'text-sm font-medium',
                            // Transitions
                            'transition-colors duration-150',
                            // States
                            active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {/* Icon container - fixed position */}
                        <div
                            className={cn(
                                'flex shrink-0 items-center justify-center',
                                'h-10 w-10 rounded-lg',
                                'transition-colors duration-150',
                                active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                            )}
                        >
                            <Icon className='h-5 w-5' />
                        </div>

                        {/* Label - slides in from right */}
                        <div
                            className={cn(
                                'absolute left-12 flex items-center gap-2',
                                'whitespace-nowrap',
                                'transition-all duration-200 ease-out',
                                isHovered ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 pointer-events-none',
                            )}
                        >
                            <span>{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground'>{item.badge}</span>
                            )}
                        </div>
                    </Link>
                </TooltipTrigger>
                {!isHovered && (
                    <TooltipContent side='right' sideOffset={8}>
                        {item.label}
                    </TooltipContent>
                )}
            </Tooltip>
        );
    };

    // Mobile nav item - full width with label always visible
    const MobileNavItem = ({ item }: { item: INavItem }) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
            <Link
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5',
                    'text-sm font-medium',
                    'transition-colors duration-150',
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
            >
                <Icon className='h-5 w-5 shrink-0' />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                    <span className='ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground'>{item.badge}</span>
                )}
            </Link>
        );
    };

    return (
        <TooltipProvider delayDuration={100}>
            {/* Mobile Menu Button - shown in header on mobile */}
            <Button variant='ghost' size='icon' className='fixed left-4 top-4 z-50 h-9 w-9 lg:hidden' onClick={() => setIsMobileOpen(true)} aria-label='Open menu'>
                <Menu className='h-5 w-5' />
            </Button>

            {/* Mobile Sheet */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetContent side='left' className='w-72 p-0' showCloseButton={false}>
                    <SheetHeader className='border-b border-border px-4 py-4'>
                        <div className='flex items-center gap-3'>
                            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground'>A</div>
                            <div className='flex flex-col'>
                                <SheetTitle className='text-sm font-semibold'>{SITE_CONFIG.name}</SheetTitle>
                                <span className='text-xs text-muted-foreground'>Admin Panel</span>
                            </div>
                        </div>
                    </SheetHeader>

                    <nav className='flex-1 space-y-1 overflow-y-auto p-3'>
                        {navItems.map((item) => (
                            <MobileNavItem key={item.href} item={item} />
                        ))}
                    </nav>

                    <div className='border-t border-border p-3'>
                        {bottomNavItems.map((item) => (
                            <MobileNavItem key={item.href} item={item} />
                        ))}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    // Positioning
                    'sticky top-0 z-30',
                    // Layout
                    'hidden h-screen flex-col lg:flex',
                    // Sizing - smooth width transition
                    'overflow-hidden',
                    // Background & Border
                    'border-r border-border bg-card',
                    // Transitions
                    'transition-[width] duration-300 ease-out',
                )}
                style={{
                    width: isHovered ? EXPANDED_WIDTH : ICON_RAIL_WIDTH,
                }}
            >
                {/* Logo */}
                <div className='flex h-16 items-center border-b border-border px-3'>
                    <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground shadow-sm'>A</div>
                    <div className={cn('ml-3 flex flex-col whitespace-nowrap', 'transition-all duration-200 ease-out', isHovered ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0')}>
                        <span className='text-sm font-semibold text-foreground'>{SITE_CONFIG.name}</span>
                        <span className='text-xs text-muted-foreground'>Admin Panel</span>
                    </div>
                </div>

                {/* Main Navigation */}
                <nav className='flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4'>
                    {navItems.map((item) => (
                        <DesktopNavItem key={item.href} item={item} />
                    ))}
                </nav>

                {/* Bottom Navigation */}
                <div className='space-y-1 border-t border-border px-3 py-4'>
                    {bottomNavItems.map((item) => (
                        <DesktopNavItem key={item.href} item={item} />
                    ))}
                </div>
            </aside>
        </TooltipProvider>
    );
};

export default AdminSidebar;
