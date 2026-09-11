import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, X, CheckCircle, RefreshCw 
} from 'lucide-react';

// Colors from ApuradorDashboard
const P = '#1B5E3B';
const W = '#FFFFFF';
const G1 = '#F3F4F6';
const G2 = '#E5E7EB';
const G8 = '#1F2937';

interface ImprovedGalleryProps {
  images: string[];
  itemName: string;
  onClose: () => void;
  onApprove: () => void;
  onCorrect: () => void;
  onReject: () => void;
}

export default function ImprovedGallery({
  images,
  itemName,
  onClose,
  onApprove,
  onCorrect,
  onReject
}: ImprovedGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleRejectWithReason = () => {
    onReject();
    setShowRejectModal(false);
  };

  return (
    <div style={{ 
      position: 'relative', 
      background: W, 
      display: 'flex', 
      flexDirection: 'column', 
      borderRight: `1px solid ${G1}`,
      height: '100%',
      minHeight: 0 // Important for flex child
    }}>
      {/* Main Image with Smooth Transitions */}
      <div style={{ 
        flex: 1, 
        position: 'relative', 
        overflow: 'hidden', 
        background: W, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: 300 // Ensure minimum size
      }}>
        <AnimatePresence mode="wait">
          {images.length > 0 ? (
            <motion.img 
              key={currentImageIndex}
              src={images[currentImageIndex]} 
              alt={itemName}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover'
              }} 
            />
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#9CA3AF', 
                fontSize: 64 
              }}>
              📷
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <motion.button 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentImageIndex(i => (i - 1 + images.length) % images.length)}
              style={{ 
                position: 'absolute', 
                left: 16, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                background: 'rgba(255,255,255,0.95)', 
                border: 'none', 
                borderRadius: 10, 
                padding: 10, 
                cursor: 'pointer', 
                zIndex: 10, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)' 
              }}>
              <ChevronLeft size={20} color={G8} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentImageIndex(i => (i + 1) % images.length)}
              style={{ 
                position: 'absolute', 
                right: 16, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                background: 'rgba(255,255,255,0.95)', 
                border: 'none', 
                borderRadius: 10, 
                padding: 10, 
                cursor: 'pointer', 
                zIndex: 10, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)' 
              }}>
              <ChevronRight size={20} color={G8} />
            </motion.button>

            {/* Image counter */}
            <div style={{ 
              position: 'absolute', 
              bottom: 16, 
              left: '50%', 
              transform: 'translateX(-50%)', 
              background: 'rgba(0,0,0,0.7)', 
              color: W, 
              padding: '6px 14px', 
              borderRadius: 20, 
              fontSize: 12, 
              fontWeight: 600, 
              zIndex: 10 
            }}>
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        )}

        {/* Close button */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: 16, 
            right: 16,
            background: 'rgba(255,255,255,0.95)',
            border: 'none', 
            borderRadius: 10, 
            padding: '10px', 
            cursor: 'pointer', 
            color: G8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
          <X size={22} />
        </motion.button>
      </div>

      {/* Thumbnails Gallery */}
      {images.length > 1 && (
        <div style={{ 
          padding: 12, 
          borderTop: `1px solid ${G1}`, 
          display: 'flex', 
          gap: 8, 
          overflowX: 'auto', 
          overflowY: 'hidden', 
          maxHeight: 100,
          flexShrink: 0 // Prevent shrinking
        }}>
          {images.map((img, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentImageIndex(i)}
              style={{ 
                minWidth: 80,
                width: 80,
                height: 80,
                borderRadius: 8, 
                overflow: 'hidden', 
                border: i === currentImageIndex ? `3px solid ${P}` : `2px solid ${G2}`, 
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0
              }}>
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Action Buttons - Always Visible */}
      <div style={{ 
        padding: 16, 
        borderTop: `1px solid ${G1}`, 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: 10,
        flexShrink: 0, // Prevent shrinking
        background: W // Ensure background
      }}>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onApprove}
          style={{ 
            padding: 12, 
            borderRadius: 8, 
            border: 'none', 
            background: 'linear-gradient(135deg, #0F4C2A 0%, #1B7A45 100%)', 
            color: W, 
            fontWeight: 700, 
            fontSize: 13, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 6,
            boxShadow: '0 4px 12px rgba(15, 76, 42, 0.2)',
            transition: 'all 0.2s'
          }}>
          <CheckCircle size={16} /> Aprovar
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCorrect}
          style={{ 
            padding: 12, 
            borderRadius: 8, 
            border: 'none', 
            background: '#F59E0B', 
            color: W, 
            fontWeight: 700, 
            fontSize: 13, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 6,
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
            transition: 'all 0.2s'
          }}>
          <RefreshCw size={16} /> Corrigir
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowRejectModal(true)}
          style={{ 
            padding: 12, 
            borderRadius: 8, 
            border: 'none', 
            background: '#EF4444', 
            color: W, 
            fontWeight: 700, 
            fontSize: 13, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 6,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
            transition: 'all 0.2s'
          }}>
          <X size={16} /> Rejeitar
        </motion.button>
      </div>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: 20
            }}
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: W,
                borderRadius: 12,
                padding: 24,
                width: '100%',
                maxWidth: 400,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
            >
              <h3 style={{ 
                fontSize: 16, 
                fontWeight: 700, 
                color: G8, 
                margin: 0, 
                marginBottom: 12 
              }}>
                Motivo da Rejeição (Opcional)
              </h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Descreve o motivo para ajudar o submissor..."
                rows={4}
                style={{
                  width: '100%',
                  padding: 12,
                  border: `2px solid ${G2}`,
                  borderRadius: 8,
                  fontSize: 13,
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = P}
                onBlur={(e) => e.currentTarget.style.borderColor = G2}
              />
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                marginTop: 16, 
                justifyContent: 'flex-end' 
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowRejectModal(false)}
                  style={{
                    padding: '8px 16px',
                    border: `1px solid ${G2}`,
                    borderRadius: 8,
                    background: W,
                    color: G8,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRejectWithReason}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 8,
                    background: '#EF4444',
                    color: W,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Rejeitar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}