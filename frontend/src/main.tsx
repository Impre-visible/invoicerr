import './index.css'

import { AuthProvider } from './contexts/auth'
import { Routes } from '@generouted/react-router'
import { Toaster } from '@/components/ui/sonner'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
    <AuthProvider>
        <Routes />
        <Toaster richColors position='top-right' />
    </AuthProvider>
)
