import { FOOTER_LINKS, NAV_LINKS, SITE_CONFIG, SOCIAL_LINKS } from '@/constants/siteConstants';
import Link from 'next/link';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const quickLinksHeading = 'Quick Links';
    const contactHeading = 'Get in Touch';
    const contactDescription = 'Open for freelance projects and collaboration opportunities.';
    const copyrightText = `© ${currentYear} ${SITE_CONFIG.name}. All rights reserved.`;

    const PRIMARY_IDS = ['github', 'linkedin', 'X', 'instagram', 'ytmusic', 'facebook'];

    const primarySocials = SOCIAL_LINKS.filter((link) => PRIMARY_IDS.includes(link.id));

    return (
        <footer className='relative border-border' role='contentinfo'>
            <div className='mx-auto grid gap-8 px-5 py-12 md:grid-cols-3 md:px-10 max-w-5xl'>
                <section className='flex flex-col gap-4'>
                    <Link
                        href='/'
                        className='inline-flex text-h4 font-semibold text-foreground transition-base hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    >
                        {SITE_CONFIG.name}
                    </Link>
                    <p className='max-w-xs text-body text-muted-foreground'>{SITE_CONFIG.description}</p>
                    <nav className='flex items-center gap-3' aria-label='Footer social links'>
                        {primarySocials.map((link) => {
                            const Icon = link.icon;

                            return (
                                <Link
                                    key={link.id}
                                    href={link.url}
                                    target={link.isExternal ? '_blank' : undefined}
                                    rel={link.isExternal ? 'noopener noreferrer' : undefined}
                                    className='inline-flex items-center justify-center p-2 size-10 text-muted-foreground bg-secondary border border-border rounded-md transition-base hover:text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                    aria-label={link.ariaLabel}
                                    title={link.platform}
                                >
                                    <Icon className='size-5' aria-hidden='true' />
                                </Link>
                            );
                        })}
                    </nav>
                </section>

                <section className='flex flex-col gap-4'>
                    <h2 className='text-label font-semibold uppercase tracking-widest text-foreground'>{quickLinksHeading}</h2>
                    <nav className='flex flex-col gap-2' aria-label='Footer quick links'>
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className='inline-flex text-body text-muted-foreground transition-base hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </section>

                <section className='flex flex-col gap-4'>
                    <h2 className='text-label font-semibold uppercase tracking-widest text-foreground'>{contactHeading}</h2>
                    <div className='flex flex-col gap-2'>
                        <Link
                            href={`mailto:${SITE_CONFIG.email}`}
                            className='inline-flex text-body text-muted-foreground transition-base hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        >
                            {SITE_CONFIG.email}
                        </Link>
                        <p className='text-body text-muted-foreground'>{contactDescription}</p>
                    </div>
                </section>
            </div>

            <div className='mx-auto flex flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row md:px-10 max-w-5xl border-t border-border'>
                <p className='text-center text-small text-muted-foreground sm:text-left'>{copyrightText}</p>
                <nav className='flex items-center gap-6' aria-label='Footer legal links'>
                    {FOOTER_LINKS.legal.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className='inline-flex text-small text-muted-foreground transition-base hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </footer>
    );
};

export default Footer;
