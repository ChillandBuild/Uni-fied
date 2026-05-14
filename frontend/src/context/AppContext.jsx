import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Procurement
  const [vendors, setVendors] = useState([]);
  const [prs, setPrs] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [pos, setPos] = useState([]);
  const [grns, setGrns] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Inventory
  const [tanks, setTanks] = useState([]);

  // Production
  const [batches, setBatches] = useState([]);

  // Lookups
  const [lookups, setLookups] = useState({});

  const fetchVendors = useCallback(async () => {
    try {
      const data = await api.get('/procurement/vendors');
      setVendors(data);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error };
    }
  }, []);

  const fetchPRs = useCallback(async () => {
    try { setPrs(await api.get('/procurement/purchase-requisitions')); } catch {}
  }, []);

  const fetchRFQs = useCallback(async () => {
    try { setRfqs(await api.get('/procurement/rfqs')); } catch {}
  }, []);

  const fetchPOs = useCallback(async () => {
    try { setPos(await api.get('/procurement/purchase-orders')); } catch {}
  }, []);

  const fetchGRNs = useCallback(async () => {
    try { setGrns(await api.get('/procurement/grns')); } catch {}
  }, []);

  const fetchInvoices = useCallback(async () => {
    try { setInvoices(await api.get('/procurement/invoices')); } catch {}
  }, []);

  const fetchTanks = useCallback(async () => {
    try {
      const data = await api.get('/inventory/tanks');
      setTanks(data);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error };
    }
  }, []);

  const fetchBatches = useCallback(async () => {
    try {
      const data = await api.get('/production/batches');
      setBatches(data);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error };
    }
  }, []);

  const fetchLookup = useCallback(async (category) => {
    try {
      const data = await api.get(`/lookups?category=${category}`);
      setLookups(prev => ({ ...prev, [category]: data.map(d => d.value) }));
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error };
    }
  }, []);

  useEffect(() => {
    fetchVendors();
    fetchTanks();
    fetchLookup('gas_type');
    fetchLookup('shift');
    fetchLookup('location');
    fetchLookup('cylinder_type');
    fetchLookup('loss_type');
    fetchLookup('movement_type');
  }, []);

  return (
    <AppContext.Provider value={{
      vendors, fetchVendors,
      prs, fetchPRs,
      rfqs, fetchRFQs,
      pos, fetchPOs,
      grns, fetchGRNs,
      invoices, fetchInvoices,
      tanks, fetchTanks,
      batches, fetchBatches,
      lookups, fetchLookup,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
