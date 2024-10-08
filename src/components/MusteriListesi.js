import React, { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  onSnapshot,
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
  Grid,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

// Styled Components
const ModalBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  backgroundColor: '#ffffff',
  color: '#000000',
  boxShadow: theme.shadows[5],
  padding: theme.spacing(2, 4, 3),
  maxHeight: '80vh',
  overflowY: 'auto',
  border: '1px solid #ccc',
}));

const CompanyListBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  backgroundColor: '#ffffff',
  color: '#000000',
  boxShadow: theme.shadows[5],
  padding: theme.spacing(2, 4, 3),
  maxHeight: '80vh',
  overflowY: 'auto',
  border: '1px solid #ccc',
}));

const ConfirmUpdateBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  backgroundColor: '#ffffff',
  color: '#000000',
  boxShadow: theme.shadows[5],
  padding: theme.spacing(3, 4, 4),
  maxHeight: '80vh',
  overflowY: 'auto',
  border: '1px solid #ccc',
}));

const ConflictResolutionBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 700,
  backgroundColor: '#ffffff',
  color: '#000000',
  boxShadow: theme.shadows[5],
  padding: theme.spacing(3, 4, 4),
  maxHeight: '80vh',
  overflowY: 'auto',
  border: '1px solid #ccc',
}));

const TableContainerStyled = styled(TableContainer)(({ theme }) => ({
  '& .MuiTableCell-root': {
    borderBottom: '1px solid #ccc',
    borderRight: '1px solid #ccc',
  },
  '& .MuiTableCell-root:last-child': {
    borderRight: 'none',
  },
}));

