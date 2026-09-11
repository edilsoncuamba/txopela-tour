import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollTop } from '@/hooks/useScrollTop';

interface ApprovalItem {
  id: string;
  type: 'user' | 'local' | 'service' | 'post';
  title: string;
  description: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  data: Record<string, any>;
}

export default function Approver() {
  useScrollTop();
  const [searchParams] = useSearchParams();
  const approverName = searchParams.get('name') || 'Aprovador';
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de itens para aprovação
    const mockItems: ApprovalItem[] = [
      {
        id: '1',
        type: 'local',
        title: 'Praia do Tofo - Novo Local',
        description: 'Um novo local turístico em Inhambane',
        submittedBy: 'João Silva',
        submittedAt: new Date().toISOString(),
        status: 'pending',
        data: { province: 'Inhambane', category: 'Praia' }
      },
      {
        id: '2',
        type: 'user',
        title: 'Novo Usuário - Maria Costa',
        description: 'Registro de novo negócio de turismo',
        submittedBy: 'Maria Costa',
        submittedAt: new Date().toISOString(),
        status: 'pending',
        data: { profileType: 'business', email: 'maria@email.com' }
      },
      {
        id: '3',
        type: 'service',
        title: 'Serviço: Passeios de Barco',
        description: 'Nova oferta de serviço turístico',
        submittedBy: 'Carlos Mwale',
        submittedAt: new Date().toISOString(),
        status: 'approved',
        data: { category: 'Tours', price: 500 }
      }
    ];

    setTimeout(() => {
      setItems(mockItems);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredItems = items.filter(item =>
    filter === 'all' ? true : item.status === filter
  );

  const handleApprove = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, status: 'approved' } : item
    ));
  };

  const handleReject = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, status: 'rejected' } : item
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      user: 'bg-blue-100 text-blue-800',
      local: 'bg-green-100 text-green-800',
      service: 'bg-purple-100 text-purple-800',
      post: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Centro de Aprovações
              </h1>
              <p className="text-slate-600 mt-1">
                Aprovador: <span className="font-semibold text-emerald-600">{approverName}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-slate-900">
                {items.length}
              </div>
              <p className="text-slate-600">Total de solicitações</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status as typeof filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === status
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? 'Todos' : status === 'pending' ? 'Pendentes' : status === 'approved' ? 'Aprovados' : 'Rejeitados'}
                {' '}
                ({items.filter(i => status === 'all' ? true : i.status === status).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
            <p className="text-slate-600 mt-4">Carregando solicitações...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">
              {filter === 'pending' ? 'Nenhuma solicitação pendente' : `Nenhuma solicitação ${filter}`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(item.type)}`}>
                          {item.type === 'user' ? 'Usuário' : item.type === 'local' ? 'Local' : item.type === 'service' ? 'Serviço' : 'Post'}
                        </span>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          <span className={`text-xs font-medium ${
                            item.status === 'approved' ? 'text-green-600' :
                            item.status === 'rejected' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {item.status === 'pending' ? 'Pendente' : item.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {item.title}
                      </h3>

                      <p className="text-slate-600 mb-3">
                        {item.description}
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-600">Enviado por</p>
                          <p className="font-medium text-slate-900">{item.submittedBy}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Data</p>
                          <p className="font-medium text-slate-900">
                            {new Date(item.submittedAt).toLocaleDateString('pt-PT')}
                          </p>
                        </div>
                      </div>

                      {Object.keys(item.data).length > 0 && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs font-semibold text-slate-600 mb-2">DADOS</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(item.data).map(([key, value]) => (
                              <div key={key}>
                                <p className="text-slate-600 capitalize">{key}:</p>
                                <p className="font-medium text-slate-900">{String(value)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {item.status === 'pending' && (
                      <div className="flex gap-2 flex-col">
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                          <CheckCircle size={18} />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                          <XCircle size={18} />
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {items.filter(i => i.status === 'pending').length}
              </div>
              <p className="text-slate-600">Pendentes</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {items.filter(i => i.status === 'approved').length}
              </div>
              <p className="text-slate-600">Aprovados</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {items.filter(i => i.status === 'rejected').length}
              </div>
              <p className="text-slate-600">Rejeitados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
