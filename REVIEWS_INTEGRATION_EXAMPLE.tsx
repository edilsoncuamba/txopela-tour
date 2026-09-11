/**
 * EXEMPLO DE INTEGRAÇÃO DO REVIEWMANAGER
 * 
 * Este arquivo mostra como integrar o componente ReviewManager
 * nas páginas de detalhes de locais e serviços.
 * 
 * NÃO é um arquivo funcional, apenas um guia de implementação.
 */

// ═══════════════════════════════════════════════════════════════════════════
// EXEMPLO 1: Integração em DestinationDetail (Local)
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { localsApi } from '@/services/api';
import ReviewManager from '@/components/ReviewManager';

function DestinationDetailWithReviews({ localId }: { localId: string }) {
  const [local, setLocal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadLocal = async () => {
    try {
      setLoading(true);
      const { data } = await localsApi.get(localId);
      setLocal(data);
    } catch (error) {
      console.error('Erro ao carregar local:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocal();
  }, [localId]);

  if (loading) return <div>Carregando...</div>;
  if (!local) return <div>Local não encontrado</div>;

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F0' }}>
      {/* Imagens do local */}
      <div className="relative h-80">
        <img 
          src={local.images?.[0] || '/placeholder.jpg'} 
          alt={local.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Informações básicas */}
        <div>
          <h1 className="text-2xl font-black mb-2" style={{ color: '#1A1A1A' }}>
            {local.name}
          </h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            {local.description}
          </p>
        </div>

        {/* Rating resumo */}
        <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
          <div className="text-center">
            <div className="text-3xl font-black" style={{ color: '#1B5E3B' }}>
              {local.rating?.average?.toFixed(1) || '0.0'}
            </div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>
              {local.rating?.count || 0} avaliações
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold mb-1" style={{ color: '#1A1A1A' }}>
              Classificação geral
            </div>
            <div className="text-xs" style={{ color: '#6B7280' }}>
              Baseado em avaliações verificadas
            </div>
          </div>
        </div>

        {/* Localização, contactos, horários, etc */}
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-lg font-black mb-3" style={{ color: '#1A1A1A' }}>
            Informações
          </h3>
          {/* ... resto das informações ... */}
        </div>

        {/* 🌟 SISTEMA DE REVIEWS - INTEGRAÇÃO AQUI 🌟 */}
        <ReviewManager
          resourceType="local"
          resourceId={localId}
          showCreateForm={true}
          onReviewsUpdated={() => {
            // Recarregar local para atualizar rating médio
            loadLocal();
          }}
        />

        {/* Locais relacionados */}
        <div>
          <h3 className="text-lg font-black mb-3" style={{ color: '#1A1A1A' }}>
            Locais semelhantes
          </h3>
          {/* ... grid de locais relacionados ... */}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXEMPLO 2: Integração em ServiceDetail (Serviço)
// ═══════════════════════════════════════════════════════════════════════════

import { servicesApi } from '@/services/api';

function ServiceDetailWithReviews({ serviceId }: { serviceId: string }) {
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadService = async () => {
    try {
      setLoading(true);
      const { data } = await servicesApi.get(serviceId);
      setService(data);
    } catch (error) {
      console.error('Erro ao carregar serviço:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadService();
  }, [serviceId]);

  if (loading) return <div>Carregando...</div>;
  if (!service) return <div>Serviço não encontrado</div>;

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F0' }}>
      {/* Cabeçalho do serviço */}
      <div className="bg-white px-4 py-6">
        <h1 className="text-2xl font-black mb-2" style={{ color: '#1A1A1A' }}>
          {service.title}
        </h1>
        
        {/* Provedor */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={service.provider?.avatar || '/avatar-placeholder.png'}
            alt={service.provider?.name}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <div className="text-sm font-bold" style={{ color: '#1A1A1A' }}>
              {service.provider?.name}
            </div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>
              ⭐ {service.provider?.rating?.toFixed(1)} • {service.provider?.reviewsCount} avaliações
            </div>
          </div>
        </div>

        <p className="text-sm" style={{ color: '#6B7280' }}>
          {service.description}
        </p>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Preços */}
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-lg font-black mb-3" style={{ color: '#1A1A1A' }}>
            Preços
          </h3>
          <div className="text-2xl font-black" style={{ color: '#1B5E3B' }}>
            {service.pricing?.amount} {service.pricing?.currency || 'AOA'}
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>
            {service.pricing?.type === 'per_person' && 'Por pessoa'}
            {service.pricing?.type === 'hourly' && 'Por hora'}
            {service.pricing?.type === 'daily' && 'Por dia'}
          </div>
        </div>

        {/* Características */}
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-lg font-black mb-3" style={{ color: '#1A1A1A' }}>
            O que está incluído
          </h3>
          <ul className="space-y-2">
            {service.features?.map((feature: string, index: number) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <span style={{ color: '#1B5E3B' }}>✓</span>
                <span style={{ color: '#4B5563' }}>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 🌟 SISTEMA DE REVIEWS - INTEGRAÇÃO AQUI 🌟 */}
        <ReviewManager
          resourceType="service"
          resourceId={serviceId}
          showCreateForm={true}
          onReviewsUpdated={() => {
            // Recarregar serviço para atualizar rating
            loadService();
          }}
        />

        {/* Botão de reserva */}
        <button
          className="w-full py-4 rounded-2xl text-lg font-bold text-white"
          style={{ background: '#1B5E3B' }}
        >
          Reservar agora
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXEMPLO 3: Modal de Review Rápida (opcional)
// ═══════════════════════════════════════════════════════════════════════════

function QuickReviewModal({
  resourceType,
  resourceId,
  onClose,
  onSuccess,
}: {
  resourceType: 'local' | 'service';
  resourceId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      const body = { rating, comment };
      const response = resourceType === 'local'
        ? await reviewsApi.createForLocal(resourceId, body)
        : await reviewsApi.createForService(resourceId, body);

      if (response.error) {
        alert(response.error);
        return;
      }

      onSuccess();
      onClose();
    } catch (error) {
      alert('Erro ao criar avaliação');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-xl font-black mb-4" style={{ color: '#1A1A1A' }}>
          Deixa a tua avaliação
        </h2>

        {/* Rating */}
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" style={{ color: '#1A1A1A' }}>
            Avaliação
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="text-3xl"
              >
                {rating >= star ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>

        {/* Comentário */}
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" style={{ color: '#1A1A1A' }}>
            Comentário
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partilha a tua experiência..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border text-sm"
            style={{ borderColor: '#E5E7EB' }}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting || !comment.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: submitting ? '#9CA3AF' : '#1B5E3B' }}
          >
            {submitting ? 'A enviar...' : 'Publicar'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold"
            style={{ background: '#F3F4F6', color: '#6B7280' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXEMPLO 4: Lista de Minhas Reviews no Perfil
// ═══════════════════════════════════════════════════════════════════════════

function MyReviewsTab({ userId }: { userId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMyReviews() {
      try {
        setLoading(true);
        const { data } = await reviewsApi.list({ author: userId, sortBy: 'recent' });
        setReviews(data?.reviews || []);
      } catch (error) {
        console.error('Erro ao carregar minhas reviews:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMyReviews();
  }, [userId]);

  if (loading) return <div>Carregando...</div>;

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-2">
        <div className="text-5xl">⭐</div>
        <p className="text-sm font-bold" style={{ color: '#9CA3AF' }}>
          Ainda não fizeste nenhuma avaliação
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white rounded-2xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="text-sm font-bold mb-1" style={{ color: '#1A1A1A' }}>
                {/* Nome do local/serviço */}
                {review.local?.name || review.service?.title}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-sm">
                    {review.rating >= star ? '⭐' : '☆'}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>
              {new Date(review.createdAt).toLocaleDateString('pt-PT')}
            </div>
          </div>
          <p className="text-sm" style={{ color: '#4B5563' }}>
            {review.comment}
          </p>
          {review.helpful > 0 && (
            <div className="mt-2 text-xs" style={{ color: '#9CA3AF' }}>
              👍 {review.helpful} {review.helpful === 1 ? 'pessoa achou' : 'pessoas acharam'} útil
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXEMPLO 5: Widget de Rating Resumido
// ═══════════════════════════════════════════════════════════════════════════

function RatingSummaryWidget({
  average,
  count,
  distribution,
}: {
  average: number;
  count: number;
  distribution?: { 5: number; 4: number; 3: number; 2: number; 1: number };
}) {
  const total = distribution
    ? Object.values(distribution).reduce((sum, val) => sum + val, 0)
    : count;

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-start gap-6 mb-6">
        {/* Média */}
        <div className="text-center">
          <div className="text-5xl font-black mb-1" style={{ color: '#1B5E3B' }}>
            {average.toFixed(1)}
          </div>
          <div className="flex items-center gap-1 justify-center mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className="text-sm">
                {average >= star ? '⭐' : '☆'}
              </span>
            ))}
          </div>
          <div className="text-xs" style={{ color: '#9CA3AF' }}>
            {count} {count === 1 ? 'avaliação' : 'avaliações'}
          </div>
        </div>

        {/* Distribuição */}
        {distribution && (
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const starCount = distribution[star as keyof typeof distribution] || 0;
              const percentage = total > 0 ? (starCount / total) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs w-8" style={{ color: '#6B7280' }}>
                    {star} ⭐
                  </span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: '#E5E7EB' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: '#1B5E3B',
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right" style={{ color: '#9CA3AF' }}>
                    {starCount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        className="w-full py-3 rounded-xl text-sm font-bold"
        style={{ background: '#1B5E3B', color: 'white' }}
      >
        Ver todas as avaliações
      </button>
    </div>
  );
}

export {
  DestinationDetailWithReviews,
  ServiceDetailWithReviews,
  QuickReviewModal,
  MyReviewsTab,
  RatingSummaryWidget,
};
