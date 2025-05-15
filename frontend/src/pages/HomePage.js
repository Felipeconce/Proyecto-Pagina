import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, MessageCircle, DollarSign, CalendarCheck2, ShieldPlus, Users2, Star, CheckCircle2, TrendingUp, Smile, FileText, Youtube, Megaphone, Play } from 'lucide-react';

// Importar Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Importar Swiper styles
import 'swiper/css';
// import 'swiper/css/effect-coverflow'; // Ya no se usa
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// importar módulos de Swiper
import { Pagination, Navigation, Autoplay } from 'swiper/modules'; // Quitado EffectCoverflow

// Si necesitas estilos muy específicos que Tailwind no cubre fácilmente,
// puedes crear y descomentar HomePage.css
// import './HomePage.css';

const RefinedFeatureCard = ({ icon, title, children, delay = 0, iconStyle = {} }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  // Para depuración:
  useEffect(() => {
    console.log(`Feature Card Title: ${title}, IconStyle:`, iconStyle);
  }, [title, iconStyle]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      }
    );

    const currentCardRef = cardRef.current;
    if (currentCardRef) {
      observer.observe(currentCardRef);
    }

    return () => {
      if (currentCardRef) {
        observer.unobserve(currentCardRef);
      }
    };
  }, []);

  // Función de utilidad para construir clases
  const getIconContainerClasses = () => {
    let classes = 'flex items-center w-8 h-8 md:w-9 md:h-9 mb-1 rounded-md self-start';
    if (iconStyle && iconStyle.bg) {
      classes += ` ${iconStyle.bg}`;
    } else {
      classes += ' bg-[var(--color-primary-light)]';
    }
    if (iconStyle && iconStyle.text) {
      classes += ` ${iconStyle.text}`;
    } else {
      classes += ' text-[var(--color-primary)]';
    }
    return classes;
  };

  return (
    <div
      ref={cardRef}
      className={`bg-[var(--color-card-bg)] pt-1.5 rounded-[var(--border-radius-md)] shadow-md hover:shadow-lg border border-[var(--color-border)] border-t-4 border-t-[var(--color-primary)] flex flex-col h-full
                  opacity-0 transition-opacity duration-500 ease-out ${isVisible ? 'opacity-100' : ''}`}
      style={{ transitionDelay: `${isVisible ? delay : 0}ms` }}
    >
      <div className="px-2.5">
        <div className={getIconContainerClasses()}>
          {React.cloneElement(icon, { size: 18, className: "m-auto" })}
        </div>
        <h3 className="text-sm leading-tight sm:text-[0.9rem] font-semibold text-[var(--color-text)] mb-0.5">{title}</h3>
        <p className="text-xs text-[var(--color-text-secondary)] leading-snug flex-grow pb-2.5">{children}</p> 
      </div>
    </div>
  );
};

const ValueBulletItem = ({ icon, text, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    const currentItemRef = itemRef.current;
    if (currentItemRef) {
      observer.observe(currentItemRef);
    }

    return () => {
      if (currentItemRef) {
        observer.unobserve(currentItemRef);
      }
    };
  }, []);

  return (
    <li
      ref={itemRef}
      className={`flex items-start mb-3 opacity-0 transition-opacity duration-500 ease-out ${isVisible ? 'opacity-100' : ''}`}
      style={{ transitionDelay: `${isVisible ? delay : 0}ms` }}
    >
      <div className="flex-shrink-0 mr-3">
        <div className="bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-full w-7 h-7 flex items-center justify-center">
          {React.cloneElement(icon, { size: 16 })}
        </div>
      </div>
      <span className="text-base text-[var(--color-text-secondary)] mt-0.5">{text}</span>
    </li>
  );
};

const RefinedTestimonialCard = ({ quote, author, role, avatar }) => (
  <div className="bg-[var(--color-bg-secondary)] p-2 md:p-2.5 rounded-[var(--border-radius-md)] shadow-md hover:shadow-lg text-center border border-[var(--color-border)] transition-all duration-200 transform hover:-translate-y-1 flex flex-col h-full min-h-[140px] sm:min-h-[160px]">
    <img src={avatar} alt={author} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full mx-auto mb-1.5 shadow-sm object-cover" />
    <p className="text-xs sm:text-[0.8rem] text-[var(--color-text-secondary)] italic mb-1.5 leading-snug flex-grow">"{quote}"</p>
    <div>
      <h4 className="font-semibold text-[var(--color-primary)] text-[0.8rem] sm:text-sm">{author}</h4>
      <p className="text-gray-500 text-[0.7rem]">{role}</p>
    </div>
  </div>
);

