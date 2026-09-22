import React from 'react';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../config';

/**
 * Burbuja flotante de WhatsApp — visible en toda la tienda pública, siempre a
 * un clic de distancia. Se oculta por completo si no hay número configurado
 * (mismo criterio que el resto de botones de WhatsApp del sitio).
 */
export const WhatsAppFloatButton: React.FC = () => {
  if (!WHATSAPP_NUMBER) return null;

  const message = '¡Hola! Vi su catálogo en la página y tengo una pregunta.';
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      title="Escribir por WhatsApp"
      className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-whatsapp hover:bg-whatsapp-dark text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
    >
      <span className="absolute inset-0 rounded-full bg-whatsapp animate-ping opacity-40 pointer-events-none" />
      <MessageCircle className="w-7 h-7 fill-current relative" />
    </a>
  );
};
