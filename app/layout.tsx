import '@mantine/core/styles.css';

import React from 'react';
import { Space_Mono } from 'next/font/google';
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core';
import { theme } from '../theme';
import StoreProvider from './client/store/StoreProvider';

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
  weight: ['400', '700'],
});

export const metadata = {
  title: '[distiller]',
  description: 'welcome to distiller',
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <StoreProvider>
      <html lang="en" {...mantineHtmlProps} className={spaceMono.variable}>
        <head>
          <ColorSchemeScript />
          <link rel="shortcut icon" href="/favicon.svg" />
          <meta
            name="viewport"
            content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
          />
        </head>
        <body>
          <MantineProvider theme={theme}>{children}</MantineProvider>
        </body>
      </html>
    </StoreProvider>
  );
}
