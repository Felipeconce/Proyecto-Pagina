import React, { useEffect, useState } from 'react';
import PagosList from '../components/Pagos/PagosList';
import ConceptosForm from '../components/Pagos/ConceptosForm';
import { Wallet } from 'lucide-react';
import { useToast } from '../components/Layout/ToastProvider';

export default function PagosPage({ user }) {
  const [refresh, setRefresh] = React.useState(false);
  const [pagos, setPagos] = React.useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [loading, setLoading] = React.useState(true);
  const [pagosAtrasadosMap, setPagosAtrasadosMap] = React.useState({});
  const [estadisticas, setEstadisticas] = React.useState({
    totalPagado: 0,
    pagosCompletados: 0,
    pagosAtrasados: 0,
    totalAtrasado: 0
  });
  const toast = useToast();
  
  // Referencia para saber si el componente está montado
  const isMounted = React.useRef(true);
  
  // Efecto para limpiar al desmontar
  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Mapeo de abreviaturas de meses a números de mes (1-12)
  // Incluimos tanto mayúsculas como minúsculas para asegurar compatibilidad
  const mesesMap = {
    'ENE': 1, 'FEB': 2, 'MAR': 3, 'ABR': 4, 'MAY': 5, 'JUN': 6,
    'JUL': 7, 'AGO': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DIC': 12,
    'Ene': 1, 'Feb': 2, 'Mar': 3, 'Abr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Ago': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dic': 12,
    'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12
  };

  // Lista de conceptos que siempre deben marcarse como atrasados
  const conceptosAtrasadosForzados = ['MAR', 'ABR', 'MAM', 'Mar', 'Abr'];

  // Función para cargar todos los datos de pagos
  const cargarDatos = React.useCallback(async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.showToast('Sesión no válida', 'error');
        setLoading(false);
        return;
      }
      
      // Cargar pagos, conceptos y alumnos en paralelo
      const [pagosRes, conceptosRes, alumnosRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/pagos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.REACT_APP_API_URL}/conceptos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.REACT_APP_API_URL}/apoderados`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      // Verificar respuestas
      if (!pagosRes.ok || !conceptosRes.ok || !alumnosRes.ok) {
        throw new Error('Error al cargar datos');
      }
      
      // Convertir respuestas a JSON
      const [pagosData, conceptosData, alumnosData] = await Promise.all([
        pagosRes.json(),
        conceptosRes.json(),
        alumnosRes.json()
      ]);
      
      // Asegurarse de que sean arrays
      const pagosArray = Array.isArray(pagosData) ? pagosData : [];
      const conceptosArray = Array.isArray(conceptosData) ? conceptosData : [];
      const alumnosArray = Array.isArray(alumnosData) ? alumnosData : [];
      
      // Guardar pagos en estado
      setPagos(pagosArray);
      
      // Calcular pagos atrasados
      const atrasadosMap = calcularPagosAtrasados(pagosArray, conceptosArray, alumnosArray);
      setPagosAtrasadosMap(atrasadosMap);
      
      // Calcular estadísticas
      actualizarEstadisticas(pagosArray, atrasadosMap);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.showToast('Error al cargar datos', 'error');
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [toast]);
  
  // Calcular estadísticas con pagos actualizados
  const actualizarEstadisticas = (pagosArray, atrasadosMap) => {
    // Total pagado: sumar montos de pagos con estado 'pagado'
    const totalPagado = pagosArray.reduce((acc, p) => 
      acc + (p.estado === 'pagado' ? Number(p.monto) : 0), 0);
    
    // Pagos completados: contar pagos con estado 'pagado'
    const pagosCompletados = pagosArray.filter(p => p.estado === 'pagado').length;
    
    // Pagos atrasados: contar usando el mapa de atrasados
    const pagosAtrasados = Object.keys(atrasadosMap).reduce(
      (total, alumnoId) => total + Object.keys(atrasadosMap[alumnoId] || {}).length, 
      0
    );
    
    // Total atrasado: sumar montos de pagos atrasados y no pagados
    const totalAtrasado = pagosArray.reduce((acc, p) => {
      // Solo considerar si no está pagado Y está en el mapa de atrasados
      if (p.estado !== 'pagado' && atrasadosMap[p.usuario_id]?.[p.concepto_id]) {
        return acc + Number(p.monto);
      }
      return acc;
    }, 0);
    
    // Actualizar estado con las estadísticas calculadas
    setEstadisticas({
      totalPagado,
      pagosCompletados,
      pagosAtrasados,
      totalAtrasado
    });
    
    console.log('Estadísticas actualizadas:', {
      totalPagado,
      pagosCompletados,
      pagosAtrasados,
      totalAtrasado
    });
  };
  
  // Efecto para cargar datos iniciales
  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos, refresh]);
  
  // Escuchar el evento personalizado para recalcular
  React.useEffect(() => {
    const handleRecalculate = () => {
      console.log('Evento de recálculo de pagos recibido');
      setRefresh(prev => !prev);
    };
    
    // Añadir listener para el evento personalizado
    document.addEventListener('pagos-recalculate', handleRecalculate);
    
    // Limpiar al desmontar
    return () => {
      document.removeEventListener('pagos-recalculate', handleRecalculate);
    };
  }, []);
  
  // Función para forzar actualización cuando cambian los pagos
  const handlePagosChange = () => {
    console.log('Forzando actualización después de cambio en pagos');
    // Usar setTimeout para asegurar que la actualización ocurra en el siguiente ciclo
    setTimeout(() => {
      setRefresh(prev => !prev);
    }, 200);
  };

  // Verificar si un concepto está atrasado basado en su fecha de vencimiento o si es un mes pasado
  const isConceptoAtrasado = (conceptoId, conceptosArray, conceptosEspeciales = []) => {
    const concepto = conceptosArray.find(c => c.id === conceptoId);
    if (!concepto) {
      console.log(`Concepto ${conceptoId} no encontrado`);
      return false;
    }
    
    // Verificar si el concepto está en la lista de forzados
    if (conceptosEspeciales.some(c => c.id === conceptoId)) {
      console.log(`Concepto ${concepto.nombre} (ID: ${conceptoId}) está en la lista de forzados como atrasado`);
      return true;
    }
    
    // Forzar que MAM, MAR y ABR estén atrasados
    if (conceptosAtrasadosForzados.includes(concepto.nombre)) {
      console.log(`Concepto ${concepto.nombre} se marca como atrasado (está en la lista forzada)`);
      return true;
    }
    
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1; // Los meses en JS son 0-11
    const anioActual = hoy.getFullYear();
    
    // Si el concepto es un mes estándar (MAR, ABR, etc.)
    if (mesesMap[concepto.nombre]) {
      const mesConcepto = mesesMap[concepto.nombre];
      
      // Si estamos en el mismo año académico y el mes ya pasó
      if (mesConcepto < mesActual && mesActual <= 12) {
        console.log(`Mes ${concepto.nombre} (${mesConcepto}) es anterior al mes actual (${mesActual})`);
        return true;
      }
    }
    
    // Si el concepto tiene fecha de vencimiento
    if (concepto.fecha_vencimiento) {
      const fechaVencimiento = new Date(concepto.fecha_vencimiento);
      fechaVencimiento.setHours(23, 59, 59, 999);
      const estaAtrasado = hoy > fechaVencimiento;
      console.log(`Concepto ${concepto.nombre} con fecha ${concepto.fecha_vencimiento}: ¿Atrasado? ${estaAtrasado}`);
      return estaAtrasado;
    }
    
    // Para conceptos personalizados sin fecha, marcarlos como atrasados por defecto
    if (concepto.orden === 0 || concepto.orden === null) {
      // Excepción para PAP
      if (concepto.nombre === 'PAP') {
        return false;
      }
      console.log(`Concepto personalizado ${concepto.nombre} sin fecha: marcado como atrasado`);
      return true;
    }
    
    return false;
  };
  
  // Calcular mapa de pagos atrasados
  const calcularPagosAtrasados = (pagosArray, conceptosArray, alumnosArray, conceptosEspeciales = []) => {
    const atrasadosMap = {};
    
    // Primero, crear entradas para todos los alumnos y conceptos
    alumnosArray.forEach(alumno => {
      conceptosArray.forEach(concepto => {
        // Buscar si hay un pago para este alumno y concepto
        const pagoConcretoArray = pagosArray.filter(p => 
          p.usuario_id === alumno.id && 
          p.concepto_id === concepto.id
        );
        
        // Si no hay pago, o el pago no está en estado 'pagado'
        if (pagoConcretoArray.length === 0 || 
            pagoConcretoArray.some(p => p.estado !== 'pagado')) {
          
          // Verificar si está en la lista de conceptos especiales forzados
          const esForzado = conceptosEspeciales.some(c => c.id === concepto.id);
          
          // Verificar si debe marcarse como atrasado
          if (esForzado || conceptosAtrasadosForzados.includes(concepto.nombre) || 
              isConceptoAtrasado(concepto.id, conceptosArray, conceptosEspeciales)) {
            if (!atrasadosMap[alumno.id]) {
              atrasadosMap[alumno.id] = {};
            }
            console.log(`Marcando como atrasado: Alumno ${alumno.id}, Concepto ${concepto.id} (${concepto.nombre})`);
            atrasadosMap[alumno.id][concepto.id] = true;
          }
        }
      });
    });
    
    console.log("Mapa de pagos atrasados calculado:", atrasadosMap);
    return atrasadosMap;
  };
  
  // Función para determinar si un pago está atrasado
  const isPagoAtrasado = (pago) => {
    // Si ya está pagado, no está atrasado
    if (pago.estado === 'pagado') return false;
    
    return pagosAtrasadosMap[pago.usuario_id]?.[pago.concepto_id] === true;
  };

  // Opciones de formato para eliminar decimales
  const formatoMoneda = { maximumFractionDigits: 0 };

  return (
    <section className="pagos-page">
      <h2 className="page-title">
        <Wallet color="var(--color-primary)" size={28} /> Pagos
      </h2>
      
      {/* Resumen destacado */}
      <div className="pagos-resumen">
        <div className="resumen-item">
          <span className="resumen-icon icon-primary"><Wallet size={24} /></span>
          <div>
            <div className="resumen-label">Total recaudado</div>
            <div className="resumen-value resumen-value-primary">${estadisticas.totalPagado.toLocaleString('es-CL', formatoMoneda)}</div>
          </div>
        </div>
        
        <div className="resumen-item">
          <span className="resumen-icon icon-success"><Wallet size={24} /></span>
          <div>
            <div className="resumen-label">Pagos completados</div>
            <div className="resumen-value resumen-value-success">{estadisticas.pagosCompletados}</div>
          </div>
        </div>
        
        <div className="resumen-item">
          <span className="resumen-icon icon-error"><Wallet size={24} /></span>
          <div>
            <div className="resumen-label">Atrasados</div>
            <div className="resumen-value resumen-value-danger">{estadisticas.pagosAtrasados} (${estadisticas.totalAtrasado.toLocaleString('es-CL', formatoMoneda)})</div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <ConceptosForm user={user} setRefresh={setRefresh} />
      </div>
      
      <div className="card">
        <h3 className="section-subtitle">Listado de pagos</h3>
        <PagosList 
          user={user}
          refresh={refresh}
          onPagosChange={handlePagosChange}
          isPagoAtrasado={isPagoAtrasado}
          pagosAtrasadosMap={pagosAtrasadosMap}
          mesesMap={mesesMap}
          conceptosAtrasadosForzados={conceptosAtrasadosForzados}
          formatoMoneda={formatoMoneda}
        />
      </div>
    </section>
  );
}