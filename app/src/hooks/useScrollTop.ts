import { useEffect } from 'react';

/**
 * Faz scroll ao topo da página imediatamente ao montar o componente.
 * Usar em todas as páginas / ecrãs de nível superior para garantir
 * que o utilizador vê sempre o início do conteúdo ao navegar.
 *
 * Uso:
 *   import { useScrollTop } from '@/hooks/useScrollTop';
 *   export default function MinhaPage() {
 *     useScrollTop();
 *     ...
 *   }
 */
export function useScrollTop() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, []);
}
