'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ReactNode } from 'react';

interface IThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider = ({ children }: IThemeProviderProps) => {
    return (
        <NextThemesProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
            {children}
        </NextThemesProvider>
    );
};