const MusteriListesi = () => {
  // State Variables
  const [approvedCustomers, setApprovedCustomers] = useState([]);
  const [pendingCustomers, setPendingCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);
  const [updateChanges, setUpdateChanges] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);

  // Duplicate Handling
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Edit Modal Fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCariCode, setEditCariCode] = useState('');

  // Add Modal Fields
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerCariCode, setNewCustomerCariCode] = useState('');

  // Company List Modal and Search
  const [isCompanyListModalOpen, setIsCompanyListModalOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchCariCode, setSearchCariCode] = useState('');

  // Conflict Resolution Modal State
  const [conflictingCompanies, setConflictingCompanies] = useState([]);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  // Firestore Real-time Listener
  useEffect(() => {
    const db = getFirestore();
    const unsubscribe = onSnapshot(
      collection(db, 'müşteri listesi'),
      (snapshot) => {
        const customerData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          'Müşteri Adı': doc.data()['Müşteri Adı'] || '',
          'cariCode': doc.data()['cariCode'] || '',
        }));

        const pending = customerData.filter(
          (customer) => customer['Onay'] === 'Onay Bekliyor'
        );
        const approved = customerData.filter(
          (customer) => customer['Onay'] !== 'Onay Bekliyor'
        );

        setPendingCustomers(pending);
        setApprovedCustomers(approved);
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

  // Add New Customer
  const handleAddNewCustomer = async () => {
    if (!(newCustomerName?.trim()) || !(newCustomerCariCode?.trim())) {
      setError('Müşteri adı ve cari kodu gereklidir.');
      setAlertOpen(true);
      return;
    }

    const db = getFirestore();
    try {
      // Check for duplicates before adding
      const customerListRef = collection(db, 'müşteri listesi');
      const duplicateQuery = query(
        customerListRef,
        where('Müşteri Adı', '==', newCustomerName.trim()),
        where('cariCode', '==', newCustomerCariCode.trim())
      );

      const duplicateSnapshot = await getDocs(duplicateQuery);

      if (!duplicateSnapshot.empty) {
        setError('Bu müşteri adı ve cari kod kombinasyonu zaten mevcut.');
        setAlertOpen(true);
        return;
      }

      await addDoc(collection(db, 'müşteri listesi'), {
        'Müşteri Adı': newCustomerName.trim(),
        Telefon: (newCustomerPhone || '').trim(),
        'E-posta': (newCustomerEmail || '').trim(),
        Onay: 'Onay Bekliyor',
        cariCode: newCustomerCariCode.trim(),
      });

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

  // Update Customer with Conflict and Duplicate Checks
  const handleUpdateCustomer = async () => {
    if (!(editName?.trim()) || !(editCariCode?.trim())) {
      setError('Müşteri adı ve cari kodu gereklidir.');
      setAlertOpen(true);
      return;
    }

    const db = getFirestore();

    // If Cari Kodu is being updated, check for conflicts
    if (editCariCode.trim() !== (selectedCustomer.cariCode || '').trim()) {
      const customerListRef = collection(db, 'müşteri listesi');
      const cariCodeQuery = query(
        customerListRef,
        where('cariCode', '==', editCariCode.trim()),
        where('__name__', '!=', selectedCustomer.id)
      );

      try {
        const querySnapshot = await getDocs(cariCodeQuery);
        if (!querySnapshot.empty) {
          // Conflicts found
          const conflicts = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            'Müşteri Adı': doc.data()['Müşteri Adı'] || '',
            'cariCode': doc.data()['cariCode'] || '',
          }));
          setConflictingCompanies(conflicts);
          setIsConflictModalOpen(true);
          return;
        }
      } catch (error) {
        console.error('Cari Kodu kontrolü sırasında hata:', error);
        setError('Cari Kodu kontrolü sırasında bir hata oluştu.');
        setAlertOpen(true);
        return;
      }
    }

    // No conflicts, proceed with update
    proceedWithUpdate();
  };

  // Proceed with Update after Conflict Resolution or if No Conflict
  const proceedWithUpdate = () => {
    // Determine Changes
    const changes = [];
    if ((editName || '').trim() !== (selectedCustomer['Müşteri Adı'] || '').trim()) {
      changes.push({
        field: 'Müşteri Adı',
        old: selectedCustomer['Müşteri Adı'] || '',
        new: (editName || '').trim(),
      });
    }
    if ((editPhone || '').trim() !== (selectedCustomer['Telefon'] || '').trim()) {
      changes.push({
        field: 'Telefon',
        old: selectedCustomer['Telefon'] || '',
        new: (editPhone || '').trim(),
      });
    }
    if ((editEmail || '').trim() !== (selectedCustomer['E-posta'] || '').trim()) {
      changes.push({
        field: 'E-posta',
        old: selectedCustomer['E-posta'] || '',
        new: (editEmail || '').trim(),
      });
    }
    if ((editCariCode || '').trim() !== (selectedCustomer.cariCode || '').trim()) {
      changes.push({
        field: 'Cari Kodu',
        old: selectedCustomer.cariCode || '',
        new: (editCariCode || '').trim(),
      });
    }

    // Set Changes and Open Confirm Update Modal
    setUpdateChanges(changes);
    setIsConfirmUpdateOpen(true);
  };

  // Confirm Update
  const confirmUpdate = async () => {
    setIsConfirmUpdateOpen(false); // Close Confirm Modal

    const db = getFirestore();
    try {
      const oldCustomerName = (selectedCustomer['Müşteri Adı'] || '').trim();
      const oldCariCode = (selectedCustomer.cariCode || '').trim();

      // Update Customer Document
      const customerRef = doc(db, 'müşteri listesi', selectedCustomer.id);
      await updateDoc(customerRef, {
        'Müşteri Adı': editName.trim(),
        Telefon: editPhone.trim(),
        'E-posta': editEmail.trim(),
        cariCode: editCariCode.trim(),
        Onay: 'Onaylandı', // Update Approval Status
      });

      // Update Related Puantajlar
      const puantajlarRef = collection(db, 'puantajlar');
      const q = query(
        puantajlarRef,
        where('Müşteri Adı', '==', oldCustomerName)
      );
      const puantajlarSnapshot = await getDocs(q);

      const batch = writeBatch(db);
      puantajlarSnapshot.forEach((puantajDoc) => {
        batch.update(puantajDoc.ref, {
          'Müşteri Adı': editName.trim(),
          'Cari Kodu': editCariCode.trim(),
        });
      });

      // Now, check for duplicates: other customers with same name and cari code
      const customerListRef = collection(db, 'müşteri listesi');
      const duplicateQuery = query(
        customerListRef,
        where('Müşteri Adı', '==', editName.trim()),
        where('cariCode', '==', editCariCode.trim()),
        where('__name__', '!=', selectedCustomer.id)
      );

      const duplicateSnapshot = await getDocs(duplicateQuery);

      if (!duplicateSnapshot.empty) {
        duplicateSnapshot.forEach((duplicateDoc) => {
          batch.delete(duplicateDoc.ref);
        });
        setDuplicateCount(duplicateSnapshot.size);
        console.log(`Duplicate customers found and deleted: ${duplicateSnapshot.size}`);
      }

      await batch.commit();

      if (duplicateCount > 0) {
        setSuccessMessage(`Müşteri başarıyla güncellendi. ${duplicateCount} adet kopya silindi.`);
      } else {
        setSuccessMessage('Müşteri başarıyla güncellendi.');
      }
      setAlertOpen(true);
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
      setUpdateChanges([]);
      setDuplicateCount(0); // Reset duplicate count
    } catch (error) {
      console.error('Müşteri güncellenirken bir hata oluştu:', error);
      setError('Müşteri güncellenirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  // Cancel Update
  const cancelUpdate = () => {
    setIsConfirmUpdateOpen(false);
    setUpdateChanges([]);
  };

  // Delete Customer
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    const db = getFirestore();
    try {
      await deleteDoc(doc(db, 'müşteri listesi', selectedCustomer.id));

      // Update Puantajlar Related to the Deleted Customer
      const puantajlarRef = collection(db, 'puantajlar');
      const q = query(
        puantajlarRef,
        where('Cari Kodu', '==', selectedCustomer.cariCode || '')
      );
      const puantajlarSnapshot = await getDocs(q);

      const batch = writeBatch(db);
      puantajlarSnapshot.forEach((puantajDoc) => {
        batch.update(puantajDoc.ref, {
          'Müşteri Adı': 'Silinmiş Müşteri',
          'Cari Kodu': '',
        });
      });
      await batch.commit();

      setSuccessMessage('Müşteri başarıyla silindi.');
      setAlertOpen(true);
      setIsDeleteModalOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Müşteri silinirken bir hata oluştu:', error);
      setError('Müşteri silinirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  // Open Edit Modal
  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setEditName(customer['Müşteri Adı'] || '');
    setEditPhone(customer['Telefon'] || '');
    setEditEmail(customer['E-posta'] || '');
    setEditCariCode(customer['cariCode'] || '');
    setIsEditModalOpen(true);
  };

  // Company Selection from Company List Modal
  const handleCompanySelect = (company) => {
    setEditName(company['Müşteri Adı'] || '');
    setEditCariCode(company['cariCode'] || '');
    setIsCompanyListModalOpen(false);
  };

  // Alert Close Handler
  const handleCloseAlert = () => {
    setAlertOpen(false);
    setError(null);
    setSuccessMessage('');
  };

  // Filtered Companies for Company List Modal
  const filteredCompanies = approvedCustomers.filter(
    (company) =>
      (company['Müşteri Adı'] || '')
        .toLowerCase()
        .includes(searchName.toLowerCase()) &&
      (company['cariCode'] || '')
        .toLowerCase()
        .includes(searchCariCode.toLowerCase())
  );

  // Handle Conflict Resolution Changes
  const handleConflictChange = (id, newCariCode) => {
    setConflictingCompanies((prev) =>
      prev.map((company) =>
        company.id === id ? { ...company, cariCode: newCariCode } : company
      )
    );
  };

  // Save Conflict Resolutions
  const saveConflictResolutions = async () => {
    const db = getFirestore();
    const batch = writeBatch(db);

    try {
      conflictingCompanies.forEach((company) => {
        const companyRef = doc(db, 'müşteri listesi', company.id);
        batch.update(companyRef, {
          cariCode: (company.cariCode || '').trim(),
        });
      });

      await batch.commit();

      setSuccessMessage('Çakışan Cari Kodları başarıyla güncellendi.');
      setAlertOpen(true);
      setIsConflictModalOpen(false);
      setConflictingCompanies([]);

      // Proceed with updating the original customer
      proceedWithUpdate();
    } catch (error) {
      console.error('Çakışan Cari Kodları güncellenirken hata oluştu:', error);
      setError('Çakışan Cari Kodları güncellenirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  // Cancel Conflict Resolution
  const cancelConflictResolution = () => {
    setIsConflictModalOpen(false);
    setConflictingCompanies([]);
  };

  // Loading State
  if (loading) {
    return (
      <Container>
        <Typography>Yükleniyor...</Typography>
      </Container>
    );
  }

  // Error State
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
        Müşteri Listesi
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={() => setIsAddModalOpen(true)}
      >
        Yeni Müşteri Ekle
      </Button>

      {/* Pending Customers */}
      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
        Onay Bekleyen Müşteriler
      </Typography>
      <TableContainerStyled component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '20%' }}>Müşteri Adı</TableCell>
              <TableCell style={{ width: '20%' }}>Telefon</TableCell>
              <TableCell style={{ width: '20%' }}>E-posta</TableCell>
              <TableCell style={{ width: '20%' }}>Cari Kodu</TableCell>
              <TableCell style={{ width: '20%' }}>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer['Müşteri Adı']}</TableCell>
                <TableCell>{customer['Telefon']}</TableCell>
                <TableCell>{customer['E-posta']}</TableCell>
                <TableCell>{customer['cariCode']}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => openEditModal(customer)}
                  >
                    Düzenle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainerStyled>

      {/* Approved Customers */}
      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
        Onaylanmış Müşteriler
      </Typography>
      <TableContainerStyled component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '20%' }}>Müşteri Adı</TableCell>
              <TableCell style={{ width: '20%' }}>Telefon</TableCell>
              <TableCell style={{ width: '20%' }}>E-posta</TableCell>
              <TableCell style={{ width: '20%' }}>Cari Kodu</TableCell>
              <TableCell style={{ width: '20%' }}>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {approvedCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer['Müşteri Adı']}</TableCell>
                <TableCell>{customer['Telefon']}</TableCell>
                <TableCell>{customer['E-posta']}</TableCell>
                <TableCell>{customer['cariCode']}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => openEditModal(customer)}
                  >
                    Düzenle
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setIsDeleteModalOpen(true);
                    }}
                    style={{ marginLeft: '10px' }}
                  >
                    Sil
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainerStyled>

      {/* Edit Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      >
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Müşteri Düzenle
          </Typography>
          <Box display="flex" alignItems="center" mb={2}>
            <TextField
              label="Müşteri Adı"
              fullWidth
              margin="normal"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{ flex: 0.9 }}
            />
            <Button
              onClick={() => setIsCompanyListModalOpen(true)}
              style={{ flex: 0.1, marginLeft: '10px' }}
              variant="contained"
              color="default"
            >
              <ArrowDropDownIcon />
            </Button>
          </Box>
          <TextField
            label="Telefon"
            fullWidth
            margin="normal"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />
          <TextField
            label="E-posta"
            fullWidth
            margin="normal"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
          />
          <TextField
            label="Cari Kodu"
            fullWidth
            margin="normal"
            value={editCariCode}
            onChange={(e) => setEditCariCode(e.target.value)}
          />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateCustomer}
            >
              Güncelle
            </Button>
          </Box>
        </ModalBox>
      </Modal>

      {/* Add Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      >
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Yeni Müşteri Ekle
          </Typography>
          <TextField
            label="Müşteri Adı"
            fullWidth
            margin="normal"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
          />
          <TextField
            label="Telefon"
            fullWidth
            margin="normal"
            value={newCustomerPhone}
            onChange={(e) => setNewCustomerPhone(e.target.value)}
          />
          <TextField
            label="E-posta"
            fullWidth
            margin="normal"
            value={newCustomerEmail}
            onChange={(e) => setNewCustomerEmail(e.target.value)}
          />
          <TextField
            label="Cari Kodu"
            fullWidth
            margin="normal"
            value={newCustomerCariCode}
            onChange={(e) => setNewCustomerCariCode(e.target.value)}
          />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddNewCustomer}
            >
              Ekle
            </Button>
          </Box>
        </ModalBox>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Müşteriyi Sil
          </Typography>
          {selectedCustomer && (
            <Box mb={2}>
              <Typography>
                <strong>Müşteri Adı:</strong> {selectedCustomer['Müşteri Adı']}
              </Typography>
              <Typography>
                <strong>Telefon:</strong> {selectedCustomer['Telefon']}
              </Typography>
              <Typography>
                <strong>E-posta:</strong> {selectedCustomer['E-posta']}
              </Typography>
              <Typography>
                <strong>Cari Kodu:</strong> {selectedCustomer['cariCode']}
              </Typography>
            </Box>
          )}
          <Typography color="error" mb={2}>
            Bu müşteriyi silerseniz, ilgili puantaj verileri de kaybolacaktır. Devam etmek istediğinize emin misiniz?
          </Typography>
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="secondary"
              onClick={handleDeleteCustomer}
              style={{ marginRight: '10px' }}
            >
              Sil
            </Button>
            <Button
              variant="contained"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              İptal
            </Button>
          </Box>
        </ModalBox>
      </Modal>

      {/* Company List Modal */}
      <Modal
        open={isCompanyListModalOpen}
        onClose={() => setIsCompanyListModalOpen(false)}
      >
        <CompanyListBox>
          <Typography variant="h6" gutterBottom>
            Firma Listesi
          </Typography>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={6}>
              <TextField
                label="Cari Kodu Ara"
                fullWidth
                margin="normal"
                value={searchCariCode}
                onChange={(e) => setSearchCariCode(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Firma Adı Ara"
                fullWidth
                margin="normal"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </Grid>
          </Grid>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: '50%' }}>Cari Kodu</TableCell>
                  <TableCell style={{ width: '50%' }}>Firma Adı</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map((company) => (
                    <TableRow
                      key={company.id}
                      hover
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleCompanySelect(company)}
                    >
                      <TableCell>{company['cariCode']}</TableCell>
                      <TableCell>{company['Müşteri Adı']}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      Sonuç bulunamadı.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={() => setIsCompanyListModalOpen(false)}
            >
              Kapat
            </Button>
          </Box>
        </CompanyListBox>
      </Modal>

      {/* Confirm Update Modal */}
      <Modal
        open={isConfirmUpdateOpen}
        onClose={cancelUpdate}
      >
        <ConfirmUpdateBox>
          <Typography variant="h6" gutterBottom>
            Değişiklikleri Onayla
          </Typography>
          <Typography>
            Yapılan değişiklikler aşağıda özetlenmiştir. Değişikliklerden emin misiniz?
          </Typography>
          <Box mt={2}>
            {updateChanges.map((change, index) => (
              <Typography key={index}>
                <strong>{change.field}:</strong> "{change.old}" yerine "{change.new}" olarak değiştirildi.
              </Typography>
            ))}
          </Box>
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={cancelUpdate}
            >
              Hayır
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={confirmUpdate}
              style={{ marginLeft: '10px' }}
            >
              Evet
            </Button>
          </Box>
        </ConfirmUpdateBox>
      </Modal>

      {/* Conflict Resolution Modal */}
      <Modal
        open={isConflictModalOpen}
        onClose={cancelConflictResolution}
      >
        <ConflictResolutionBox>
          <Typography variant="h6" gutterBottom>
            Cari Kodu Çakışması
          </Typography>
          <Typography gutterBottom>
            Yeni Cari Kodu "{editCariCode.trim()}" başka bir firma ile çakışıyor. Lütfen aşağıdaki firmaların Cari Kodlarını değiştirin.
          </Typography>
          <TableContainer component={Paper} style={{ marginTop: '20px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: '40%' }}>Cari Kodu</TableCell>
                  <TableCell style={{ width: '60%' }}>Firma Adı</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {conflictingCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <TextField
                        label="Yeni Cari Kodu"
                        value={company.cariCode}
                        onChange={(e) => handleConflictChange(company.id, e.target.value)}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>{company['Müşteri Adı']}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={cancelConflictResolution}
            >
              İptal
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={saveConflictResolutions}
              style={{ marginLeft: '10px' }}
            >
              Kaydet ve Güncelle
            </Button>
          </Box>
        </ConflictResolutionBox>
      </Modal>

      {/* Snackbar Alert */}
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
