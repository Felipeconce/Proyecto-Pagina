import React from 'react';
import FechasList from '../components/Fechas/FechasList';
import FechasForm from '../components/Fechas/FechasForm';
import { FaCalendarAlt } from 'react-icons/fa';

export default function FechasPage({ user }) {
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
        <FaCalendarAlt color="#3b82f6" /> Calendario
      </h2>
      <FechasForm user={user} />
      <FechasList user={user} />
    </section>
  );
}