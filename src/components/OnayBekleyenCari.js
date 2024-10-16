import React, { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import {
  Container,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';

import CustomerTable from './CustomerTable';
import EditCustomerModal from './EditCustomerModal';

const OnayBekleyenCari = () => {
  const [approvedCustomers, setApprovedCustomers] = useState([]);
  const [pendingCustomers, setPendingCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const db = getFirestore();
    const unsubscribe = onSnapshot(
      collection(db, 'müşteri listesi'),
      (snapshot) => {
        const customerData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          'Müşteri Adı': doc.data()['Müşteri Adı'] || '',
          cariCode: doc.data()['cariCode'] || '',
          Şantiye: doc.data()['Şantiye'] || '',
          parentId: doc.data().parentId || null,
        }));
      
        setPendingCustomers(customerData.filter(customer => customer['Onay'] === 'Onay Bekliyor'));
        setApprovedCustomers(customerData.filter(customer => customer['Onay'] === 'Onaylandı'));
        setLoading(false);
      },
      (error) => {
        console.error('Müşteri verileri alınırken hata oluştu:', error);
        setError('Müşteri verileri alınırken bir hata oluştu.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleCloseAlert = () => {
    setAlertOpen(false);
    setError(null);
    setSuccessMessage('');
  };

  if (loading) {
    return (
      <Container>
        <Typography>Yükleniyor...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Onay Bekleyen Cari Listesi
      </Typography>

      <CustomerTable
        customers={pendingCustomers}
        onEdit={openEditModal}
        type="pending"
      />

<EditCustomerModal
  isOpen={isEditModalOpen}
  onClose={() => setIsEditModalOpen(false)}
  selectedCustomer={selectedCustomer}
  setSelectedCustomer={setSelectedCustomer}
  approvedCustomers={approvedCustomers}
  setAlertOpen={setAlertOpen}
  setError={setError}
  setSuccessMessage={setSuccessMessage}
/>

      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default OnayBekleyenCari;