import React from 'react';
import GastosList from '../components/Gastos/GastosList';
import GastosForm from '../components/Gastos/GastosForm';
import { FaReceipt } from 'react-icons/fa';

export default function GastosPage({ user }) {
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
        <FaReceipt color="#16a34a" /> Gastos
      </h2>
      <GastosForm user={user} />
      <GastosList user={user} />
    </section>
  );
}