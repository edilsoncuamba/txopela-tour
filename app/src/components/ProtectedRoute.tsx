import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

// Roles definidos no OpenAPI UserRoleEnum
// tourist | local_resident | local_business | guide | curator | admin
export type AppRole = 'admin' | 'curator' | 'user';

interface ProtectedRouteProps {
  /** Role obrigatório para aceder */
  requiredRole: 'admin' | 'curator';
  /** Componente a renderizar se autorizado */
  children: React.ReactNode;
  /** Callback para redirecionar para o login correcto */
  onUnauthorized: (reason: 'no_token' | 'wrong_role') => void;
}

/**
 * Guard de rotas — verifica token JWT e role do utilizador.
 *
 * - Sem token            → chama onUnauthorized('no_token')  (via useEffect)
 * - Role incorrecto      → chama onUnauthorized('wrong_role') (via useEffect)
 * - Autorizado           → renderiza children
 *
 * Roles conforme OpenAPI UserRoleEnum:
 *   admin     → acede a /admin
 *   curator   → acede a /aprovador
 *
 * NOTA: o onUnauthorized é sempre chamado via useEffect para evitar
 * setState durante a fase de render de outro componente (React warning).
 */
export function ProtectedRoute({ requiredRole, children, onUnauthorized }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  const userRole    = user?.role || '';
  const hasAccess   = !isLoading && isAuthenticated && (
    (requiredRole === 'admin'   && userRole === 'admin') ||
    (requiredRole === 'curator' && (userRole === 'curator' || userRole === 'admin'))
  );
  const noToken     = !isLoading && !isAuthenticated;
  const wrongRole   = !isLoading && isAuthenticated && !hasAccess;

  // Chama onUnauthorized fora do render para não violar a regra do React
  useEffect(() => {
    if (noToken)   onUnauthorized('no_token');
    if (wrongRole) onUnauthorized('wrong_role');
  }, [noToken, wrongRole]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aguarda carregamento inicial
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="w-8 h-8 border-4 border-[#1B5E3B]/30 border-t-[#1B5E3B] rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) return null;

  return <>{children}</>;
}
