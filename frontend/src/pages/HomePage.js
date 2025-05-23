import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, MessageCircle, DollarSign, CalendarCheck2, ShieldPlus, Users2, Star, CheckCircle2, TrendingUp, Smile, FileText, Youtube, Megaphone, Play, Quote, PlayCircle, Sparkles, ThumbsUp } from 'lucide-react';

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

const RefinedFeatureCard = ({ icon, title, children, delay = 0, iconStyle = {}, imageUrl }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  // Para depuración:
  // useEffect(() => {
  //   console.log(`Feature Card Title: ${title}, IconStyle:`, iconStyle);
  // }, [title, iconStyle]);

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

  const getOverlaidIconContainerClasses = () => {
    let baseClasses = 'absolute bottom-0 right-4 transform translate-y-1/2 flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full shadow-lg border-4 border-white'; // Ajustado tamaño y borde
    let bgColor = iconStyle && iconStyle.bg ? iconStyle.bg.replace('-100', '-500') : 'bg-[var(--color-primary)]';
    if (iconStyle && iconStyle.bg && iconStyle.bg.includes('green')) bgColor = 'bg-green-500';
    if (iconStyle && iconStyle.bg && iconStyle.bg.includes('blue')) bgColor = 'bg-blue-500';
    if (iconStyle && iconStyle.bg && iconStyle.bg.includes('purple')) bgColor = 'bg-purple-600'; // Ligeramente más oscuro para púrpura
    if (iconStyle && iconStyle.bg && iconStyle.bg.includes('pink')) bgColor = 'bg-pink-500';
    return `${baseClasses} ${bgColor}`;
  };
  
  // El color del icono SVG en sí mismo será blanco
  const iconColor = "white";

  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-xl shadow-lg /* hover:shadow-2xl */ flex flex-col h-full overflow-hidden
                  opacity-0 transition-all duration-500 ease-out transform /* hover:-translate-y-1.5 */ ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
      style={{ transitionDelay: `${isVisible ? delay : 0}ms` }}
    >
      <div className="relative">
        <img src={imageUrl} alt={title} className="w-full h-40 object-cover" />
        <div className={getOverlaidIconContainerClasses()}>
          {React.cloneElement(icon, { className: "w-7 h-7 text-white", strokeWidth: 2 })}
        </div>
      </div>
      
      <div className="p-5 pt-8 flex-grow flex flex-col"> {/* Más padding-top para espacio del icono */} 
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 leading-tight hover:text-blue-700">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed flex-grow hover:text-blue-700">{children}</p> 
      </div>
    </div>
  );
};

const RefinedTestimonialCard = ({ quote, author, role, avatar, cardImageUrl, imagePositionClass }) => (
  <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl flex flex-col h-full overflow-hidden transition-all duration-300 transform hover:-translate-y-1.5">
    {/* Sección Superior: Texto del Testimonio */}
    <div className="p-5 pb-4 flex-grow flex flex-col relative">
      <p className="text-sm text-black italic leading-relaxed mb-3 relative z-10 line-clamp-4 flex-grow">"{quote}"</p>
      <div className="mt-auto"> 
        <h4 className="font-semibold text-[var(--color-primary)] text-sm mb-0">{author}</h4>
        {role && <p className="text-gray-500 text-xs mt-0 leading-tight">{role}</p>} 
      </div>
    </div>

    {/* Sección Inferior: Imagen */}
    {cardImageUrl && (
      <div className="relative h-48"> 
        <img src={cardImageUrl} alt={`Foto de ${author}`} className={`w-full h-full object-cover ${imagePositionClass} rounded-t-xl`} />
        {/* El botón de video y la superposición oscura han sido eliminados */}
      </div>
    )}
  </div>
);

