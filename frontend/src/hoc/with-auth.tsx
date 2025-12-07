import { Navigate, useLocation } from 'react-router';

import React from 'react';
import { useAuth } from '@/contexts/auth';

export function withAuth(
    Component: React.ComponentType
) {
    const Wrapped: React.FC = (props) => {
        const { user, loading } = useAuth();
        const loc = useLocation();
        if (loading) return null;
        if (!user) return <Navigate to="/auth/sign-in" replace state={{ from: loc }} />;
        return <Component {...props} />;
    };

    Wrapped.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;
    return Wrapped;
}
