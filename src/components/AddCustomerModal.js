import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Typography,
  TextField,
  Box,
  Button,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { auth } from './firebaseConfig';
import ConflictResolutionModal from './ConflictResolutionModal';
import CustomerSelectionTable from './CustomerSelectionTable';
import { getCustomerListRef } from '../utils/databaseOperations';

const ModalBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  backgroundColor: '#ffffff',
  color: '#000000',
  boxShadow: theme.shadows[5],
  padding: theme.spacing(4),
  maxHeight: '80vh',
  overflowY: 'auto',
  border: '1px solid #ccc',
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  marginLeft: theme.spacing(1),
  width: '30px',
  height: '30px',
}));

const fetchPendingCustomers = async (setError, setAlertOpen) => {
  const userEmail = auth.currentUser?.email;
  const db = getFirestore();
  
  if (!userEmail) {
    setError('Kullanıcı oturumu bulunamadı');
    setAlertOpen(true);
    return [];
  }

  try {
    const customerListRef = collection(db, `users/${auth.currentUser?.email}/customerList`);
    const pendingCustomersQuery = query(
      customerListRef,
      where('Onay', '==', 'Onay Bekliyor'),
    );
    const querySnapshot = await getDocs(pendingCustomersQuery);
    const customers = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return customers;
  } catch (error) {
    console.error('Onay bekleyen müşteriler getirilemedi:', error);
    setError('Onay bekleyen müşteriler getirilemedi.');
    setAlertOpen(true);
  }
};

