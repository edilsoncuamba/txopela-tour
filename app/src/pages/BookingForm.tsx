import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, Users, DollarSign, Check } from 'lucide-react';
import { servicesApi } from '@/services/api';
import type { Local } from '@/types';
import { useScrollTop } from '@/hooks/useScrollTop';

interface BookingFormProps {
  local: Local;
  onBack: () => void;
  onSuccess: () => void;
}

function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1">
      <motion.span className="w-2 h-2 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
      <motion.span className="w-2 h-2 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
      <motion.span className="w-2 h-2 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} />
    </div>
  );
}

export default function BookingForm({
  local, onBack, onSuccess }: BookingFormProps) {
  useScrollTop();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [pricePerNight, setPricePerNight] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, nights);
  };

  const nights = calculateNights();
  const totalPrice = nights * pricePerNight;

  const handleSubmit = async () => {
    setError('');

    if (!checkIn || !checkOut) {
      setError('Selecione as datas de check-in e check-out');
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      setError('Data de check-out deve ser após check-in');
      return;
    }

    if (guestsCount < 1) {
      setError('Mínimo 1 hóspede');
      return;
    }

    setIsLoading(true);
    try {
      // POST /api/services/{id}/bookings/ — reserva associada ao local como serviço
      const { data, error: apiError } = await servicesApi.book(local.id, {
        startDate: new Date(checkIn).toISOString(),
        endDate: new Date(checkOut).toISOString(),
        participants: guestsCount,
        specialRequests: specialRequests || undefined,
      });

      if (data) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else if (apiError) {
        setError(apiError);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar reserva');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
        >
          <Check size={40} className="text-green-600" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reserva Criada!</h2>
        <p className="text-gray-600 text-center">Sua reserva foi criada com sucesso. Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Reservar {local.name}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Location Preview */}
          <div className="bg-white rounded-lg overflow-hidden">
            {local.images?.[0] && (
              <img src={local.images[0]} alt={local.name} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <h2 className="text-xl font-bold text-gray-900">{local.name}</h2>
              <p className="text-gray-600 text-sm mt-1">{local.description}</p>
            </div>
          </div>

          {/* Check-in Date */}
          <div className="bg-white rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={18} />
              Data de Check-in
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
            />
          </div>

          {/* Check-out Date */}
          <div className="bg-white rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={18} />
              Data de Check-out
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
            />
          </div>

          {/* Guests Count */}
          <div className="bg-white rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users size={18} />
              Número de Hóspedes
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
              >
                −
              </button>
              <span className="text-2xl font-bold text-gray-900 w-12 text-center">{guestsCount}</span>
              <button
                onClick={() => setGuestsCount(guestsCount + 1)}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Price per Night */}
          <div className="bg-white rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign size={18} />
              Preço por Noite (R$)
            </label>
            <input
              type="number"
              value={pricePerNight}
              onChange={(e) => setPricePerNight(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
            />
          </div>

          {/* Special Requests */}
          <div className="bg-white rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pedidos Especiais</label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Ex: Quarto com vista, cama king size, etc."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0077B6] resize-none"
              rows={4}
            />
          </div>

          {/* Price Summary */}
          <div className="bg-white rounded-lg p-4 border-2 border-[#0077B6]">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>R$ {pricePerNight.toFixed(2)} × {nights} noite(s)</span>
                <span>R$ {(pricePerNight * nights).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>R$ {totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
            >
              {error}
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={isLoading || !checkIn || !checkOut}
            onClick={handleSubmit}
            className="w-full py-4 bg-[#0077B6] text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#0077B6]/30 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingDots />
                <span>Criando Reserva</span>
              </>
            ) : (
              <>
                <Check size={20} />
                Confirmar Reserva
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
