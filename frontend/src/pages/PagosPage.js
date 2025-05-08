import React, { useEffect, useState } from 'react';
import PagosList from '../components/Pagos/PagosList';
import ConceptosForm from '../components/Pagos/ConceptosForm';
import { FaMoneyBillWave, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function PagosPage({ user }) {
  const [refresh, setRefresh] = React.useState(false);
  const [pagos, setPagos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagosAtrasadosMap, setPagosAtrasadosMap] = useState({});

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

  useEffect(() => {
    setLoading(true);
    
    // Hacer las peticiones para obtener pagos, alumnos y conceptos
    Promise.all([
      fetch(`${process.env.REACT_APP_API_URL}/pagos`),
      fetch(`${process.env.REACT_APP_API_URL}/apoderados`),
      fetch(`${process.env.REACT_APP_API_URL}/conceptos`)
    ])
      .then(([pagosRes, alumnosRes, conceptosRes]) => {
        return Promise.all([
          pagosRes.ok ? pagosRes.json() : [],
          alumnosRes.ok ? alumnosRes.json() : [],
          conceptosRes.ok ? conceptosRes.json() : []
        ]);
      })
      .then(([pagosData, alumnosData, conceptosData]) => {
        console.log("Pagos cargados:", pagosData);
        console.log("Conceptos cargados:", conceptosData);
        
        // Identificar los IDs de los conceptos MAR y ABR para forzarlos como atrasados
        const conceptosEspeciales = conceptosData.filter(c => 
          conceptosAtrasadosForzados.includes(c.nombre)
        );
        console.log("Conceptos especiales a forzar como atrasados:", conceptosEspeciales);
        
        setPagos(pagosData);
        setAlumnos(alumnosData);
        setConceptos(conceptosData);
        
        // Procesar los conceptos y pagos después de cargarlos
        const atrasadosMap = calcularPagosAtrasados(pagosData, conceptosData, alumnosData, conceptosEspeciales);
        setPagosAtrasadosMap(atrasadosMap);
        
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al cargar datos:", err);
        setLoading(false);
        setPagos([]);
        setAlumnos([]);
        setConceptos([]);
        setPagosAtrasadosMap({});
      });
  }, [refresh]);

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

  // Resumen de pagos
  const totalPagado = pagos.reduce((acc, p) => acc + (p.estado === 'pagado' ? Number(p.monto) : 0), 0);
  const pagosCompletados = pagos.filter(p => p.estado === 'pagado').length;
  
  // Contar pagos atrasados basados en nuestro mapa
  const pagosAtrasados = Object.keys(pagosAtrasadosMap).reduce(
    (total, alumnoId) => total + Object.keys(pagosAtrasadosMap[alumnoId]).length, 
    0
  );
  
  // Calcular monto total de atrasados
  const totalAtrasado = pagos.filter(p => 
    p.estado !== 'pagado' && pagosAtrasadosMap[p.usuario_id]?.[p.concepto_id]
  ).reduce((acc, p) => acc + Number(p.monto), 0);

  // Opciones de formato para eliminar decimales
  const formatoMoneda = { maximumFractionDigits: 0 };

  return (
    <section>
      <h2 style={{
        fontSize: '28px',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <FaMoneyBillWave color="#2563eb" /> Pagos
      </h2>
      
      {/* Resumen destacado arriba - Ahora con 3 elementos en lugar de 4 */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '32px',
        background: '#e0e7ff',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1' }}>
          <FaMoneyBillWave color="#2563eb" size={24} />
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Total recaudado</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>${totalPagado.toLocaleString('es-CL', formatoMoneda)}</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1' }}>
          <FaCheckCircle color="#22c55e" size={24} />
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Pagos completados</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#22c55e' }}>{pagosCompletados}</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1' }}>
          <FaExclamationTriangle color="#ef4444" size={24} />
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Atrasados</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444' }}>{pagosAtrasados} (${totalAtrasado.toLocaleString('es-CL', formatoMoneda)})</div>
          </div>
        </div>
      </div>
      
      <ConceptosForm user={user} setRefresh={setRefresh} />
      <PagosList 
        user={user}
        refresh={refresh}
        onPagosChange={() => setRefresh(prev => !prev)}
        isPagoAtrasado={isPagoAtrasado}
        pagosAtrasadosMap={pagosAtrasadosMap}
        mesesMap={mesesMap}
        conceptosAtrasadosForzados={conceptosAtrasadosForzados}
        formatoMoneda={formatoMoneda}
      />
    </section>
  );
}