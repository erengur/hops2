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
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import CustomerSelectionTable from './CustomerSelectionTable';
import ConflictResolutionModal from './ConflictResolutionModal';

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

const AddSantiyeModal = ({
  isOpen,
  onClose,
  selectedCustomer,
  setCustomerShantiyeler,
  customerShantiyeler,
  setAlertOpen,
  setError,
  setSuccessMessage,
}) => {
  const [santiyeName, setSantiyeName] = useState('');
  const [santiyePhone, setSantiyePhone] = useState('');
  const [santiyeEmail, setSantiyeEmail] = useState('');
  const [santiyeCariCode, setSantiyeCariCode] = useState('');
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictingCustomer, setConflictingCustomer] = useState(null);
  const [isCustomerSelectionOpen, setIsCustomerSelectionOpen] = useState(false);
  const [pendingCustomers, setPendingCustomers] = useState([]);

  const generateCariCode = useCallback(async () => {
    const db = getFirestore();
    const mainFirmCariCode = selectedCustomer?.cariCode;

    if (!mainFirmCariCode) {
      setError('Ana firmanın cari kodu bulunamadı.');
      setAlertOpen(true);
      return;
    }

    try {
      const shantiyeListRef = collection(db, 'müşteri listesi');
      const shantiyeQuery = query(
        shantiyeListRef,
        where('parentId', '==', selectedCustomer.id)
      );
      const shantiyeSnapshot = await getDocs(shantiyeQuery);

      const nextShantiyeNumber = shantiyeSnapshot.size + 1;
      const generatedCode = `${mainFirmCariCode}/${nextShantiyeNumber}`;

      setSantiyeCariCode(generatedCode);
    } catch (error) {
      console.error('Şantiyeler alınırken hata oluştu:', error);
      setError('Şantiyeler alınırken bir hata oluştu.');
      setAlertOpen(true);
    }
  }, [selectedCustomer, setAlertOpen, setError]);

  useEffect(() => {
    if (isOpen) {
      generateCariCode();
    }
  }, [isOpen, generateCariCode]);

  const handleAddSantiye = async () => {
    if (!santiyeName.trim()) {
      setError('Şantiye adı gereklidir.');
      setAlertOpen(true);
      return;
    }

    const db = getFirestore();

    try {
      const shantiyeListRef = collection(db, 'müşteri listesi');
      
      // Müşteri adı çakışması kontrolü
      const nameConflictQuery = query(
        shantiyeListRef,
        where('Müşteri Adı', '==', santiyeName.trim())
      );
      const nameConflictSnapshot = await getDocs(nameConflictQuery);

      if (!nameConflictSnapshot.empty) {
        const conflictingDoc = nameConflictSnapshot.docs[0];
        setConflictingCustomer({ ...conflictingDoc.data(), id: conflictingDoc.id });
        setIsConflictModalOpen(true);
        return;
      }

      // Cari kod çakışması kontrolü
      const cariCodeConflictQuery = query(
        shantiyeListRef,
        where('cariCode', '==', santiyeCariCode.trim())
      );
      const cariCodeConflictSnapshot = await getDocs(cariCodeConflictQuery);

      if (!cariCodeConflictSnapshot.empty) {
        const conflictingDoc = cariCodeConflictSnapshot.docs[0];
        setConflictingCustomer({ ...conflictingDoc.data(), id: conflictingDoc.id });
        setIsConflictModalOpen(true);
        return;
      }

      await addSantiyeToFirestore();
    } catch (error) {
      console.error('Şantiye eklenirken bir hata oluştu:', error);
      setError('Şantiye eklenirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  const handleConflictResolution = async () => {
    setIsConflictModalOpen(false);
    const db = getFirestore();

    try {
      if (!conflictingCustomer || !conflictingCustomer.id) {
        throw new Error('Çakışan şantiye bilgisi eksik veya geçersiz.');
      }

      await deleteDoc(doc(db, 'müşteri listesi', conflictingCustomer.id));
      console.log(`Çakışan şantiye silindi: ${conflictingCustomer['Müşteri Adı']}`);

      await addSantiyeToFirestore();

      setSuccessMessage('Çakışma çözüldü ve yeni şantiye eklendi.');
      setAlertOpen(true);
    } catch (error) {
      console.error('Çakışma çözümlenirken hata oluştu:', error);
      setError(`Çakışma çözümlenirken hata oluştu: ${error.message}`);
      setAlertOpen(true);
    }
  };

  const addSantiyeToFirestore = async () => {
    const db = getFirestore();
    try {
      const docRef = await addDoc(collection(db, 'müşteri listesi'), {
        'Müşteri Adı': santiyeName.trim(),
        Telefon: santiyePhone.trim(),
        'E-posta': santiyeEmail.trim(),
        cariCode: santiyeCariCode.trim(),
        Şantiye: true,
        parentId: selectedCustomer.id,
        Onay: 'Onaylandı',
        'Şantiye Adı': santiyeName.trim(),
        'Şantiye Cari Kodu': santiyeCariCode.trim(),
      });

      setCustomerShantiyeler([
        ...customerShantiyeler,
        {
          id: docRef.id,
          'Müşteri Adı': santiyeName.trim(),
          Telefon: santiyePhone.trim(),
          'E-posta': santiyeEmail.trim(),
          cariCode: santiyeCariCode.trim(),
          Şantiye: true,
          parentId: selectedCustomer.id,
          Onay: 'Onaylandı',
          'Şantiye Adı': santiyeName.trim(),
          'Şantiye Cari Kodu': santiyeCariCode.trim(),
        },
      ]);

      setSuccessMessage('Şantiye başarıyla eklendi.');
      setAlertOpen(true);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Şantiye eklenirken bir hata oluştu:', error);
      throw new Error('Şantiye eklenirken bir hata oluştu.');
    }
  };

  const resetForm = () => {
    setSantiyeName('');
    setSantiyePhone('');
    setSantiyeEmail('');
    // Cari kodu sıfırlamıyoruz, çünkü otomatik olarak oluşturuluyor
  };

  const handleSelectCustomer = (customer) => {
    setSantiyeName(customer['Müşteri Adı'] || '');
    setSantiyePhone(customer.Telefon || '');
    setSantiyeEmail(customer['E-posta'] || '');
    // Cari kodu seçilen müşteriden almıyoruz, otomatik oluşturulan kodu koruyoruz
    setIsCustomerSelectionOpen(false);
  };

  const fetchPendingCustomers = useCallback(async () => {
    const db = getFirestore();
    try {
      const customerListRef = collection(db, 'müşteri listesi');
      const pendingCustomersQuery = query(
        customerListRef,
        where('Onay', '==', 'Onay Bekliyor'),
      );
      const querySnapshot = await getDocs(pendingCustomersQuery);
      const customers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPendingCustomers(customers);
    } catch (error) {
      console.error('Pending customers could not be fetched:', error);
      setError('Onay bekleyen müşteriler getirilemedi.');
      setAlertOpen(true);
    }
  }, [setError, setAlertOpen]);

  return (
    <>
      <Modal open={isOpen} onClose={onClose}>
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Yeni Şantiye Ekle
          </Typography>
          <Box display="flex" alignItems="center">
            <TextField
              label="Şantiye Adı"
              fullWidth
              margin="normal"
              value={santiyeName}
              onChange={(e) => setSantiyeName(e.target.value)}
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
            value={santiyePhone}
            onChange={(e) => setSantiyePhone(e.target.value)}
          />
          <TextField
            label="E-posta"
            fullWidth
            margin="normal"
            value={santiyeEmail}
            onChange={(e) => setSantiyeEmail(e.target.value)}
          />
          <TextField
            label="Cari Kodu"
            fullWidth
            margin="normal"
            value={santiyeCariCode}
            disabled
          />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddSantiye}
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
          'Şantiye Adı': santiyeName,
          cariCode: santiyeCariCode,
        }}
      />
    </>
  );
};

export default AddSantiyeModal;