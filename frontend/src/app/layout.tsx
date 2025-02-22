"use client"
import './globals.css'
import { ThemeProvider, createTheme } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { ClerkProvider, SignedIn, UserButton } from '@clerk/nextjs'
import { Inter } from 'next/font/google'


// Move metadata to a separate server component file (e.g., metadata.ts)
// Remove the metadata export from here

// Extend the Theme type to include custom colors
declare module '@mui/material/styles' {
  interface Palette {
    navy: Palette['primary'];
  }
  interface PaletteOptions {
    navy?: PaletteOptions['primary'];
  }
}

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const theme = createTheme({
    palette: {
      primary: {
        main: "#0A449F",
      },
      navy: {
        500: "#1B365D",
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            fontWeight: 700,
          },
          contained: {
            color: "#FFF",
            "&:hover": {
              color: "#FFF",
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          h4: {
            color: "#1B365D",
            fontWeight: 700,
          },
        },
      },
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

const inter = Inter({ subsets: ['latin'] })

// Keep the root layout as a server component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <header style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <SignedIn>
              <UserButton afterSignOutUrl="/"/>
            </SignedIn>
          </header>
          <ThemeWrapper>{children}</ThemeWrapper>
        </body>
      </html>
    </ClerkProvider>
  )
} 