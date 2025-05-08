import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaMoneyBillWave, FaReceipt, FaFileAlt, FaCalendarAlt, FaCheckCircle, FaHourglassHalf, FaExclamationTriangle, FaUserCircle, FaEnvelope, FaIdBadge, FaArrowRight, FaChartLine, FaBalanceScale, FaArrowUp, FaArrowDown } from 'react-icons/fa';

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

  // Estilo común para los botones de navegación
  const linkButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    borderRadius: '8px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    width: '100%'
  };
  
  // Estilo común para tarjetas
  const cardStyle = {
    background: 'white',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  };
  
  // Estilo para el contenido de la tarjeta
  const cardContentStyle = {
    padding: '1rem',
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  };
  
  // Estilo para el footer de la tarjeta
  const cardFooterStyle = {
    marginTop: 'auto',
    padding: '0'
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
    <div className="dashboard-container">
      <h2 style={{
        fontSize: '28px',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <FaChartLine color="#3366cc" /> Dashboard
      </h2>
      
      {/* Tarjeta de bienvenida */}
      <div className="card-blur bienvenida" style={{
      background: 'rgba(255,255,255,0.92)',
      borderRadius: 18,
      boxShadow: '0 2px 8px rgba(34,51,102,0.08)',
        padding: '1.5rem',
        margin: '0 0 1.5rem 0',
      color: '#223366',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>
          <FaUserCircle style={{ color: '#3366cc' }}/>
      </div>
        <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: 8 }}>
        ¡Bienvenido, {user.nombre}!
      </h2>
        <div style={{ fontSize: '1rem', marginBottom: 12, color: '#254a91', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaEnvelope /> {user.email}
      </div>
      <div style={{
        background: 'linear-gradient(90deg, #3366cc 0%, #254a91 100%)',
        color: '#fff',
        borderRadius: 8,
        padding: '0.4rem 1.2rem',
        fontWeight: 600,
          marginBottom: 12,
          fontSize: '1rem',
          boxShadow: '0 1px 4px rgba(34,51,102,0.08)',
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem'
        }}>
          <FaIdBadge /> {roles[user.rol_id] || user.rol_id}
        </div>
      </div>

      {/* Nueva tarjeta de Saldo */}
      <div className="saldo-card" style={{
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        marginBottom: '1.5rem'
      }}>
        <div className="card-header" style={{
          background: '#f1f5f9',
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#334155'
        }}>
          <FaBalanceScale /> Saldo Actual
        </div>
        <div className="saldo-content" style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="saldo-amount" style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: saldoData.esPositivo ? '#16a34a' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {saldoData.esPositivo ? <FaArrowUp color="#16a34a" /> : <FaArrowDown color="#ef4444" />}
            ${Math.abs(saldoData.saldo).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
          </div>
          <div className="saldo-description" style={{
            fontSize: '1rem',
            color: '#64748b',
            marginTop: '0.5rem',
            textAlign: 'center'
          }}>
            {saldoData.esPositivo 
              ? 'Diferencia positiva entre ingresos y gastos' 
              : 'Diferencia negativa entre ingresos y gastos'}
          </div>
          <div className="saldo-details" style={{
            display: 'flex',
            justifyContent: 'space-around',
            width: '100%',
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '8px'
          }}>
            <div className="detail-item" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Ingresos</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                ${pagosData.totalPagado.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="detail-item" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Gastos</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>
                ${gastosData.totalGastos.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Tarjeta de Pagos */}
        <div className="dashboard-card" style={cardStyle}>
          <div className="card-header" style={{
            background: '#e0e7ff',
            color: '#2563eb',
            padding: '1rem',
            borderBottom: '1px solid #c7d2fe',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.25rem',
            fontWeight: 700
          }}>
            <FaMoneyBillWave /> Pagos
          </div>
          <div className="card-content" style={cardContentStyle}>
            <div className="stats-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div className="stat-item">
                <div className="stat-label" style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Recaudado</div>
                <div className="stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb' }}>
                  ${pagosData.totalPagado.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label" style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pagos Completados</div>
                <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>
                  {pagosData.pagosCompletados} <FaCheckCircle size={16} />
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label" style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pagos Atrasados</div>
                <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>
                  {pagosData.pagosAtrasados} <FaExclamationTriangle size={16} />
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label" style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Atrasado</div>
                <div className="stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>
                  ${pagosData.totalAtrasado.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
            <div style={cardFooterStyle}>
              <Link to="/pagos" style={{
                ...linkButtonStyle,
                background: '#e0e7ff',
                color: '#2563eb'
              }}>
                Ir a Pagos <FaArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Tarjeta de Gastos */}
        <div className="dashboard-card" style={cardStyle}>
          <div className="card-header" style={{
            background: '#dcfce7',
            color: '#16a34a',
            padding: '1rem',
            borderBottom: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.25rem',
            fontWeight: 700
          }}>
            <FaReceipt /> Gastos
          </div>
          <div className="card-content" style={cardContentStyle}>
            <div className="stats-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div className="stat-item">
                <div className="stat-label" style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Gastado</div>
                <div className="stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                  ${gastosData.totalGastos.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label" style={{ fontSize: '0.875rem', color: '#6b7280' }}>Cantidad Gastos</div>
                <div className="stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                  {gastosData.cantidadGastos}
                </div>
              </div>
            </div>
            {gastosData.ultimosGastos.length > 0 ? (
              <div className="ultimos-gastos" style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>Últimos Gastos</div>
                {gastosData.ultimosGastos.map((gasto, index) => (
                  <div key={index} style={{ 
                    fontSize: '0.875rem', 
                    padding: '0.5rem',
                    marginBottom: '0.25rem',
                    background: '#f9fafb',
                    borderRadius: 6,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <div className="gasto-desc" style={{ fontWeight: 500 }}>{gasto.descripcion}</div>
                    <div className="gasto-monto" style={{ fontWeight: 600 }}>
                      ${Number(gasto.monto).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>No hay gastos registrados</div>
            )}
            <div style={cardFooterStyle}>
              <Link to="/gastos" style={{
                ...linkButtonStyle,
                background: '#dcfce7',
                color: '#16a34a'
              }}>
                Ir a Gastos <FaArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Tarjeta de Documentos */}
        <div className="dashboard-card" style={cardStyle}>
          <div className="card-header" style={{
            background: '#fef3c7',
            color: '#d97706',
            padding: '1rem',
            borderBottom: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.25rem',
            fontWeight: 700
          }}>
            <FaFileAlt /> Documentos
          </div>
          <div className="card-content" style={cardContentStyle}>
            <div className="stats-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(1, 1fr)',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div className="stat-item">
                <div className="stat-label" style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Documentos</div>
                <div className="stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706' }}>
                  {documentosData.totalDocumentos}
                </div>
              </div>
            </div>
            {documentosData.ultimosDocumentos.length > 0 ? (
              <div className="ultimos-documentos" style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>Últimos Documentos</div>
                {documentosData.ultimosDocumentos.map((doc, index) => (
                  <div key={index} style={{ 
                    fontSize: '0.875rem', 
                    padding: '0.5rem',
                    marginBottom: '0.25rem',
                    background: '#f9fafb',
                    borderRadius: 6
                  }}>
                    <div className="doc-nombre" style={{ fontWeight: 600 }}>{doc.nombre}</div>
                    <div className="doc-fecha" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {new Date(doc.fecha_subida).toLocaleDateString('es-CL')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>No hay documentos registrados</div>
            )}
            <div style={cardFooterStyle}>
              <Link to="/documentos" style={{
                ...linkButtonStyle,
                background: '#fef3c7',
                color: '#d97706'
              }}>
                Ir a Documentos <FaArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Tarjeta de Fechas Importantes */}
        <div className="dashboard-card" style={cardStyle}>
          <div className="card-header" style={{
            background: '#dbeafe',
            color: '#2563eb',
            padding: '1rem',
            borderBottom: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.25rem',
            fontWeight: 700
          }}>
            <FaCalendarAlt /> Calendario
          </div>
          <div className="card-content" style={cardContentStyle}>
            {fechasData.proximasFechas.length > 0 ? (
              <div className="proximas-fechas" style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>Próximas Fechas</div>
                {fechasData.proximasFechas.map((fecha, index) => (
                  <div key={index} style={{ 
                    fontSize: '0.875rem', 
                    padding: '0.5rem',
                    marginBottom: '0.25rem',
                    background: '#f9fafb',
                    borderRadius: 6,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div className="fecha-desc" style={{ fontWeight: 600 }}>{fecha.descripcion}</div>
                    <div className="fecha-fecha" style={{ 
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#3b82f6'
                    }}>
                      {new Date(fecha.fecha).toLocaleDateString('es-CL', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\//g, '-')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>No hay fechas importantes próximas</div>
            )}
            <div style={cardFooterStyle}>
              <Link to="/fechas" style={{
                ...linkButtonStyle,
                background: '#dbeafe',
                color: '#2563eb'
              }}>
                Ir a Calendario <FaArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}