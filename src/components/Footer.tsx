import React from 'react';
import { WHATSAPP_NUMBER, CONTACT_EMAIL, formatWhatsappDisplay } from '../config';
import { 
  ShieldCheck, Truck, MessageCircle, CreditCard, Award, 
  Heart, Phone, Mail, MapPin, ExternalLink 
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-cuero-espresso text-cuero-marfil border-t-4 border-cuero-cognac">
      
      {/* 1. Value Props Badges Grid */}
      <div id="garantia" className="border-b border-cuero-cognac/30 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Warranty */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-cuero-marfil/5 border border-cuero-arena/20">
            <div className="p-3 rounded-xl bg-accent-gold/20 text-accent-gold shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-bold text-sm text-cuero-marfil">
                Garantía 6 Meses
              </h4>
              <p className="text-xs text-cuero-arena/80 leading-relaxed">
                Cobertura directa en costuras, cremalleras y herrajes por defectos de fabricación (Ley 1480/2011).
              </p>
            </div>
          </div>

          {/* Nationwide Shipping */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-cuero-marfil/5 border border-cuero-arena/20">
            <div className="p-3 rounded-xl bg-brand-teal/20 text-brand-teal shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-bold text-sm text-cuero-marfil">
                Envíos a Jamundí, Cali y Colombia
              </h4>
              <p className="text-xs text-cuero-arena/80 leading-relaxed">
                Entregas locales en Jamundí y Cali (según la zona) y despachos a nivel nacional. El costo y tiempo se cotizan por WhatsApp según tu destino.
              </p>
            </div>
          </div>

          {/* Genuine Leather */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-cuero-marfil/5 border border-cuero-arena/20">
            <div className="p-3 rounded-xl bg-cuero-caramelo/20 text-cuero-caramelo shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-bold text-sm text-cuero-marfil">
                Materiales Seleccionados
              </h4>
              <p className="text-xs text-cuero-arena/80 leading-relaxed">
                Pieles curtidas con técnicas tradicionales y lona de alta tenacidad con acabados a mano.
              </p>
            </div>
          </div>

          {/* Secure WhatsApp Pay */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-cuero-marfil/5 border border-cuero-arena/20">
            <div className="p-3 rounded-xl bg-whatsapp/20 text-whatsapp shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-bold text-sm text-cuero-marfil">
                Atención Personalizada
              </h4>
              <p className="text-xs text-cuero-arena/80 leading-relaxed">
                Acompañamiento humano directo por WhatsApp para asesorarte en tallas, colores y fotos reales.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo Morrales y Algo Más"
                width={40}
                height={40}
                loading="lazy"
                className="w-10 h-10 rounded-full shadow"
              />
              <span className="font-heading font-extrabold text-xl text-cuero-marfil">
                Morrales y Algo Más
              </span>
            </div>

            <p className="text-xs text-cuero-arena/80 max-w-sm leading-relaxed">
              Taller y tienda especializada en marroquinería de alta calidad, morrales urbanos, bolsos y billeteras con carácter, resistencia y distinción.
            </p>

            <div className="space-y-2 text-xs text-cuero-arena">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-teal" />
                <span>Medellín / Envigado, Colombia</span>
              </div>
              {WHATSAPP_NUMBER && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-brand-teal" />
                  <span>WhatsApp: {formatWhatsappDisplay(WHATSAPP_NUMBER)}</span>
                </div>
              )}
              {CONTACT_EMAIL && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-brand-teal" />
                  <span>{CONTACT_EMAIL}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-xs">
            <h5 className="font-heading font-bold text-sm text-cuero-marfil tracking-wide">
              Categorías
            </h5>
            <ul className="space-y-2 text-cuero-arena/80">
              <li><a href="#catalogo" className="hover:text-white transition-colors">Morrales de Cuero</a></li>
              <li><a href="#catalogo" className="hover:text-white transition-colors">Bolsos Tote & Mano</a></li>
              <li><a href="#catalogo" className="hover:text-white transition-colors">Billeteras con RFID</a></li>
              <li><a href="#catalogo" className="hover:text-white transition-colors">Maletines Ejecutivos</a></li>
              <li><a href="#catalogo" className="hover:text-white transition-colors">Cinturones Reversibles</a></li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-3 text-xs">
            <h5 className="font-heading font-bold text-sm text-cuero-marfil tracking-wide">
              Marco Legal
            </h5>
            <ul className="space-y-2 text-cuero-arena/80">
              <li><span className="hover:text-white cursor-pointer transition-colors">Garantía Legal (Ley 1480/2011)</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Cambios (5 días hábiles)</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Tratamiento Datos (Ley 1581/2012)</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Términos y Condiciones</span></li>
            </ul>
          </div>

        </div>

        {/* 3. Bottom Legal Bar & Habeas Data Banner */}
        <div className="mt-12 pt-6 border-t border-cuero-cognac/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-cuero-arena/70 text-center sm:text-left">
          <p>
            © 2026 Morrales y Algo Más. Todos los derechos reservados. Marroquinería Colombiana.
          </p>
          <div className="flex items-center gap-4">
            <span className="hover:text-cuero-marfil transition-colors">Habeas Data Protección de Datos</span>
            <span>•</span>
            <span className="hover:text-cuero-marfil transition-colors">Comercio Seguro</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
