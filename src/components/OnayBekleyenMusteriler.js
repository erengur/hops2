import React, { useState, useEffect, useCallback } from 'react';
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
import EditSantiyeModal from './EditSantiyeModal';
import DeleteCustomerModal from './DeleteCustomerModal';
import DeleteSantiyeModal from './DeleteSantiyeModal';
import TransferCustomerModal from './TransferCustomerModal';

const OnayBekleyenMusteriler = () => {
  const [pendingCustomers, setPendingCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSantiye, setSelectedSantiye] = useState(null);
  const [customerShantiyeler, setCustomerShantiyeler] = useState([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditSantiyeModalOpen, setIsEditSantiyeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteSantiyeModalOpen, setIsDeleteSantiyeModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedCustomerForTransfer, setSelectedCustomerForTransfer] = useState(null);

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

        const pendingData = customerData.filter(customer => customer['Onay'] === 'Beklemede');
        setPendingCustomers(pendingData);
        
        const santiyeler = pendingData.filter(customer => customer.Şantiye);
        setCustomerShantiyeler(santiyeler);
        
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

  const openEditSantiyeModal = (santiye) => {
    setSelectedSantiye(santiye);
    setIsEditSantiyeModalOpen(true);
  };

  const openDeleteModal = (customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const openDeleteSantiyeModal = (santiye) => {
    setSelectedSantiye(santiye);
    setIsDeleteSantiyeModalOpen(true);
  };

  const handleTransferSantiye = useCallback((santiye) => {
    console.log('Şantiye transfer işlemi:', santiye);
    setSelectedCustomerForTransfer(santiye);
    setIsTransferModalOpen(true);
  }, []);

  const handleTransferCustomer = useCallback((customer) => {
    console.log('Müşteri transfer işlemi:', customer);
    setSelectedCustomerForTransfer(customer);
    setIsTransferModalOpen(true);
  }, []);

  const handleTransferModalClose = () => {
    setIsTransferModalOpen(false);
    setSelectedCustomerForTransfer(null);
  };

  const handleCloseAlert = () => {
    setAlertOpen(false);
    setError(null);
    setSuccessMessage('');
  };

  const getCustomersWithŞantiye = () => {
    const mainCustomers = pendingCustomers.filter(customer => customer.parentId === null);
    return mainCustomers.map(customer => ({
      ...customer,
      şantiyeler: pendingCustomers.filter(şantiye => şantiye.parentId === customer.id)
    }));
  };

  const handleDelete = useCallback((customer) => {
    console.log('Silme işlemi:', customer);
    openDeleteModal(customer);
  }, []);

  const handleDeleteSantiye = useCallback((santiye) => {
    console.log('Şantiye silme işlemi:', santiye);
    openDeleteSantiyeModal(santiye);
  }, []);

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
        Onay Bekleyen Müşteriler
      </Typography>

      <CustomerTable
        customers={getCustomersWithŞantiye()}
        onEdit={openEditModal}
        onEditSantiye={openEditSantiyeModal}
        onDelete={handleDelete}
        onDeleteSantiye={handleDeleteSantiye}
        onTransferSantiye={handleTransferSantiye}
        onTransferCustomer={handleTransferCustomer}
        type="pending"
      />

      <EditCustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        approvedCustomers={pendingCustomers}
        setAlertOpen={setAlertOpen}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
      />

      <EditSantiyeModal
        isOpen={isEditSantiyeModalOpen}
        onClose={() => setIsEditSantiyeModalOpen(false)}
        selectedSantiye={selectedSantiye}
        setSelectedSantiye={setSelectedSantiye}
        approvedCustomers={pendingCustomers}
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
        onTransfer={(customer) => {
          setIsDeleteModalOpen(false);
          setSelectedCustomerForTransfer(customer);
          setIsTransferModalOpen(true);
        }}
      />

      <DeleteSantiyeModal
        isOpen={isDeleteSantiyeModalOpen}
        onClose={() => setIsDeleteSantiyeModalOpen(false)}
        selectedSantiye={selectedSantiye}
        setCustomerShantiyeler={setCustomerShantiyeler}
        customerShantiyeler={customerShantiyeler}
        setAlertOpen={setAlertOpen}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
        onTransfer={(santiye) => {
          setIsDeleteSantiyeModalOpen(false);
          setSelectedCustomerForTransfer(santiye);
          setIsTransferModalOpen(true);
        }}
      />

      <TransferCustomerModal
        isOpen={isTransferModalOpen}
        onClose={handleTransferModalClose}
        selectedCustomer={selectedCustomerForTransfer}
        setAlertOpen={setAlertOpen}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
        isSantiyeTransfer={false}
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

export default OnayBekleyenMusteriler; 