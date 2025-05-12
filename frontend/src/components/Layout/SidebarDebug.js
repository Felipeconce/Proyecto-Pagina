import React from 'react';
import Sidebar from './Sidebar';
import styles from './SidebarDebug.module.css';

// Este componente es solo para depuración y debe eliminarse después de solucionar el problema
export default function SidebarDebug({ open, setOpen, user }) {
  return (
    <div className={styles.debugContainer}>
      <Sidebar open={open} setOpen={setOpen} user={user} />
    </div>
  );
} 