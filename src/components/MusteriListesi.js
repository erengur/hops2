import React, { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import {
  Container,
  Typography,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';

import CustomerTable from './CustomerTable';
import EditCustomerModal from './EditCustomerModal';
import AddCustomerModal from './AddCustomerModal';
import DeleteCustomerModal from './DeleteCustomerModal';

const MusteriListesi = () => {
  const [approvedCustomers, setApprovedCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
          Şantiye: doc.data()['Şantiye'] || false,
          parentId: doc.data().parentId || null,
        }));

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

  const openDeleteModal = (customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleCloseAlert = () => {
    setAlertOpen(false);
    setError(null);
    setSuccessMessage('');
  };

  const getCustomersWithŞantiye = () => {
    const mainCustomers = approvedCustomers.filter(customer => customer.parentId === null);
    return mainCustomers.map(customer => ({
      ...customer,
      şantiyeler: approvedCustomers.filter(şantiye => şantiye.parentId === customer.id)
    }));
  };

  if (loading) {
    return (
      <Container>
        <Typography>Yükleniyor...</Typography>
      </Container>
    );
  }

  if (error && !selectedCustomer) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Onaylanmış Müşteri Listesi
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={() => setIsAddModalOpen(true)}
        style={{ marginBottom: '20px' }}
      >
        Yeni Müşteri Ekle
      </Button>

      <CustomerTable
        customers={getCustomersWithŞantiye()}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        type="approved"
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

      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        setAlertOpen={setAlertOpen}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
      />

      <DeleteCustomerModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        selectedCustomer={selectedCustomer}
        setAlertOpen={setAlertOpen}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
        setSelectedCustomer={setSelectedCustomer}
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

export default MusteriListesi;