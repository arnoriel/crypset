// components/ClientWrapper.tsx
'use client';

import { useEffect } from 'react';
import Modal from 'react-modal';
import { ReactNode } from 'react';

interface ClientWrapperProps {
  children: ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  useEffect(() => {
    // Set appElement untuk react-modal hanya di sisi klien
    Modal.setAppElement('#__next');
  }, []);

  return <>{children}</>;
}