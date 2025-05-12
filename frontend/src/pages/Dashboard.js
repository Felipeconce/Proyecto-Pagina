import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaMoneyBillWave, FaReceipt, FaFileAlt, FaCalendarAlt, FaCheckCircle, FaExclamationTriangle, FaUserCircle, FaEnvelope, FaIdBadge, FaArrowRight, FaChartLine, FaBalanceScale, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import styles from '../components/Documentos/DocumentosForm.module.css';

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

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.dashboardTitle}>
        <FaChartLine color="#2563eb" /> Dashboard
      </h2>
      
      {/* Cabecera con tarjeta de bienvenida y saldo, una al lado de la otra */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {/* Tarjeta de bienvenida */}
        <div style={{ 
          flex: '1', 
          minWidth: '300px', 
          padding: '20px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              color: '#2563eb',
              fontSize: '2.5rem',
            }}>
              <FaUserCircle />
            </div>
            <div>
              <h2 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '1.4rem',
                fontWeight: '700',
                color: '#1e40af'
              }}>
                ¡Bienvenido, {user.nombre}!
              </h2>
              <div style={{ 
                fontSize: '0.9rem', 
                margin: '0',
                color: '#4b5563',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}>
                <FaEnvelope /> {user.email}
              </div>
              <div style={{ 
                fontSize: '0.9rem',
                color: '#4b5563',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(219, 234, 254, 0.5)',
                padding: '4px 10px',
                borderRadius: '12px',
                display: 'inline-flex'
              }}>
                <FaIdBadge /> {roles[user.rol_id] || user.rol_id}
              </div>
            </div>
          </div>
        </div>
        
        {/* Tarjeta de Saldo Actual con información completa */}
        <div style={{ 
          flex: '2', 
          minWidth: '320px', 
          padding: '20px',
          borderRadius: '16px',
          background: 'white',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ 
            fontSize: '1.1rem', 
            marginBottom: '16px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%)',
            color: '#0c4a6e',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaBalanceScale size={22} color="#0369a1" /> Saldo Actual
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '12px',
              margin: '0 0 20px 0'
            }}>
              <div style={{ 
                fontSize: '2.2rem', 
                fontWeight: '700',
                color: saldoData.esPositivo ? '#059669' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {saldoData.esPositivo ? <FaArrowUp size={26} /> : <FaArrowDown size={26} />} ${Math.abs(saldoData.saldo).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '16px'
          }}>
            {/* Ingresos */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              background: 'linear-gradient(90deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#166534', marginBottom: '6px', fontWeight: '500' }}>Ingresos</div>
                <div style={{ fontSize: '1.3rem', color: '#059669', fontWeight: '700' }}>
                  ${pagosData.totalPagado.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#059669', marginTop: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FaCheckCircle size={14} /> {pagosData.pagosCompletados} pagos
                  </span>
                </div>
              </div>
              <div style={{ 
                color: '#059669', 
                fontSize: '2rem',
                alignSelf: 'center' 
              }}>
                <FaArrowUp />
              </div>
            </div>
            
            {/* Gastos */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              background: 'linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#991b1b', marginBottom: '6px', fontWeight: '500' }}>Gastos</div>
                <div style={{ fontSize: '1.3rem', color: '#dc2626', fontWeight: '700' }}>
                  ${gastosData.totalGastos.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#dc2626', marginTop: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FaReceipt size={14} /> {gastosData.cantidadGastos} gastos
                  </span>
                </div>
              </div>
              <div style={{ 
                color: '#dc2626', 
                fontSize: '2rem',
                alignSelf: 'center' 
              }}>
                <FaArrowDown />
              </div>
            </div>
            
            {/* Información adicional de pagos atrasados */}
            <div style={{
              gridColumn: '1 / 3',
              background: 'linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#1e40af', marginBottom: '6px', fontWeight: '500' }}>Pagos Atrasados</div>
                <div style={{ fontSize: '1.1rem', color: '#2563eb', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#dc2626' }}>{pagosData.pagosAtrasados}</span> pagos por <span style={{ color: '#dc2626' }}>${pagosData.totalAtrasado.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <div style={{
                color: '#dc2626',
                fontSize: '1.5rem'
              }}>
                <FaExclamationTriangle />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Grid principal con 3 tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Tarjeta de Gastos */}
        <div style={{ 
          padding: '20px',
          borderRadius: '16px',
          background: 'white',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            fontSize: '1.1rem', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#166534',
            fontWeight: '600'
          }}>
            <FaReceipt size={22} color="#059669" />
            <span>Resumen de Gastos</span>
          </div>
          
          {/* Sección principal de gastos */}
          <div style={{
            background: 'linear-gradient(90deg, #f0fdf4 0%, #dcfce7 100%)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#166534', marginBottom: '6px', fontWeight: '500' }}>Total Gastado</div>
            <div style={{ fontSize: '1.4rem', color: '#059669', fontWeight: '700' }}>
              ${gastosData.totalGastos.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
            </div>
          </div>
          
          {/* Listado de últimos gastos */}
          {gastosData.ultimosGastos.length > 0 ? (
            <div style={{ 
              background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ 
                fontSize: '0.95rem', 
                fontWeight: '600', 
                marginBottom: '12px',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FaReceipt size={14} color="#059669" /> Últimos Gastos:
              </div>
              {gastosData.ultimosGastos.slice(0, 3).map((gasto, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '0.9rem', 
                  padding: '8px 0',
                  borderBottom: index < gastosData.ultimosGastos.slice(0, 3).length - 1 ? '1px solid #e2e8f0' : 'none'
                }}>
                  <div style={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap', 
                    maxWidth: '70%',
                    color: '#475569'
                  }}>
                    {gasto.descripcion}
                  </div>
                  <div style={{ fontWeight: '600', color: '#059669' }}>
                    ${Number(gasto.monto).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#64748b', 
              textAlign: 'center', 
              padding: '16px 0',
              background: '#f8fafc',
              borderRadius: '8px' 
            }}>
              No hay gastos registrados
            </div>
          )}
        </div>
        
        {/* Tarjeta de Documentos */}
        <div style={{ 
          padding: '20px',
          borderRadius: '16px',
          background: 'white',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            fontSize: '1.1rem', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#854d0e',
            fontWeight: '600'
          }}>
            <FaFileAlt size={22} color="#ca8a04" />
            <span>Documentos</span>
          </div>
          
          {/* Sección principal de documentos */}
          <div style={{
            background: 'linear-gradient(90deg, #fefce8 0%, #fef9c3 100%)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#854d0e', marginBottom: '6px', fontWeight: '500' }}>Total Documentos</div>
            <div style={{ fontSize: '1.4rem', color: '#ca8a04', fontWeight: '700' }}>
              {documentosData.totalDocumentos}
            </div>
          </div>
          
          {/* Listado de últimos documentos */}
          {documentosData.ultimosDocumentos.length > 0 ? (
            <div style={{ 
              background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ 
                fontSize: '0.95rem', 
                fontWeight: '600', 
                marginBottom: '12px',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FaFileAlt size={14} color="#ca8a04" /> Últimos Documentos:
              </div>
              {documentosData.ultimosDocumentos.map((doc, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '0.9rem', 
                  padding: '8px 0',
                  borderBottom: index < documentosData.ultimosDocumentos.length - 1 ? '1px solid #e2e8f0' : 'none'
                }}>
                  <div style={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap', 
                    maxWidth: '70%',
                    color: '#475569'
                  }}>
                    {doc.nombre}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {new Date(doc.fecha_subida).toLocaleDateString('es-CL')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#64748b', 
              textAlign: 'center', 
              padding: '16px 0',
              background: '#f8fafc',
              borderRadius: '8px' 
            }}>
              No hay documentos registrados
            </div>
          )}
        </div>
        
        {/* Tarjeta de Fechas Importantes */}
        <div style={{ 
          padding: '20px',
          borderRadius: '16px',
          background: 'white',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            fontSize: '1.1rem', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#1e40af',
            fontWeight: '600'
          }}>
            <FaCalendarAlt size={22} color="#2563eb" />
            <span>Próximas Fechas</span>
          </div>
          
          {/* Listado de fechas próximas */}
          {fechasData.proximasFechas.length > 0 ? (
            <div style={{ 
              background: 'linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              {fechasData.proximasFechas.map((fecha, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: index < fechasData.proximasFechas.length - 1 ? '14px' : '0',
                  paddingBottom: index < fechasData.proximasFechas.length - 1 ? '14px' : '0',
                  borderBottom: index < fechasData.proximasFechas.length - 1 ? '1px solid #bfdbfe' : 'none'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ 
                      fontWeight: '600', 
                      color: '#1e40af',
                      fontSize: '0.95rem',
                      marginBottom: '6px'
                    }}>
                      {fecha.descripcion}
                    </div>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      color: '#3b82f6',
                      background: 'rgba(219, 234, 254, 0.5)',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FaCalendarAlt size={12} color="#3b82f6" /> {new Date(fecha.fecha).toLocaleDateString('es-CL')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#64748b', 
              textAlign: 'center', 
              padding: '30px 0',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #e2e8f0'
            }}>
              No hay fechas importantes próximas
            </div>
          )}
        </div>
      </div>
    </div>
  );
}