const AddCustomerModal = ({
  isOpen,
  onClose,
  setAlertOpen,
  setError,
  setSuccessMessage,
}) => {
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerCariCode, setNewCustomerCariCode] = useState('');
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictingCustomer, setConflictingCustomer] = useState(null);
  const [isCustomerSelectionOpen, setIsCustomerSelectionOpen] = useState(false);
  const [pendingCustomers, setPendingCustomers] = useState([]);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [tempCustomerData, setTempCustomerData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [conflictingSantiye, setConflictingSantiye] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const memoizedFetchPendingCustomers = useCallback(fetchPendingCustomers, [setError, setAlertOpen]);

  useEffect(() => {
    memoizedFetchPendingCustomers().then(setPendingCustomers);
  }, [memoizedFetchPendingCustomers]);

  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerCariCode.trim()) {
      setTempCustomerData({
        customerName: newCustomerName,
        phoneNumber: newCustomerPhone,
        email: newCustomerEmail,
      });
      setIsWarningModalOpen(true);
      return;
    }
    await checkConflictsAndAdd();
  };

  const checkConflictsAndAdd = async () => {
    const userEmail = auth.currentUser?.email;
    const db = getFirestore();
    
    if (!userEmail) {
      setError('Kullanıcı oturumu bulunamadı');
      setAlertOpen(true);
      return;
    }

    try {
      const customerListRef = collection(db, `users/${auth.currentUser?.email}/customerList`);
      const nameConflictQuery = query(
        customerListRef,
        where('Müşteri Adı', '==', newCustomerName.trim())
      );
      const cariCodeConflictQuery = query(
        customerListRef,
        where('cariCode', '==', newCustomerCariCode.trim())
      );

      const [nameConflictSnapshot, cariCodeConflictSnapshot] = await Promise.all([
        getDocs(nameConflictQuery),
        getDocs(cariCodeConflictQuery),
      ]);

      if (!nameConflictSnapshot.empty || !cariCodeConflictSnapshot.empty) {
        const conflictingDoc = !nameConflictSnapshot.empty
          ? nameConflictSnapshot.docs[0]
          : cariCodeConflictSnapshot.docs[0];

        if (conflictingDoc && conflictingDoc.data()) {
          setConflictingCustomer({ ...conflictingDoc.data(), id: conflictingDoc.id });
          setIsConflictModalOpen(true);
        } else {
          setError('Çakışan müşteri bilgisi alınamadı. Lütfen tekrar deneyin.');
          setAlertOpen(true);
        }
        return;
      }

      await addCustomerToFirestore();
    } catch (error) {
      console.error('Yeni müşteri eklenirken bir hata oluştu:', error);
      setError(`Yeni müşteri eklenirken bir hata oluştu: ${error.message}`);
      setAlertOpen(true);
    }
  };

  const handleConflictResolution = async () => {
    setIsConflictModalOpen(false);
    const db = getFirestore();

    try {
      if (!conflictingCustomer || !conflictingCustomer.id) {
        throw new Error('Çakışan müşteri bilgisi eksik veya geçersiz.');
      }

      await deleteDoc(doc(db, 'müşteri listesi', conflictingCustomer.id));
      await addCustomerToFirestore();

      setSuccessMessage('Çakışma çözüldü ve yeni müşteri eklendi.');
      setAlertOpen(true);
    } catch (error) {
      console.error('Çakışma çözümlenirken hata oluştu:', error);
      setError(`Çakışma çözümlenirken hata oluştu: ${error.message}`);
      setAlertOpen(true);
    }
  };

  const addCustomerToFirestore = async () => {
    const db = getFirestore();
    try {
      await addDoc(collection(db, 'müşteri listesi'), {
        'Müşteri Adı': newCustomerName.trim(),
        Telefon: (newCustomerPhone || '').trim(),
        'E-posta': (newCustomerEmail || '').trim(),
        Onay: 'Onay Bekliyor',
        cariCode: newCustomerCariCode.trim(),
        Şantiye: '',
        parentId: null,
      });

      setSuccessMessage('Yeni müşteri başarıyla eklendi.');
      setAlertOpen(true);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Yeni müşteri eklenirken bir hata oluştu:', error);
      throw new Error(`Yeni müşteri eklenirken bir hata oluştu: ${error.message}`);
    }
  };

  const resetForm = () => {
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerEmail('');
    setNewCustomerCariCode('');
  };

  const handleSelectCustomer = (customer) => {
    setNewCustomerName(customer['Müşteri Adı']);
    setNewCustomerCariCode(customer.cariCode);
    setNewCustomerPhone(customer.Telefon || '');
    setNewCustomerEmail(customer['E-posta'] || '');
    setIsCustomerSelectionOpen(false);
  };

  const handleWarningModalClose = () => {
    setIsWarningModalOpen(false);
    setTempCustomerData(null);
  };

  const handleCariCodeSubmit = async () => {
    if (!newCustomerName.trim() || !newCustomerCariCode.trim()) {
      setError('Müşteri adı ve cari kodu gereklidir.');
      setAlertOpen(true);
      return;
    }

    setIsWarningModalOpen(false);
    await checkConflictsAndAdd();
  };

  return (
    <>
      <Modal open={isOpen} onClose={onClose}>
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Yeni Müşteri Ekle
          </Typography>
          <Box display="flex" alignItems="center">
            <TextField
              label="Müşteri Adı"
              fullWidth
              margin="normal"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
            />
            <StyledIconButton
              onClick={async () => {
                const newState = !isCustomerSelectionOpen;
                setIsCustomerSelectionOpen(newState);
                if (newState) {
                  await fetchPendingCustomers();
                }
              }}
              size="small"
            >
              <ArrowDropDownIcon fontSize="small" />
            </StyledIconButton>
          </Box>
          {isCustomerSelectionOpen && (
            <CustomerSelectionTable
              customers={pendingCustomers}
              onSelectCustomer={handleSelectCustomer}
            />
          )}
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

      <ConflictResolutionModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        onConfirm={handleConflictResolution}
        conflictingCustomer={conflictingCustomer}
        newCustomerData={{
          'Müşteri Adı': newCustomerName,
          cariCode: newCustomerCariCode,
        }}
      />

      <Modal open={isWarningModalOpen} onClose={handleWarningModalClose}>
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Uyarı: Eksik Bilgi
          </Typography>
          <Typography variant="body1" gutterBottom>
            {!newCustomerName.trim() ? "Müşteri adı " : ""}
            {!newCustomerName.trim() && !newCustomerCariCode.trim() ? "ve " : ""}
            {!newCustomerCariCode.trim() ? "Cari kodu " : ""}
            gereklidir. Lütfen ekleyin.
          </Typography>
          <Box display="flex" alignItems="center" mt={2}>
            <Typography variant="body2" style={{ marginRight: '10px', flexGrow: 1 }}>
              {tempCustomerData?.customerName || "Müşteri Adı"} - {tempCustomerData?.phoneNumber || "Telefon"}
            </Typography>
            {!newCustomerName.trim() && (
              <TextField
                label="Müşteri Adı"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                style={{ width: '150px', marginRight: '10px' }}
              />
            )}
            {!newCustomerCariCode.trim() && (
              <TextField
                label="Cari Kodu"
                value={newCustomerCariCode}
                onChange={(e) => setNewCustomerCariCode(e.target.value)}
                style={{ width: '150px' }}
              />
            )}
          </Box>
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button variant="contained" color="primary" onClick={handleCariCodeSubmit}>
              Kaydet
            </Button>
          </Box>
        </ModalBox>
      </Modal>
    </>
  );
};

export default AddCustomerModal;
