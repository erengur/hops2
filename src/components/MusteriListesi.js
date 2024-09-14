import React, { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Modal,
  Box,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const ModalBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 500,
  backgroundColor: theme.palette.background.paper,
  borderRadius: 8,
  boxShadow: theme.shadows[5],
  padding: theme.spacing(4),
}));

const MusteriListesi = () => {
  const [approvedCustomers, setApprovedCustomers] = useState([]);
  const [pendingCustomers, setPendingCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerList, setSelectedCustomerList] = useState('approved');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);

  // Edit form state'leri
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Yeni müşteri ekleme form state'leri
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  // Silme işlemi için state
  const [customerToDelete, setCustomerToDelete] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    const db = getFirestore();
    try {
      const customerSnapshot = await getDocs(collection(db, 'müşteri listesi'));
      const customerData = customerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Müşterileri kategorize et
      const pending = [];
      const approved = [];
      customerData.forEach((customer) => {
        if (customer['Onay'] === 'Onay Bekliyor') {
          pending.push(customer);
        } else {
          approved.push(customer);
        }
      });

      setPendingCustomers(pending);
      setApprovedCustomers(approved);
    } catch (error) {
      console.error('Müşteri verileri alınırken bir hata oluştu:', error);
      setError('Müşteri verileri alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim()) {
      setError('Müşteri adı gereklidir.');
      setAlertOpen(true);
      return;
    }
    const db = getFirestore();
    try {
      const newCustomerRef = await addDoc(collection(db, 'müşteri listesi'), {
        'Müşteri Adı': newCustomerName,
        Telefon: newCustomerPhone,
        'E-posta': newCustomerEmail,
        Onay: 'Onay Bekliyor',
      });

      const newCustomer = {
        id: newCustomerRef.id,
        'Müşteri Adı': newCustomerName,
        Telefon: newCustomerPhone,
        'E-posta': newCustomerEmail,
        Onay: 'Onay Bekliyor',
      };
      setPendingCustomers((prevCustomers) => [...prevCustomers, newCustomer]);

      setSuccessMessage('Yeni müşteri başarıyla eklendi.');
      setAlertOpen(true);
      setIsAddModalOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
    } catch (error) {
      console.error('Yeni müşteri eklenirken bir hata oluştu:', error);
      setError('Yeni müşteri eklenirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  const handleDeleteCustomer = async () => {
    const db = getFirestore();
    try {
      await deleteDoc(doc(db, 'müşteri listesi', customerToDelete.id));

      if (selectedCustomerList === 'approved') {
        setApprovedCustomers((prevCustomers) =>
          prevCustomers.filter((cust) => cust.id !== customerToDelete.id)
        );
      } else if (selectedCustomerList === 'pending') {
        setPendingCustomers((prevCustomers) =>
          prevCustomers.filter((cust) => cust.id !== customerToDelete.id)
        );
      }

      setSuccessMessage('Müşteri başarıyla silindi.');
      setAlertOpen(true);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Müşteri silinirken bir hata oluştu:', error);
      setError('Müşteri silinirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  const openDeleteModal = (customer, listType) => {
    setCustomerToDelete(customer);
    setSelectedCustomerList(listType);
    setIsDeleteModalOpen(true);
  };

  const openEditModal = (customer, listType) => {
    setSelectedCustomer(customer);
    setSelectedCustomerList(listType);
    setEditName(customer?.['Müşteri Adı'] || ''); // Null check added here
    setEditPhone(customer?.['Telefon'] || ''); // Null check added here
    setEditEmail(customer?.['E-posta'] || ''); // Null check added here
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomer = async () => {
    if (!editName.trim()) {
      setError('Müşteri adı gereklidir.');
      setAlertOpen(true);
      return;
    }
    const db = getFirestore();
    try {
      const customerRef = doc(db, 'müşteri listesi', selectedCustomer.id);
      await updateDoc(customerRef, {
        'Müşteri Adı': editName,
        Telefon: editPhone,
        'E-posta': editEmail,
      });

      if (selectedCustomerList === 'approved') {
        setApprovedCustomers((prevCustomers) =>
          prevCustomers.map((cust) =>
            cust.id === selectedCustomer.id
              ? {
                  ...cust,
                  'Müşteri Adı': editName,
                  Telefon: editPhone,
                  'E-posta': editEmail,
                }
              : cust
          )
        );
      } else if (selectedCustomerList === 'pending') {
        setPendingCustomers((prevCustomers) =>
          prevCustomers.map((cust) =>
            cust.id === selectedCustomer.id
              ? {
                  ...cust,
                  'Müşteri Adı': editName,
                  Telefon: editPhone,
                  'E-posta': editEmail,
                }
              : cust
          )
        );
      }

      setSuccessMessage('Müşteri başarıyla güncellendi.');
      setAlertOpen(true);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Müşteri güncellenirken bir hata oluştu:', error);
      setError('Müşteri güncellenirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  const handleApproveCustomer = async (customer) => {
    const db = getFirestore();
    try {
      const customerRef = doc(db, 'müşteri listesi', customer.id);
      await updateDoc(customerRef, {
        Onay: 'Onaylandı',
      });

      setPendingCustomers((prev) => prev.filter((cust) => cust.id !== customer.id));
      setApprovedCustomers((prev) => [
        ...prev,
        { ...customer, Onay: 'Onaylandı' },
      ]);

      setSuccessMessage('Müşteri başarıyla onaylandı.');
      setAlertOpen(true);
    } catch (error) {
      console.error('Müşteri onaylanırken bir hata oluştu:', error);
      setError('Müşteri onaylanırken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  const handleCloseAlert = () => {
    setAlertOpen(false);
    setError(null);
    setSuccessMessage('');
  };

  if (loading) {
    return (
      <Container sx={{ paddingTop: 4 }}>
        <Typography variant="h6">Yükleniyor...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ paddingTop: 4 }}>
      <Typography variant="h5" gutterBottom>
        Onay Bekleyen Müşteri Listesi
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label="pending customers">
          <TableHead>
            <TableRow>
              <TableCell>Müşteri Adı</TableCell>
              <TableCell>Telefon</TableCell>
              <TableCell>E-posta</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer?.['Müşteri Adı'] || '-'}</TableCell> {/* Null check */}
                <TableCell>{customer?.['Telefon'] || '-'}</TableCell> {/* Null check */}
                <TableCell>{customer?.['E-posta'] || '-'}</TableCell> {/* Null check */}
                <TableCell align="center">
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleApproveCustomer(customer)}
                    sx={{ marginRight: 1 }}
                  >
                    Onayla
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => openEditModal(customer, 'pending')}
                    sx={{ marginRight: 1 }}
                  >
                    Düzenle
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => openDeleteModal(customer, 'pending')}
                  >
                    Sil
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {pendingCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Onay bekleyen müşteri bulunmamaktadır.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h5" gutterBottom sx={{ marginTop: 4 }}>
        Müşteri Listesi
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setIsAddModalOpen(true)}
        sx={{ marginBottom: 2 }}
      >
        Yeni Müşteri Ekle
      </Button>
      <TableContainer component={Paper}>
        <Table aria-label="approved customers">
          <TableHead>
            <TableRow>
              <TableCell>Müşteri Adı</TableCell>
              <TableCell>Telefon</TableCell>
              <TableCell>E-posta</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
  {approvedCustomers.map((customer) => (
    <TableRow key={customer.id}>
      <TableCell>{customer?.['Müşteri Adı'] || '-'}</TableCell> {/* Null check */}
      <TableCell>{customer?.['Telefon'] || '-'}</TableCell> {/* Null check */}
      <TableCell>{customer?.['E-posta'] || '-'}</TableCell> {/* Null check */}
      <TableCell align="center">
        <Button
          variant="contained"
          color="primary"
          onClick={() => openEditModal(customer, 'approved')}
        >
          Düzenle
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => openDeleteModal(customer, 'approved')}
        >
          Sil
        </Button>
      </TableCell>
    </TableRow>
  ))}
  {approvedCustomers.length === 0 && (
    <TableRow>
      <TableCell colSpan={4} align="center">
        Müşteri bulunmamaktadır.
      </TableCell>
    </TableRow>
  )}
</TableBody>
        </Table>
      </TableContainer>

      {/* Düzenleme Modal'ı */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Müşteri Bilgilerini Düzenle
          </Typography>
          <TextField
            label="Müşteri Adı"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Telefon"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="E-posta"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, marginTop: 2 }}>
            <Button variant="contained" color="primary" onClick={handleUpdateCustomer}>
              Kaydet
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              İptal
            </Button>
          </Box>
        </ModalBox>
      </Modal>

      {/* Silme Doğrulama Modal'ı */}
      <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Müşteriyi Sil
          </Typography>
          <Typography gutterBottom>
            Bu müşteriyi silmek istediğinizden emin misiniz?
          </Typography>
          <Typography>
            <strong>Müşteri Adı:</strong> {customerToDelete?.['Müşteri Adı']}
          </Typography>
          <Typography>
            <strong>Telefon:</strong> {customerToDelete?.['Telefon']}
          </Typography>
          <Typography>
            <strong>E-posta:</strong> {customerToDelete?.['E-posta']}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, marginTop: 2 }}>
            <Button variant="contained" color="error" onClick={handleDeleteCustomer}>
              Sil
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              İptal
            </Button>
          </Box>
        </ModalBox>
      </Modal>

      {/* Yeni Müşteri Ekle Modal'ı */}
      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Yeni Müşteri Ekle
          </Typography>
          <TextField
            label="Müşteri Adı"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Telefon"
            value={newCustomerPhone}
            onChange={(e) => setNewCustomerPhone(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="E-posta"
            value={newCustomerEmail}
            onChange={(e) => setNewCustomerEmail(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, marginTop: 2 }}>
            <Button variant="contained" color="primary" onClick={handleAddNewCustomer}>
              Kaydet
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              İptal
            </Button>
          </Box>
        </ModalBox>
      </Modal>

      {/* Başarı ve Hata Mesajları */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={3000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {successMessage ? (
          <Alert onClose={handleCloseAlert} severity="success" variant="filled">
            {successMessage}
          </Alert>
        ) : error ? (
          <Alert onClose={handleCloseAlert} severity="error" variant="filled">
            {error}
          </Alert>
        ) : null}
      </Snackbar>
    </Container>
  );
};

export default MusteriListesi;