export default function HomePage() {
  const featuresData = [
    {
      icon: <DollarSign />,
      title: "Pagos Simplificados",
      description: "Consulta cuotas y pagos de actividades fácilmente, sin depender de chats o planillas.",
      iconStyle: { bg: 'bg-green-100', text: 'text-green-600' }
    },
    {
      icon: <TrendingUp />,
      title: "Tesorería Transparente",
      description: "Visualiza ingresos y egresos con reportes claros. Toda la información ordenada y accesible.",
      iconStyle: { bg: 'bg-blue-100', text: 'text-blue-600' }
    },
    {
      icon: <FileText />,
      title: "Documentos en Orden",
      description: "Actas, autorizaciones y archivos importantes organizados en un solo lugar, desde cualquier dispositivo.",
      iconStyle: { bg: 'bg-purple-100', text: 'text-purple-600' }
    },
    {
      icon: <CalendarCheck2 />,
      title: "Fechas y Eventos",
      description: "Reuniones, actividades y recordatorios siempre visibles para todos los apoderados.",
      iconStyle: { bg: 'bg-pink-100', text: 'text-pink-600' }
    }
  ];

  const valueBulletsData = [
    {
      icon: <ShieldPlus />,
      text: "Seguridad y privacidad garantizada"
    },
    {
      icon: <Smile />,
      text: "Interfaz simple y amigable para todos"
    },
    {
      icon: <CheckCircle2 />,
      text: "Apoderados siempre informados, sin caos digital"
    }
  ];

  const testimonialsData = [
    {
      quote: "¡Esta plataforma transformó la organización de nuestro curso! Mucho más fácil que los grupos de WhatsApp.",
      author: "Ana Pérez",
      role: "Apoderada, 4to Básico",
      avatar: "https://ui-avatars.com/api/?name=Ana+Perez&background=random&color=fff&size=100"
    },
    {
      quote: "La transparencia en la tesorería es increíble. Ahora todos sabemos dónde va el dinero.",
      author: "Carlos López",
      role: "Tesorero, 1ro Medio",
      avatar: "https://ui-avatars.com/api/?name=Carlos+Lopez&background=random&color=fff&size=100"
    },
    {
      quote: "Tener todos los documentos y fechas importantes en un solo lugar nos ahorra muchísimo tiempo.",
      author: "Sofía Martínez",
      role: "Presidenta Curso, 6to Básico",
      avatar: "https://ui-avatars.com/api/?name=Sofia+Martinez&background=random&color=fff&size=100"
    },
    {
      quote: "La comunicación es mucho más fluida y ordenada. ¡Adiós al caos de mensajes!",
      author: "Jorge Herrera",
      role: "Apoderado, Kinder A",
      avatar: "https://ui-avatars.com/api/?name=Jorge+Herrera&background=random&color=fff&size=100"
    },
    {
      quote: "Me encanta lo fácil que es ver los pagos y saber quién está al día. ¡Muy intuitivo!",
      author: "Laura Vargas",
      role: "Secretaria, 8vo Básico",
      avatar: "https://ui-avatars.com/api/?name=Laura+Vargas&background=random&color=fff&size=100"
    },
    {
      quote: "Una herramienta esencial para cualquier directiva de curso que quiera trabajar de forma eficiente.",
      author: "Miguel Ángel Soto",
      role: "Apoderado, 2do Medio",
      avatar: "https://ui-avatars.com/api/?name=Miguel+Angel+Soto&background=random&color=fff&size=100"
    },
    {
      quote: "Desde que usamos Gestión Curso, la participación de los apoderados ha mejorado notablemente.",
      author: "Carolina Reyes",
      role: "Profesora Jefe, 3ro Básico",
      avatar: "https://ui-avatars.com/api/?name=Carolina+Reyes&background=random&color=fff&size=100"
    },
    {
      quote: "La sección de fechas y eventos es mi favorita. Ya no me pierdo ninguna reunión importante.",
      author: "David Gómez",
      role: "Apoderado, 5to Básico",
      avatar: "https://ui-avatars.com/api/?name=David+Gomez&background=random&color=fff&size=100"
    },
    {
      quote: "¡Excelente plataforma! Muy completa y fácil de usar para todos los niveles de habilidad tecnológica.",
      author: "Patricia Nuñez",
      role: "Coordinadora Ciclo Básico",
      avatar: "https://ui-avatars.com/api/?name=Patricia+Nunez&background=random&color=fff&size=100"
    },
    {
      quote: "Realmente simplifica la vida de los apoderados y de la directiva. ¡Totalmente recomendada!",
      author: "Ricardo Fuentes",
      role: "Presidente Centro de Padres",
      avatar: "https://ui-avatars.com/api/?name=Ricardo+Fuentes&background=random&color=fff&size=100"
    }
  ];

  return (
    <div className="home-page antialiased text-[var(--color-text)] bg-white min-h-screen flex flex-col">
      
      {/* --- BANNER DESTACADO --- */}
      <div className="bg-slate-800 text-white py-3.5 px-4 text-center animate-pulse">
        <p className="text-lg font-bold flex items-center justify-center">
          <Megaphone size={22} className="mr-2.5 flex-shrink-0" />
          <span className="uppercase">Un solo pago anual por curso. Acceso gratuito para todos los apoderados.</span>
        </p>
      </div>

      {/* El Header principal ahora es HeaderPublico, definido en PublicLayout */}
      
      {/* --- SECCIÓN HÉROE (ahora como <section>) --- */}
      <section 
        id="hero"
        className="relative text-white py-10 md:py-16 lg:py-20 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] overflow-hidden"
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            {/* Título Principal */}
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 md:mb-5 leading-tighter tracking-tighter"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }} // Sombra de texto sutil
            >
              Simplifica y Ordena la Gestión de tu Curso
            </h1>
            
            {/* Subtítulo */}
            <p className="max-w-xl lg:max-w-2xl mx-auto text-lg sm:text-xl md:text-2xl mb-5 md:mb-6 text-indigo-100 font-light leading-relaxed">
              Visualiza pagos, gastos, documentos, eventos y más, todo en un solo lugar. Ideal para apoderados y directivas. Acceso fácil, sin complicaciones.
            </p>

            {/* Frase de Gancho */}
            <p className="max-w-lg mx-auto text-md sm:text-lg mb-6 md:mb-8 text-indigo-200 italic">
              Despídete del caos de WhatsApp, correos y planillas desactualizadas.
            </p>

            {/* Botón CTA Principal */}
            <Link
              to="/login"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 px-10 md:py-4 md:px-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-lg md:text-xl transform hover:scale-105 inline-flex items-center justify-center mb-10 md:mb-12"
            >
              <Play size={22} className="mr-2.5" /> 
              Ver Demo en Video
            </Link>
          </div>

          {/* Sección de Estadística Repensada */}
          <div className="max-w-md mx-auto border-t border-indigo-400 border-opacity-50 pt-6 md:pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left space-y-3 sm:space-y-0 sm:space-x-4">
              <Users2 size={40} className="text-indigo-100 flex-shrink-0" />
              <div>
                <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  +500 Apoderados
                </p>
                <p className="text-md md:text-lg text-indigo-200 font-light">
                  ya organizan su curso con nuestra plataforma.
                </p>
              </div>
            </div>
          </div>
          
          {/* Ilustración OMITIDA en este rediseño para enfoque tipográfico 
          <div className="w-full max-w-[240px] sm:max-w-[280px] mx-auto mt-8 md:mt-10">
            <img 
              src="/uploads/Community-pana.svg" 
              alt="Ilustración de Comunidad Escolar Organizada" 
              className="w-full h-auto object-contain max-h-[150px] md:max-h-[170px] lg:max-h-[190px] opacity-70 hover:opacity-90 transition-opacity duration-300"
            />
          </div>
          */}

        </div>
      </section>

      <main id="main-content" className="flex-grow container mx-auto px-4 py-4 md:py-6">
        <div className="max-w-4xl mx-auto">

          {/* --- NUEVA SECCIÓN DE CARACTERÍSTICAS (6 TARJETAS) --- */}
          <section id="features" className="mb-4 md:mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-[1.6rem] font-semibold text-center text-[var(--color-text)] mb-4 md:mb-5">
              Todo lo que necesitas para gestionar tu curso, desde un solo panel
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {featuresData.map((feature, index) => (
                <RefinedFeatureCard 
                  key={index} 
                  icon={feature.icon} 
                  title={feature.title} 
                  delay={index * 100}
                  iconStyle={feature.iconStyle}
                >
                  {feature.description}
                </RefinedFeatureCard>
              ))}
            </div>
          </section>

          {/* --- NUEVA SECCIÓN DE CONFIANZA / VALOR AGREGADO --- */}
          <section id="value-prop" className="mb-4 md:mb-6 py-4 md:py-6 bg-gray-50 rounded-lg">
            <div className="max-w-5xl mx-auto px-4 md:flex md:items-center md:gap-8">
              {/* Columna de Texto (izquierda en md y superior) */}
              <div className="md:w-1/2 text-center md:text-left mb-6 md:mb-0">
                <h2 className="text-xl sm:text-2xl lg:text-[1.6rem] font-semibold text-[var(--color-text)] mb-3">
                  Más tranquilidad, menos estrés
                </h2>
                <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mb-4 md:mb-0">
                  Gestión Curso nace para ayudarte a organizar tu curso con total claridad. Olvídate de las planillas difíciles de manejar, los mensajes cruzados y la información perdida.
                </p>
              </div>
              {/* Columna de Viñetas (derecha en md y superior) */}
              <div className="md:w-1/2">
                <ul className="space-y-2.5 inline-block text-left md:block">
                  {valueBulletsData.map((benefit, index) => (
                    <ValueBulletItem key={index} icon={benefit.icon} text={benefit.text} delay={index * 100} />
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* --- SECCIÓN DE TESTIMONIOS --- */}
          <section id="testimonials" className="mb-4 md:mb-6 py-4 md:py-6">
            <h2 className="text-xl sm:text-2xl lg:text-[1.6rem] font-semibold text-center text-[var(--color-text)] mb-4 md:mb-5">
              Lo que dicen nuestros usuarios
            </h2>
            <Swiper
              grabCursor={true}
              loop={true}
              slidesPerView={1} 
              spaceBetween={15} 
              autoplay={{
                delay: 3500,
                disableOnInteraction: false,
              }}
              pagination={{ clickable: true }}
              navigation={true}
              modules={[Pagination, Navigation, Autoplay]} 
              className="mySwiper testimonials-swiper pb-8 w-full"
              breakpoints={{
                640: { 
                  slidesPerView: 2,
                  spaceBetween: 20
                },
                768: { 
                  slidesPerView: 3,
                  spaceBetween: 20 
                },
                1024: { 
                  slidesPerView: 3, 
                  spaceBetween: 25
                },
                1280: { 
                  slidesPerView: 4,
                  spaceBetween: 25
                }
              }}
            >
              {testimonialsData.map((testimonial, index) => (
                <SwiperSlide key={index} className="pb-3 pt-1.5 flex items-stretch"> 
                  <RefinedTestimonialCard
                    quote={testimonial.quote}
                    author={testimonial.author}
                    role={testimonial.role}
                    avatar={testimonial.avatar}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </section>

          {/* --- NUEVA LLAMADA A LA ACCIÓN FINAL --- */}
          <section id="final-cta" className="py-6 md:py-8 text-center bg-gray-100 rounded-lg">
            <div className="max-w-2xl mx-auto px-4">
              <h2 className="text-xl sm:text-2xl lg:text-[1.6rem] font-bold text-[var(--color-text)] mb-2">
                ¿Quieres ver cómo funciona Gestión Curso?
              </h2>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mb-4">
                Conoce la plataforma en funcionamiento y descubre cómo puedes ordenar la gestión de tu curso sin complicaciones.
              </p>
              <Link
                to="/login"
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold py-2 px-5 rounded-md shadow-md hover:shadow-lg transition duration-200 text-base md:text-lg transform hover:scale-105 inline-flex items-center justify-center"
              >
                <Play size={18} className="mr-1.5" /> 
                Mira la demo en video
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer (mantener el actual o adaptarlo) */}
      <footer className="text-center py-4 bg-[var(--color-text)] text-[var(--color-bg-secondary)] mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} Gestion Curso. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
} 