import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaMoneyBillWave, FaReceipt, FaFileAlt, FaCalendarAlt, FaCheckCircle, FaExclamationTriangle, FaUserCircle, FaEnvelope, FaIdBadge, FaArrowRight, FaChartLine, FaBalanceScale, FaArrowUp, FaArrowDown, FaWallet, FaFileInvoiceDollar, FaComments } from 'react-icons/fa';
import { Wallet, FileStack, FileText, Calendar, CheckCircle, MessageCircle } from 'lucide-react';
import styles from './DashboardModern.module.css';

export default function Dashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [pagosData, setPagosData] = useState({
    totalPagado: 0,
    pagosCompletados: 0,
    pagosPendientes: 0,
    pagosAtrasados: 0,
    totalAtrasado: 0
  });
  const [gastosData, setGastosData] = useState({
    totalGastos: 0,
    cantidadGastos: 0,
    ultimosGastos: []
  });
  const [documentosData, setDocumentosData] = useState({
    totalDocumentos: 0,
    ultimosDocumentos: []
  });
  const [fechasData, setFechasData] = useState({
    proximasFechas: []
  });
  const [saldoData, setSaldoData] = useState({
    saldo: 0,
    esPositivo: true
  });

  const roles = {
    1: 'Superusuario',
    2: 'Presidente',
    3: 'Tesorero',
    4: 'Apoderado'
  };

  // Mapeo de abreviaturas de meses a números de mes (1-12)
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
    const token = localStorage.getItem('token');
    
    // Promesas para cargar datos
    const fetchPagos = fetch(`${process.env.REACT_APP_API_URL}/pagos`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }).then(res => res.ok ? res.json() : []);
    
    const fetchConceptos = fetch(`${process.env.REACT_APP_API_URL}/conceptos`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }).then(res => res.ok ? res.json() : []);
    
    const fetchAlumnos = fetch(`${process.env.REACT_APP_API_URL}/apoderados`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }).then(res => res.ok ? res.json() : []);
    
    const fetchGastos = fetch(`${process.env.REACT_APP_API_URL}/gastos`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }).then(res => res.ok ? res.json() : []);
    
    // Cargar datos de pagos junto con conceptos y alumnos para calcular pagos atrasados correctamente
    Promise.all([fetchPagos, fetchConceptos, fetchAlumnos, fetchGastos])
      .then(([pagos, conceptos, alumnos, gastos]) => {
        const totalPagado = pagos.reduce((acc, p) => acc + (p.estado === 'pagado' ? Number(p.monto) : 0), 0);
        const pagosCompletados = pagos.filter(p => p.estado === 'pagado').length;
        const pagosPendientes = pagos.filter(p => p.estado !== 'pagado').length;
        
        // Identificar conceptos especiales (MAR, ABR, etc.)
        const conceptosEspeciales = conceptos.filter(c => 
          conceptosAtrasadosForzados.includes(c.nombre)
        );
        
        // Calcular pagos atrasados usando la lógica mejorada
        const pagosAtrasadosMap = calcularPagosAtrasados(pagos, conceptos, alumnos, conceptosEspeciales);
        
        // Contar cuántos pagos atrasados hay en total
        const pagosAtrasados = Object.keys(pagosAtrasadosMap).reduce(
          (total, alumnoId) => total + Object.keys(pagosAtrasadosMap[alumnoId]).length, 
          0
        );
        
        // Calcular el monto total de pagos atrasados
        const totalAtrasado = pagos.filter(p => 
          p.estado !== 'pagado' && pagosAtrasadosMap[p.usuario_id]?.[p.concepto_id]
        ).reduce((acc, p) => acc + Number(p.monto), 0);
        
        setPagosData({
          totalPagado,
          pagosCompletados,
          pagosPendientes,
          pagosAtrasados,
          totalAtrasado
        });
        
        // Procesar gastos
        const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
        const cantidadGastos = gastos.length;
        // Obtener los 3 últimos gastos ordenados por fecha
        const ultimosGastos = [...gastos]
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .slice(0, 3);
        
        setGastosData({
          totalGastos,
          cantidadGastos,
          ultimosGastos
        });
        
        // Calcular el saldo (ingresos - gastos)
        const saldo = totalPagado - totalGastos;
        setSaldoData({
          saldo,
          esPositivo: saldo >= 0
        });
      })
      .catch(err => {
        console.error('Error cargando datos:', err);
      });
    
    // Cargar datos de documentos
    fetch(`${process.env.REACT_APP_API_URL}/documentos`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.ok ? res.json() : [])
      .then(documentos => {
        const totalDocumentos = documentos.length;
        // Obtener los 3 últimos documentos ordenados por fecha
        const ultimosDocumentos = [...documentos]
          .sort((a, b) => new Date(b.fecha_subida) - new Date(a.fecha_subida))
          .slice(0, 3);
        
        setDocumentosData({
          totalDocumentos,
          ultimosDocumentos
        });
      })
      .catch(err => {
        console.error('Error cargando datos de documentos:', err);
      });
    
    // Cargar datos de fechas importantes
    fetch(`${process.env.REACT_APP_API_URL}/fechas`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.ok ? res.json() : [])
      .then(fechas => {
        // Obtener las 3 próximas fechas ordenadas por fecha
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const proximasFechas = [...fechas]
          .filter(f => new Date(f.fecha) >= hoy)
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
          .slice(0, 3);
        
        setFechasData({
          proximasFechas
        });
      })
      .catch(err => {
        console.error('Error cargando datos de fechas:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Función para verificar si un concepto está atrasado
  const isConceptoAtrasado = (conceptoId, conceptosArray, conceptosEspeciales = []) => {
    const concepto = conceptosArray.find(c => c.id === conceptoId);
    if (!concepto) return false;
    
    // Verificar si el concepto está en la lista de forzados
    if (conceptosEspeciales.some(c => c.id === conceptoId)) {
      return true;
    }
    
    // Forzar que MAM, MAR y ABR estén atrasados
    if (conceptosAtrasadosForzados.includes(concepto.nombre)) {
      return true;
    }
    
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1; // Los meses en JS son 0-11
    
    // Si el concepto es un mes estándar (MAR, ABR, etc.)
    if (mesesMap[concepto.nombre]) {
      const mesConcepto = mesesMap[concepto.nombre];
      
      // Si estamos en el mismo año académico y el mes ya pasó
      if (mesConcepto < mesActual && mesActual <= 12) {
        return true;
      }
    }
    
    // Si el concepto tiene fecha de vencimiento
    if (concepto.fecha_vencimiento) {
      const fechaVencimiento = new Date(concepto.fecha_vencimiento);
      fechaVencimiento.setHours(23, 59, 59, 999);
      return hoy > fechaVencimiento;
    }
    
    // Para conceptos personalizados sin fecha, marcarlos como atrasados por defecto
    if (concepto.orden === 0 || concepto.orden === null) {
      // Excepción para PAP
      if (concepto.nombre === 'PAP') {
        return false;
      }
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
            atrasadosMap[alumno.id][concepto.id] = true;
          }
        }
      });
    });
    
    return atrasadosMap;
  };

  if (loading) {
    return (
      <div className="dashboard-loading" style={{
        textAlign: 'center',
        padding: '3rem',
        color: '#4b5563'
      }}>
        <div>Cargando información...</div>
      </div>
    );
  }

  // Datos de ejemplo (puedes reemplazar por props o hooks reales)
  const nombre = user?.nombre || 'Usuario';
  const resumen = 'Saldo al día';
  const pagosPendientes = 1;
  const nuevosGastos = 2;
  const nuevosDocumentos = 1;
  const notificacion = 'Reunión de apoderados el lunes 6';

  return (
    <>
      <div className={styles.bannerNotificacion}>
        <Calendar className={styles.bannerIcon + " text-indigo-600"} />
        <span>{notificacion}</span>
      </div>
      <div className={styles.dashboardContent}>
        <div className={styles.saludoSection}>
          <div>
            <h1 className={styles.saludo}>Bienvenido, {nombre}</h1>
          </div>
          <div className={styles.ilustracion}>
            {/* Aquí podrías poner un SVG decorativo o una imagen */}
            <img src="https://www.svgrepo.com/show/521000/working-on-laptop.svg" alt="Ilustración" height={120} />
          </div>
        </div>
        <div className={styles.tarjetasGrid}>
          <div className={styles.tarjeta + ' ' + styles.tarjetaResumen}>
            <CheckCircle className={styles.tarjetaIcon + " bg-green-100 text-green-600"} size={45} />
            <div>
              <div className={styles.tarjetaTitulo}>Resumen</div>
              <div className={styles.tarjetaDesc}>
                Saldo: {saldoData.saldo.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })} {saldoData.esPositivo ? '✔️' : '❗'}
              </div>
            </div>
          </div>
          <Link to="/pagos" className={styles.tarjeta + ' ' + styles.tarjetaPagos} style={{ textDecoration: 'none' }}>
            <Wallet className={styles.tarjetaIcon + " bg-teal-100 text-teal-600"} size={45} />
            <div>
              <div className={styles.tarjetaTitulo}>Pagos</div>
              <div className={styles.tarjetaDesc}>
                {pagosData.pagosPendientes} pendiente{pagosData.pagosPendientes === 1 ? '' : 's'} | {pagosData.pagosAtrasados} atrasado{pagosData.pagosAtrasados === 1 ? '' : 's'}
              </div>
            </div>
          </Link>
          <Link to="/gastos" className={styles.tarjeta + ' ' + styles.tarjetaGastos} style={{ textDecoration: 'none' }}>
            <FileStack className={styles.tarjetaIcon + " bg-orange-100 text-orange-600"} size={45} />
            <div>
              <div className={styles.tarjetaTitulo}>Gastos</div>
              <div className={styles.tarjetaDesc}>
                {gastosData.cantidadGastos} gasto{gastosData.cantidadGastos === 1 ? '' : 's'} | Total: {gastosData.totalGastos.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
              </div>
            </div>
          </Link>
          <Link to="/fechas" className={styles.tarjeta + ' ' + styles.tarjetaCalendario} style={{ textDecoration: 'none' }}>
            <Calendar className={styles.tarjetaIcon + " bg-indigo-100 text-indigo-600"} size={45} />
            <div>
              <div className={styles.tarjetaTitulo}>Calendario</div>
              <div className={styles.tarjetaDesc}>
                Próximos eventos: {fechasData.proximasFechas.length}
              </div>
            </div>
          </Link>
          <Link to="/documentos" className={styles.tarjeta + ' ' + styles.tarjetaDocumentos} style={{ textDecoration: 'none' }}>
            <FileText className={styles.tarjetaIcon + " bg-indigo-100 text-indigo-600"} size={45} />
            <div>
              <div className={styles.tarjetaTitulo}>Documentos</div>
              <div className={styles.tarjetaDesc}>
                {documentosData.totalDocumentos} documento{documentosData.totalDocumentos === 1 ? '' : 's'}
              </div>
            </div>
          </Link>
          <Link to="/comunicaciones" className={styles.tarjeta + ' ' + styles.tarjetaComunicaciones} style={{ textDecoration: 'none' }}>
            <MessageCircle className={styles.tarjetaIcon + " bg-indigo-100 text-indigo-600"} size={45} />
            <div>
              <div className={styles.tarjetaTitulo}>Comunicaciones</div>
              <div className={styles.tarjetaDesc}>Ver mensajes</div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}