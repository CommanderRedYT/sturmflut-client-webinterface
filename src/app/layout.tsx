import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import type { FC, PropsWithChildren } from 'react';

import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Sturmflut Webinterface',
};

const RootLayout: FC<PropsWithChildren> = ({ children }) => (
    <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
            {children}
        </body>
    </html>
);

export default RootLayout;
