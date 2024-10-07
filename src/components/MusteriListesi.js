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
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

const ModalBox = styled(Box)(({ theme }) => ({
  position: 'relative', // Kapatma ikonunu konumlandırmak için relative yaptık
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 500,
  maxHeight: '80vh', // Yüksekliği sınırladık
  backgroundColor: theme.palette.background.paper,
  borderRadius: 8,
  boxShadow: theme.shadows[5],
  padding: theme.spacing(2),
  overflowY: 'auto', // Dikey kaydırma ekledik
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
  const [isCustomerSelectModalOpen, setIsCustomerSelectModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);

  // Yeni eklenen state değişkenleri
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState(null);

  // İki yeni arama sorgusu için state
  const [customerNameSearchQuery, setCustomerNameSearchQuery] = useState('');
  const [cariCodeSearchQuery, setCariCodeSearchQuery] = useState('');

  // Edit form state'leri
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCariCode, setEditCariCode] = useState(''); // Cari Kodu için state

  // Yeni müşteri ekleme form state'leri
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerCariCode, setNewCustomerCariCode] = useState(''); // Yeni müşteri için cari kod

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

  // Yeni müşteri ekleme fonksiyonu
  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim()) {
      setError('Müşteri adı gereklidir.');
      setAlertOpen(true);
      return;
    }

    // Aynı isimli müşteri kontrolü
    const allCustomers = [...approvedCustomers, ...pendingCustomers];
    const duplicateCustomer = allCustomers.find(
      (customer) => customer['Müşteri Adı'] === newCustomerName.trim()
    );

    if (duplicateCustomer) {
      // Aynı isimli müşteri bulundu, uyarı göster
      setExistingCustomer(duplicateCustomer);
      setIsDuplicateModalOpen(true);
      return;
    }

    const db = getFirestore();
    try {
      const newCustomerRef = await addDoc(collection(db, 'müşteri listesi'), {
        'Müşteri Adı': newCustomerName,
        Telefon: newCustomerPhone,
        'E-posta': newCustomerEmail,
        Onay: 'Onay Bekliyor',
        cariCode: newCustomerCariCode.trim(), // Yeni müşteri için cari kod
      });

      const newCustomer = {
        id: newCustomerRef.id,
        'Müşteri Adı': newCustomerName,
        Telefon: newCustomerPhone,
        'E-posta': newCustomerEmail,
        Onay: 'Onay Bekliyor',
        cariCode: newCustomerCariCode.trim(),
      };
      setPendingCustomers((prevCustomers) => [...prevCustomers, newCustomer]);

      setSuccessMessage('Yeni müşteri başarıyla eklendi.');
      setAlertOpen(true);
      setIsAddModalOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      setNewCustomerCariCode('');
    } catch (error) {
      console.error('Yeni müşteri eklenirken bir hata oluştu:', error);
      setError('Yeni müşteri eklenirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  // Mevcut müşteriyi güncelleme fonksiyonu
  const handleConfirmUpdateExistingCustomer = async () => {
    const db = getFirestore();
    try {
      const customerRef = doc(db, 'müşteri listesi', existingCustomer.id);

      const updatedCustomer = {
        Telefon: newCustomerPhone || existingCustomer.Telefon,
        'E-posta': newCustomerEmail || existingCustomer['E-posta'],
        cariCode: newCustomerCariCode || existingCustomer.cariCode,
      };

      await updateDoc(customerRef, updatedCustomer);

      // State güncelleme
      if (existingCustomer.Onay === 'Onay Bekliyor') {
        setPendingCustomers((prevCustomers) =>
          prevCustomers.map((cust) =>
            cust.id === existingCustomer.id ? { ...cust, ...updatedCustomer } : cust
          )
        );
      } else {
        setApprovedCustomers((prevCustomers) =>
          prevCustomers.map((cust) =>
            cust.id === existingCustomer.id ? { ...cust, ...updatedCustomer } : cust
          )
        );
      }

      setSuccessMessage('Mevcut müşteri başarıyla güncellendi.');
      setAlertOpen(true);
      setIsDuplicateModalOpen(false);
      setIsAddModalOpen(false);
      setExistingCustomer(null);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      setNewCustomerCariCode('');
    } catch (error) {
      console.error('Müşteri güncellenirken bir hata oluştu:', error);
      setError('Müşteri güncellenirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  // Mevcut müşteriyi güncelleme işlemini iptal etme fonksiyonu
  const handleCancelUpdateExistingCustomer = () => {
    setIsDuplicateModalOpen(false);
    setExistingCustomer(null);
  };

  // Müşteri silme fonksiyonu
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
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
      setCustomerToDelete(null);
    } catch (error) {
      console.error('Müşteri silinirken bir hata oluştu:', error);
      setError('Müşteri silinirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  // Silme modalını açma fonksiyonu
  const openDeleteModal = (customer, listType) => {
    setCustomerToDelete(customer);
    setSelectedCustomerList(listType);
    setIsDeleteModalOpen(true);
  };

  // Edit modalını açma fonksiyonu
  const openEditModal = (customer, listType) => {
    setSelectedCustomer(customer);
    setSelectedCustomerList(listType);
    setEditName(customer?.['Müşteri Adı'] || '');
    setEditPhone(customer?.['Telefon'] || '');
    setEditEmail(customer?.['E-posta'] || '');
    setEditCariCode(customer?.cariCode || ''); // Cari Kodu state'ini ayarla
    setIsEditModalOpen(true);
  };

  // Müşteri güncelleme ve onaylama fonksiyonu
  const handleUpdateCustomer = async () => {
    if (!editName.trim()) {
      setError('Müşteri adı gereklidir.');
      setAlertOpen(true);
      return;
    }
    const db = getFirestore();
    try {
      const customerRef = doc(db, 'müşteri listesi', selectedCustomer.id);

      // Eğer müşteri "pending" listesindeyse, Onay durumunu güncelle
      let updatedCustomer = {
        'Müşteri Adı': editName,
        Telefon: editPhone,
        'E-posta': editEmail,
        cariCode: editCariCode.trim(),
      };

      if (selectedCustomerList === 'pending') {
        updatedCustomer.Onay = 'Onaylandı';
      }

      await updateDoc(customerRef, updatedCustomer);

      if (selectedCustomerList === 'approved') {
        setApprovedCustomers((prevCustomers) =>
          prevCustomers.map((cust) =>
            cust.id === selectedCustomer.id ? { ...cust, ...updatedCustomer } : cust
          )
        );
      } else if (selectedCustomerList === 'pending') {
        // Müşteriyi pending listesinden çıkar
        setPendingCustomers((prevCustomers) =>
          prevCustomers.filter((cust) => cust.id !== selectedCustomer.id)
        );
        // Müşteriyi approved listesine ekle
        setApprovedCustomers((prevCustomers) => [
          ...prevCustomers,
          { id: selectedCustomer.id, ...updatedCustomer },
        ]);
      }

      setSuccessMessage('Müşteri başarıyla güncellendi ve onaylandı.');
      setAlertOpen(true);
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Müşteri güncellenirken bir hata oluştu:', error);
      setError('Müşteri güncellenirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  // Mevcut müşteri seçimi fonksiyonu
  const handleSelectExistingCustomer = (customer) => {
    setEditName(customer?.['Müşteri Adı'] || '');
    setEditPhone(customer?.['Telefon'] || '');
    setEditEmail(customer?.['E-posta'] || '');
    setEditCariCode(customer?.cariCode || '');
    setIsCustomerSelectModalOpen(false);
  };

  // Arama sorgusu değiştiğinde çalışan fonksiyonlar
  const handleCustomerNameSearchChange = (e) => {
    setCustomerNameSearchQuery(e.target.value);
  };

  const handleCariCodeSearchChange = (e) => {
    setCariCodeSearchQuery(e.target.value);
  };

  // Arama sorgularına göre filtrelenmiş onaylanmış müşteriler
  const filteredApprovedCustomers = approvedCustomers.filter((customer) => {
    const nameLower = (customer['Müşteri Adı'] || '').toLowerCase();
    const codeLower = (customer.cariCode || '').toLowerCase();
    const nameQueryLower = customerNameSearchQuery.toLowerCase();
    const codeQueryLower = cariCodeSearchQuery.toLowerCase();

    const nameMatches = nameLower.includes(nameQueryLower);
    const codeMatches = codeLower.includes(codeQueryLower);

    // Her iki arama alanı da boşsa tüm müşterileri göster
    if (!nameQueryLower && !codeQueryLower) {
      return true;
    }

    // Sadece müşteri adı araması yapılmışsa
    if (nameQueryLower && !codeQueryLower) {
      return nameMatches;
    }

    // Sadece cari kodu araması yapılmışsa
    if (!nameQueryLower && codeQueryLower) {
      return codeMatches;
    }

    // Her iki arama alanı da doluysa, her ikisi de eşleşmeli
    return nameMatches && codeMatches;
  });

  // Alert kapatma fonksiyonu
  const handleCloseAlert = () => {
    setAlertOpen(false);
    setError(null);
    setSuccessMessage('');
  };

  // Yükleme durumu için dönen JSX
  if (loading) {
    return (
      <Container sx={{ paddingTop: 4 }}>
        <Typography variant="h6">Yükleniyor...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ paddingTop: 4 }}>
      {/* Onay Bekleyen Firma Listesi */}
      <Typography variant="h5" gutterBottom>
        Onay Bekleyen Firma Listesi
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label="pending customers">
          <TableHead>
            <TableRow>
              <TableCell>Firma Adı</TableCell>
              <TableCell>Telefon</TableCell>
              <TableCell>E-posta</TableCell>
              <TableCell>Cari Kodu</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer?.['Müşteri Adı'] || '-'}</TableCell>
                <TableCell>{customer?.['Telefon'] || '-'}</TableCell>
                <TableCell>{customer?.['E-posta'] || '-'}</TableCell>
                <TableCell>{customer?.cariCode || '-'}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => openEditModal(customer, 'pending')}
                  >
                    Cari Tanımla
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {pendingCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Onay bekleyen Firma bulunmamaktadır.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Onaylanmış Firma Listesi */}
      <Typography variant="h5" gutterBottom sx={{ marginTop: 4 }}>
        Firma Listesi
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setIsAddModalOpen(true)}
        sx={{ marginBottom: 2 }}
      >
        Yeni Firma Ekle
      </Button>
      <TableContainer component={Paper}>
        <Table aria-label="approved customers">
          <TableHead>
            <TableRow>
              <TableCell>Firma Adı</TableCell>
              <TableCell>Telefon</TableCell>
              <TableCell>E-posta</TableCell>
              <TableCell>Cari Kodu</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {approvedCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer?.['Müşteri Adı'] || '-'}</TableCell>
                <TableCell>{customer?.['Telefon'] || '-'}</TableCell>
                <TableCell>{customer?.['E-posta'] || '-'}</TableCell>
                <TableCell>{customer?.cariCode || '-'}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => openEditModal(customer, 'approved')}
                    sx={{ marginRight: 1 }}
                  >
                    Cari Tanımla
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
                <TableCell colSpan={5} align="center">
                  Firma bulunmamaktadır.
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
            Firma Bilgilerini Cari Tanımla
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
            <TextField
              label="Firma Adı"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsCustomerSelectModalOpen(true)}
              sx={{ marginLeft: 1, marginTop: 2 }}
            >
              Seç
            </Button>
          </Box>
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
          <TextField
            label="Cari Kodu"
            value={editCariCode}
            onChange={(e) => setEditCariCode(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, marginTop: 2 }}>
            {/* Butonların yerini değiştirdik */}
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              İptal
            </Button>
            <Button variant="contained" color="primary" onClick={handleUpdateCustomer}>
              Kaydet
            </Button>
            {selectedCustomerList === 'approved' && (
              <Button
                variant="contained"
                color="error"
                onClick={() => openDeleteModal(selectedCustomer, selectedCustomerList)}
              >
                Sil
              </Button>
            )}
          </Box>
        </ModalBox>
      </Modal>

      {/* Firma Seçim Modal'ı */}
      <Modal
        open={isCustomerSelectModalOpen}
        onClose={() => setIsCustomerSelectModalOpen(false)}
      >
        <ModalBox>
          {/* Kapatma ikonu eklendi */}
          <IconButton
            aria-label="close"
            onClick={() => setIsCustomerSelectModalOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" gutterBottom>
            Firma Seç
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
            <TextField
              label="Müşteri Adı Ara"
              value={customerNameSearchQuery}
              onChange={handleCustomerNameSearchChange}
              fullWidth
              placeholder="Müşteri adına göre ara"
            />
            <TextField
              label="Cari Kodu Ara"
              value={cariCodeSearchQuery}
              onChange={handleCariCodeSearchChange}
              fullWidth
              placeholder="Cari koduna göre ara"
            />
          </Box>
          <TableContainer component={Paper}>
            <Table aria-label="customer selection" size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Firma Adı</TableCell>
                  <TableCell>Cari Kodu</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApprovedCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    hover
                    onClick={() => handleSelectExistingCustomer(customer)}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell>{customer?.['Müşteri Adı'] || '-'}</TableCell>
                    <TableCell>{customer?.cariCode || '-'}</TableCell>
                  </TableRow>
                ))}
                {filteredApprovedCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      Aramanıza uygun firma bulunamadı.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {/* "İptal" butonunu sağ tarafa aldık */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setIsCustomerSelectModalOpen(false)}
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
            Firmayı Sil
          </Typography>
          <Typography gutterBottom>
            Bu firmayı silmek istediğinizden emin misiniz?
          </Typography>
          <Typography>
            <strong>Firma Adı:</strong> {customerToDelete?.['Müşteri Adı']}
          </Typography>
          <Typography>
            <strong>Telefon:</strong> {customerToDelete?.['Telefon']}
          </Typography>
          <Typography>
            <strong>E-posta:</strong> {customerToDelete?.['E-posta']}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, marginTop: 2 }}>
            {/* Butonların yerini değiştirdik */}
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              İptal
            </Button>
            <Button variant="contained" color="error" onClick={handleDeleteCustomer}>
              Sil
            </Button>
          </Box>
        </ModalBox>
      </Modal>

      {/* Yeni Müşteri Ekle Modal'ı */}
      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Yeni Firma Ekle
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
          <TextField
            label="Cari Kodu"
            value={newCustomerCariCode}
            onChange={(e) => setNewCustomerCariCode(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, marginTop: 2 }}>
            {/* Butonların yerini değiştirdik */}
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              İptal
            </Button>
            <Button variant="contained" color="primary" onClick={handleAddNewCustomer}>
              Kaydet
            </Button>
          </Box>
        </ModalBox>
      </Modal>

      {/* Duplicate Uyarı Modal'ı */}
      <Modal open={isDuplicateModalOpen} onClose={handleCancelUpdateExistingCustomer}>
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Müşteri Zaten Mevcut
          </Typography>
          <Typography>
            "{newCustomerName}" isimli bir müşteri zaten mevcut. Bu müşterinin bilgilerini
            güncellemek ister misiniz?
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, marginTop: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCancelUpdateExistingCustomer}
            >
              İptal
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirmUpdateExistingCustomer}
            >
              Güncelle
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
