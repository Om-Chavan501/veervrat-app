const NotFound = () => {
    return (
        <main className='flex flex-col items-center justify-center gap-6 px-4 min-h-[60vh]'>
            <div className='flex flex-col items-center gap-2 text-center'>
                <span className='text-8xl font-bold text-muted-foreground/30'>404</span>
                <h1 className='text-h1 text-foreground'>Page not found</h1>
                <p className='max-w-md text-regular text-muted-foreground'>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
            </div>
            <div className='flex gap-3'></div>
        </main>
    );
};

export default NotFound;
