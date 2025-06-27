import './index.css'

import { AuthProvider } from './contexts/auth'
import { Routes } from '@generouted/react-router'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
    <ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
        <AuthProvider>
            <Routes />
            <Toaster richColors position='top-right' />
        </AuthProvider>
    </ThemeProvider>
)
