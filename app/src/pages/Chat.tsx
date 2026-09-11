import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Send, Search, MessageCircle, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { chatApi } from '@/services/api';
import { useScrollTop } from '@/hooks/useScrollTop';

interface ChatProps {
  onBack: () => void;
}

interface Conversation {
  id: string;
  participants: any[];
  last_message?: {
    content: string;
    sender: any;
    created_at: string;
  };
  unread_count: number;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  sender: any;
  content: string;
  is_read: boolean;
  created_at: string;
  isAI?: boolean;
}

export default function Chat({
  onBack }: ChatProps) {
  useScrollTop();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [useAI, setUseAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const { data } = await chatApi.listConversations();
      setConversations(data || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;
    try {
      const { data } = await chatApi.getConversation(selectedConversation.id);
      if (data?.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const userMessage = messageInput;
    setMessageInput('');

    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: user,
      content: userMessage,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newUserMessage]);

    if (useAI) {
      setIsLoading(true);
      try {
        const baseUrl = (import.meta.env.VITE_API_URL as string || 'http://192.168.88.127:8000/api').replace(/\/api$/, '');
        const response = await fetch(`${baseUrl}/api/chat/ai/response/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            history: messages.map(m => ({
              role: m.isAI ? 'assistant' : 'user',
              content: m.content
            }))
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            sender: {
              id: 'ai',
              name: 'Assistente IA',
              avatar: undefined
            },
            content: data.response,
            is_read: true,
            created_at: new Date().toISOString(),
            isAI: true
          };
          setMessages(prev => [...prev, aiMessage]);
        }
      } catch (err) {
        console.error('Failed to get AI response:', err);
      } finally {
        setIsLoading(false);
      }
    } else if (selectedConversation) {
      try {
        await chatApi.sendMessage(selectedConversation.id, userMessage);
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }
  };

  const getOtherUser = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== user?.id);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR');
  };

  if (selectedConversation) {
    const otherUser = getOtherUser(selectedConversation);

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSelectedConversation(null)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{otherUser?.name}</h2>
            <p className="text-xs text-gray-500">Online</p>
          </div>
          <button
            onClick={() => setUseAI(!useAI)}
            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
              useAI
                ? 'bg-[#0077B6] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Zap size={14} />
            IA
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Nenhuma mensagem ainda</p>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.sender.id === user?.id
                      ? 'bg-[#0077B6] text-white'
                      : message.isAI
                      ? 'bg-purple-100 text-purple-900'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.isAI && <p className="text-xs font-bold mb-1">?? Assistente IA</p>}
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.sender.id === user?.id ? 'text-blue-100' : message.isAI ? 'text-purple-700' : 'text-gray-500'}`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </motion.div>
            ))
          )}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-purple-100 text-purple-900 px-4 py-2 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-900 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-900 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-purple-900 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 px-4 py-3 flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={useAI ? "Pergunte ao assistente IA..." : "Digite uma mensagem..."}
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isLoading}
            className="w-10 h-10 bg-[#0077B6] text-white rounded-full flex items-center justify-center hover:bg-[#005a8f] disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Mensagens</h1>
      </div>

      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#0077B6]/30 border-t-[#0077B6] rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <MessageCircle size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-600">Nenhuma conversa ainda</p>
          </div>
        ) : (
          <AnimatePresence>
            {conversations.map((conversation, index) => {
              const otherUser = getOtherUser(conversation);
              return (
                <motion.button
                  key={conversation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedConversation(conversation)}
                  className="w-full px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0077B6] to-[#2D6A4F] flex items-center justify-center text-white font-semibold">
                      {otherUser?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{otherUser?.name}</h3>
                        <p className="text-xs text-gray-500">{formatTime(conversation.updated_at)}</p>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message?.content || 'Nenhuma mensagem'}
                      </p>
                    </div>
                    {conversation.unread_count > 0 && (
                      <div className="w-6 h-6 bg-[#0077B6] rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {conversation.unread_count}
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
