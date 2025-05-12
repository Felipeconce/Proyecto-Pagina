import React from 'react';
import FechasList from '../components/Fechas/FechasList';
import FechasForm from '../components/Fechas/FechasForm';
import { FaCalendarAlt } from 'react-icons/fa';

export default function FechasPage({ user }) {
  return (
    <section className="fechas-page">
      <h2 className="page-title">
        <FaCalendarAlt color="#3b82f6" /> Calendario
      </h2>
      <div className="card">
        <h3 className="section-subtitle">Agregar fecha importante</h3>
        <FechasForm user={user} />
      </div>
      <div className="card">
        <h3 className="section-subtitle">Próximas fechas</h3>
        <FechasList user={user} />
      </div>
    </section>
  );
}