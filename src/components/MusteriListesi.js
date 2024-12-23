// MusteriListesi.js
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
  TextField,
  Box,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';

import CustomerTable from './CustomerTable';
import EditCustomerModal from './EditCustomerModal';
import EditSantiyeModal from './EditSantiyeModal';
import AddCustomerModal from './AddCustomerModal';
import DeleteCustomerModal from './DeleteCustomerModal';
import DeleteSantiyeModal from './DeleteSantiyeModal';
import TransferCustomerModal from './TransferCustomerModal';

// Arama kutusu için stil
const SearchBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
  marginTop: theme.spacing(2)
}));

const MusteriListesi = () => {
  const [approvedCustomers, setApprovedCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSantiye, setSelectedSantiye] = useState(null);
  const [customerShantiyeler, setCustomerShantiyeler] = useState([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditSantiyeModalOpen, setIsEditSantiyeModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteSantiyeModalOpen, setIsDeleteSantiyeModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedCustomerForTransfer, setSelectedCustomerForTransfer] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

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

        const approvedData = customerData.filter(customer => customer['Onay'] === 'Onaylandı');
        setApprovedCustomers(approvedData);
        
        // Şantiyeleri filtrele ve state'e kaydet
        const santiyeler = approvedData.filter(customer => customer.Şantiye);
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

  const handleTransferSantiye = (santiye) => {
    setSelectedCustomerForTransfer(santiye);
    setIsTransferModalOpen(true);
  };

  const handleTransferCustomer = (customer) => {
    setSelectedCustomerForTransfer(customer);
    setIsTransferModalOpen(true);
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

  const handleTransferModalClose = () => {
    setIsTransferModalOpen(false);
    setSelectedCustomerForTransfer(null);
  };

  const getFilteredCustomers = () => {
    const customers = getCustomersWithŞantiye();
    if (!searchTerm) return customers;

    return customers.filter(customer => {
      const matchesSearch = 
        customer['Müşteri Adı']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.cariCode?.toLowerCase().includes(searchTerm.toLowerCase());

      // Şantiyelerde de ara
      const hasMatchingŞantiye = customer.şantiyeler?.some(şantiye => 
        şantiye['Şantiye Adı']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        şantiye['Şantiye Cari Kodu']?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return matchesSearch || hasMatchingŞantiye;
    });
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

      <SearchBox>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          placeholder="Müşteri adı veya cari kod ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          Yeni Müşteri Ekle
        </Button>
      </SearchBox>

      <CustomerTable
        customers={getFilteredCustomers()}
        onEdit={openEditModal}
        onEditSantiye={openEditSantiyeModal}
        onDelete={openDeleteModal}
        onDeleteSantiye={openDeleteSantiyeModal}
        onTransferSantiye={handleTransferSantiye}
        onTransferCustomer={handleTransferCustomer}
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

      <EditSantiyeModal
        isOpen={isEditSantiyeModalOpen}
        onClose={() => setIsEditSantiyeModalOpen(false)}
        selectedSantiye={selectedSantiye}
        setSelectedSantiye={setSelectedSantiye}
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

export default MusteriListesi;
