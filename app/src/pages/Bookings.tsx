import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Calendar, Users, MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { bookingsApi } from '@/services/api';
import type { Local } from '@/types';
import { useScrollTop } from '@/hooks/useScrollTop';

interface BookingsProps {
  onBack: () => void;
  onLocalPress?: (local: Local) => void;
}

interface Booking {
  id: string;
  location: Local;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

type TabType = 'upcoming' | 'past';

export default function Bookings({
  onBack, onLocalPress }: BookingsProps) {
  useScrollTop();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // bookingsApi.list() com filtro de status
      const status = activeTab === 'upcoming' ? 'confirmed' : 'completed';
      const { data, error: apiError } = await bookingsApi.list({ status });
      
      if (data) {
        const list = (data as any).bookings ?? (data as any).results ?? (Array.isArray(data) ? data : []);
        setBookings(list);
      } else if (apiError) {
        setError(apiError);
      }
    } catch (err) {
      setError('Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      const { data, error: apiError } = await bookingsApi.updateStatus(bookingId, { status: 'cancelled' });
      if (data) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
      } else if (apiError) {
        setError(apiError);
      }
    } catch (err) {
      setError('Failed to cancel booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} />;
      case 'pending':
        return <AlertCircle size={16} />;
      case 'cancelled':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Minhas Reservas</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 flex gap-4">
        {(['upcoming', 'past'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#0077B6] text-[#0077B6]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'upcoming' ? 'Próximas' : 'Passadas'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#0077B6]/30 border-t-[#0077B6] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">
              {activeTab === 'upcoming' ? 'Nenhuma reserva próxima' : 'Nenhuma reserva passada'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {bookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Location Info */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex gap-3">
                      {booking.location.images?.[0] && (
                        <img
                          src={booking.location.images[0]}
                          alt={booking.location.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{booking.location.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <MapPin size={14} />
                          {booking.location.location?.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Check-in</p>
                        <p className="font-semibold text-gray-900">{formatDate(booking.check_in)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Check-out</p>
                        <p className="font-semibold text-gray-900">{formatDate(booking.check_out)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users size={16} />
                        <span className="text-sm">{booking.guests_count} hóspede(s)</span>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status === 'confirmed' && 'Confirmada'}
                        {booking.status === 'pending' && 'Pendente'}
                        {booking.status === 'cancelled' && 'Cancelada'}
                        {booking.status === 'completed' && 'Concluída'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-lg font-bold text-gray-900">
                        R$ {booking.total_price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {activeTab === 'upcoming' && booking.status !== 'cancelled' && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                      <button
                        onClick={() => onLocalPress?.(booking.location)}
                        className="flex-1 py-2 bg-[#0077B6] text-white rounded-lg font-medium hover:bg-[#005a8f] transition-colors"
                      >
                        Ver Local
                      </button>
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