export default function HomePage() {
  const featuresData = [
    {
      icon: <DollarSign />,
      title: "Pagos Simplificados",
      description: "Consulta cuotas y pagos de actividades fácilmente, sin depender de chats o planillas.",
      iconStyle: { bg: 'bg-green-100', text: 'text-green-600' },
      imageUrl: "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      icon: <TrendingUp />,
      title: "Tesorería Transparente",
      description: "Visualiza ingresos y egresos con reportes claros. Toda la información ordenada y accesible.",
      iconStyle: { bg: 'bg-blue-100', text: 'text-blue-600' },
      imageUrl: "https://plus.unsplash.com/premium_photo-1661719980531-70e144c3dcb2?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      icon: <FileText />,
      title: "Documentos en Orden",
      description: "Actas, autorizaciones y archivos importantes organizados en un solo lugar, desde cualquier dispositivo.",
      iconStyle: { bg: 'bg-purple-100', text: 'text-purple-600' },
      imageUrl: "https://images.unsplash.com/photo-1620325867502-221cfb5faa5f?q=80&w=1457&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
    },
    {
      icon: <CalendarCheck2 />,
      title: "Fechas y Eventos",
      description: "Reuniones, actividades y recordatorios siempre visibles para todos los apoderados.",
      iconStyle: { bg: 'bg-pink-100', text: 'text-pink-600' },
      imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGxhbm5lciUyMGNhbGVuZGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60"
    }
  ];

  const testimonialsData = [
    {
      quote: "¡Transformó la organización del curso! Mucho más fácil que los grupos de WhatsApp.",
      author: "Ana Pérez",
      role: "Apoderada, 4to Básico",
      avatar: "https://ui-avatars.com/api/?name=Ana+Perez&background=random&color=fff&size=100",
      cardImageUrl: "https://images.unsplash.com/photo-1638202948587-ac48463ddb1f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      imagePositionClass: 'object-center'
    },
    {
      quote: "La transparencia en la tesorería es increíble. Ahora todos sabemos dónde va el dinero.",
      author: "Carlos López",
      role: "Tesorero, 1ro Medio",
      avatar: "https://ui-avatars.com/api/?name=Carlos+Lopez&background=random&color=fff&size=100",
      cardImageUrl: "https://images.unsplash.com/photo-1584043720379-b56cd9199c94?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      imagePositionClass: 'object-center'
    },
    {
      quote: "Tener todos los documentos y fechas importantes en un solo lugar, desde cualquier dispositivo.",
      author: "Sofía Martínez",
      role: "Presidenta, 6to Básico",
      avatar: "https://ui-avatars.com/api/?name=Sofia+Martinez&background=random&color=fff&size=100",
      cardImageUrl: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?q=80&w=1467&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      imagePositionClass: 'object-top'
    },
    {
      quote: "La comunicación es mucho más fluida y ordenada. ¡Adiós al caos de mensajes!",
      author: "Jorge Herrera",
      role: "Apoderado, Kinder A",
      avatar: "https://ui-avatars.com/api/?name=Jorge+Herrera&background=random&color=fff&size=100",
      cardImageUrl: "https://images.unsplash.com/photo-1609220136736-443140cffec6?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      imagePositionClass: 'object-top'
    },
    {
      quote: "Me encanta lo fácil que es ver los pagos y saber quién está al día. ¡Muy intuitivo!",
      author: "Laura Vargas",
      role: "Secretaria, 8vo Básico",
      avatar: "https://ui-avatars.com/api/?name=Laura+Vargas&background=random&color=fff&size=100",
      cardImageUrl: "https://plus.unsplash.com/premium_photo-1670071482578-d40cc9821e42?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      imagePositionClass: 'object-top'
    },
    // Añade más testimonios con cardImageUrl si es necesario
  ];

  return (
    <div className="home-page antialiased text-white bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] min-h-screen flex flex-col">
      
      {/* --- BANNER DESTACADO --- */}
      <div className="bg-slate-800 text-white py-4 px-4 text-center">
        <p className="text-base font-semibold flex flex-col sm:flex-row items-center justify-center leading-relaxed">
          <Megaphone size={26} className="mr-2.5 mb-1 sm:mb-0 flex-shrink-0 text-yellow-400 drop-shadow-[0_0_3px_rgba(250,204,21,0.5)]" />
          <span>UN SOLO PAGO ANUAL POR CURSO.</span>
          <span className="hidden sm:inline mx-1.5">•</span>
          <span className="mt-1 sm:mt-0 text-yellow-500">ACCESO GRATUITO PARA TODOS LOS APODERADOS.</span>
        </p>
      </div>

      {/* El Header principal ahora es HeaderPublico, definido en PublicLayout */}
      
      {/* --- SECCIÓN HÉROE (ahora como <section>) --- */}
      <section 
        id="hero"
        className="relative text-white pt-4 md:pt-8 lg:pt-10 pb-0 overflow-hidden"
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            {/* Título Principal */}
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-2 md:mb-3 leading-tight tracking-tighter"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
              <span className="block text-2xl sm:text-3xl md:text-4xl text-black font-medium mb-1">Ahorra Tiempo y Evita Enredos:</span>
              <span>
                <span className="font-light text-white">Organiza tu curso </span>
                <span className="font-black text-white whitespace-nowrap">con un Solo Click</span>
              </span>
            </h1>
            
            {/* Subtítulo como lista de puntos destacados */}
            <div className="max-w-xl lg:max-w-2xl mx-auto text-indigo-100 font-light mb-0 space-y-3">
              <div className="flex items-start">
                <CheckCircle2 size={28} className="text-green-400 mr-3 flex-shrink-0" />
                <p className="text-base sm:text-lg md:text-xl leading-relaxed">
                  <span className="font-semibold">Pagos, gastos, documentos y eventos:</span> todo <span className="font-semibold">centralizado y claro.</span>
                </p>
              </div>
              <div className="flex items-start">
                <Smile size={28} className="text-yellow-400 mr-3 flex-shrink-0" />
                <p className="text-base sm:text-lg md:text-xl leading-relaxed">
                  <span className="font-semibold">Acceso fácil y amigable,</span> ideal para apoderados y directivas.
                </p>
              </div>
              <div className="flex items-start">
                <ThumbsUp size={28} className="text-pink-400 mr-3 flex-shrink-0" />
                <p className="text-base sm:text-lg md:text-xl leading-relaxed">
                  <span className="font-semibold">Información siempre al día,</span> ¡sin enredos ni complicaciones!
                </p>
              </div>
              <div className="flex items-start">
                <ShieldPlus size={28} className="text-sky-400 mr-3 flex-shrink-0" />
                <p className="text-base sm:text-lg md:text-xl leading-relaxed">
                  Hecho para <span className="font-semibold">cursos</span> que valoran <span className="font-semibold">orden, transparencia y simplicidad.</span>
                </p>
              </div>
            </div>

            {/* Contenedor para Botón CTA y Estadísticas */}
            <div className="mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-center sm:justify-center gap-4 sm:gap-8 w-full mb-4 md:mb-6">
              {/* Sección de Estadísticas (Centrada si el botón se elimina) */}
              <div className="flex items-center space-x-2 text-center sm:text-left order-2 sm:order-none mb-0">
                <Users2 size={40} className="text-indigo-100 flex-shrink-0" />
                <div className="text-center sm:text-left">
                  <p className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    +3.500 usuarios
                  </p>
                  <div className="flex items-center justify-center sm:justify-start text-yellow-300">
                    <Star size={16} className="fill-current"/>
                    <Star size={16} className="fill-current"/>
                    <Star size={16} className="fill-current"/>
                    <Star size={16} className="fill-current"/>
                    <Star size={16} className="fill-current mr-1"/>
                    <span className="text-xs md:text-sm text-white font-light ml-1">4.9 de satisfacción</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main id="main-content" className="flex-grow container mx-auto px-4 pt-0 pb-2 md:pb-4">
        <div className="max-w-4xl mx-auto">

          {/* --- NUEVA SECCIÓN DE CARACTERÍSTICAS (6 TARJETAS) --- */}
          <section id="features" className="mb-4 md:mb-6 pt-0">
            <h2 className="text-xl sm:text-2xl lg:text-[1.6rem] font-semibold text-center text-white mt-0 mb-4 md:mb-5">
              Todo lo que necesitas para gestionar tu curso, desde un solo panel
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mt-2 md:mt-3">
              {featuresData.map((feature, index) => (
                <RefinedFeatureCard 
                  key={index} 
                  icon={feature.icon} 
                  title={feature.title} 
                  delay={index * 100}
                  iconStyle={feature.iconStyle}
                  imageUrl={feature.imageUrl}
                >
                  {feature.description}
                </RefinedFeatureCard>
              ))}
            </div>
          </section>

          {/* --- NUEVA SECCIÓN DE CONFIANZA / VALOR AGREGADO --- */}
          <section id="value-prop" className="mb-2 md:mb-4 py-6 md:py-10 bg-white rounded-lg">
            <div className="max-w-5xl mx-auto px-6 md:px-8 md:flex md:items-center md:gap-8 lg:gap-12">
              {/* Columna de Imagen (izquierda en md y superior) */}
              <div className="md:w-1/2 mb-6 md:mb-0">
                <img 
                  src="https://images.unsplash.com/photo-1586473219010-2ffc57b0d282?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                  alt="Gestión de curso organizada y tranquila" 
                  className="rounded-lg shadow-xl w-full h-auto object-cover max-h-[350px]"
                />
              </div>
              {/* Columna de Texto y Botón (derecha en md y superior) */}
              <div className="md:w-1/2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start mb-2">
                  <Sparkles className="text-yellow-500 mr-2" size={20} />
                  <p className="text-sm font-semibold text-yellow-600">Gestión Inteligente</p>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-[2.2rem] font-bold text-[var(--color-text)] mb-3 leading-tight">
                  Más tranquilidad, menos estrés
                </h2>
                <p className="text-base sm:text-lg text-[var(--color-text-secondary)] mb-5 leading-relaxed">
                  Gestión Curso nace para ayudarte a organizar tu curso con total claridad. Olvídate de las planillas difíciles de manejar, los mensajes cruzados y la información perdida.
                </p>
                <Link
                  to="/login#features" // Enlace temporal, considerar si dirigir a #features es mejor que /login
                  className="inline-flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white hover:text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-base md:text-lg transform hover:scale-105"
                >
                  Explora las Ventajas
                  <ArrowRight size={20} className="ml-2" />
                </Link>
              </div>
            </div>
          </section>

          {/* --- SECCIÓN DE TESTIMONIOS --- */}
          <section id="testimonials" className="mb-4 md:mb-6 py-4 md:py-6">
            <h2 className="text-xl sm:text-2xl lg:text-[1.6rem] font-semibold text-center text-white mb-4 md:mb-5">
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
                    cardImageUrl={testimonial.cardImageUrl}
                    imagePositionClass={testimonial.imagePositionClass}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </section>

          {/* --- NUEVA LLAMADA A LA ACCIÓN FINAL --- */}
          <section id="final-cta" className="py-4 md:py-6 text-center bg-white rounded-lg mb-4 md:mb-6">
            <div className="max-w-2xl mx-auto px-4">
              <h2 className="text-xl sm:text-2xl lg:text-[1.6rem] font-bold text-[var(--color-text)] mb-2">
                ¿Quieres ver cómo funciona Gestión Curso?
              </h2>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mb-3">
                Conoce la plataforma en funcionamiento y descubre cómo puedes ordenar la gestión de tu curso sin complicaciones.
              </p>
              <Link
                to="/login"
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white hover:text-white font-semibold py-2 px-5 rounded-md shadow-md hover:shadow-lg transition duration-200 text-base md:text-lg transform hover:scale-105 inline-flex items-center justify-center"
              >
                <Play size={18} className="mr-1.5" /> 
                Mira la demo en video
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer (mantener el actual o adaptarlo) */}
      <footer className="text-center py-4 bg-slate-800/50 text-indigo-200 mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} Gestion Curso. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
} 