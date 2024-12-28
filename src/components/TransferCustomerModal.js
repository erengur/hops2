// TransferCustomerModal.js

import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  Typography,
  Box,
  Button,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
} from 'firebase/firestore';
import CustomerSelectionTable from './CustomerSelectionTable';
import { auth } from './firebaseConfig';

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
  maxHeight: '90vh',
  overflowY: 'auto',
  border: '1px solid #ccc',
}));

export const handleDataTransfer = async ({
  sourceCustomer,
  targetCustomer,
  isSantiyeTransfer,
  setError,
  setSuccessMessage,
  setAlertOpen,
  onSuccess
}) => {
  if (!targetCustomer) {
    setError(`Lütfen veri aktarımı için bir ${isSantiyeTransfer ? 'şantiye' : 'müşteri'} seçin.`);
    setAlertOpen(true);
    return;
  }

  const db = getFirestore();
  const batch = writeBatch(db);
  const userEmail = auth.currentUser?.email;

  if (!userEmail) {
    setError('Kullanıcı oturumu bulunamadı');
    setAlertOpen(true);
    return;
  }

  try {
    const timeSheetsRef = collection(db, `users/${userEmail}/timeSheets`);
    const sourceName = isSantiyeTransfer 
      ? sourceCustomer['Şantiye Adı'] || sourceCustomer['Müşteri Adı']
      : sourceCustomer['Müşteri Adı'];

    const puantajQuery = query(
      timeSheetsRef,
      where('Müşteri Adı', '==', sourceName)
    );

    const puantajSnapshot = await getDocs(puantajQuery);
    const transferCount = puantajSnapshot.size;

    puantajSnapshot.forEach((puantajDoc) => {
      const puantajRef = doc(timeSheetsRef, puantajDoc.id);
      batch.update(puantajRef, {
        'Müşteri Adı': targetCustomer['Müşteri Adı'],
        'Cari Kodu': targetCustomer.cariCode
      });
    });

    await batch.commit();

    setSuccessMessage(`${transferCount} adet puantaj başarıyla taşındı.`);
    setAlertOpen(true);
    if (onSuccess) onSuccess();
    
    console.log('Transfer detayları:', {
      kaynak: sourceName,
      hedef: targetCustomer['Müşteri Adı'],
      taşınanVeriSayısı: transferCount,
      veritabanıYolu: `users/${userEmail}/timeSheets`
    });

  } catch (error) {
    console.error('Veri transferi sırasında hata:', error);
    setError('Veri transferi sırasında bir hata oluştu.');
    setAlertOpen(true);
  }
};

const TransferCustomerModal = ({
  isOpen,
  onClose,
  selectedCustomer,
  setAlertOpen,
  setError,
  setSuccessMessage,
  isSantiyeTransfer = false,
  onSuccess
}) => {
  const [selectedTargetCustomer, setSelectedTargetCustomer] = useState(null);
  const [availableCustomers, setAvailableCustomers] = useState([]);

  useEffect(() => {
    const fetchAvailableCustomers = async () => {
      const db = getFirestore();
      const userEmail = auth.currentUser?.email;
      
      if (!userEmail) {
        setError('Kullanıcı oturumu bulunamadı');
        setAlertOpen(true);
        return;
      }

      try {
        const customerListRef = collection(db, `users/${userEmail}/customerList`);
        const querySnapshot = await getDocs(customerListRef);
        const customers = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(customer => customer.id !== selectedCustomer?.id);
        
        setAvailableCustomers(customers);
      } catch (error) {
        console.error('Müşteriler getirilirken hata:', error);
        setError('Müşteriler getirilirken bir hata oluştu');
        setAlertOpen(true);
      }
    };

    if (isOpen) {
      fetchAvailableCustomers();
    }
  }, [isOpen, selectedCustomer?.id, setAlertOpen, setError]);

  const handleTransfer = () => handleDataTransfer({
    sourceCustomer: selectedCustomer,
    targetCustomer: selectedTargetCustomer,
    isSantiyeTransfer,
    setError,
    setSuccessMessage,
    setAlertOpen,
    onSuccess
  });

  const sourceName = isSantiyeTransfer 
    ? (selectedCustomer && (selectedCustomer['Şantiye Adı'] || selectedCustomer['Müşteri Adı'])) 
    : (selectedCustomer && selectedCustomer['Müşteri Adı']);
  const sourceCari = isSantiyeTransfer 
    ? (selectedCustomer && (selectedCustomer['Şantiye Cari Kodu'] || selectedCustomer.cariCode))
    : (selectedCustomer && selectedCustomer.cariCode);

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalBox>
        <Typography variant="h6" gutterBottom>
          {isSantiyeTransfer ? 'Şantiye Verilerini Aktar' : 'Müşteri Verilerini Aktar'}
        </Typography>

        {selectedCustomer && (
          <Box mb={2}>
            <Typography>
              <strong>Kaynak {isSantiyeTransfer ? 'Şantiye' : 'Müşteri'}:</strong> 
              {sourceName}
            </Typography>
            <Typography>
              <strong>Cari Kodu:</strong> 
              {sourceCari}
            </Typography>
          </Box>
        )}

        <Box mt={2} mb={2}>
          <Typography variant="subtitle1" gutterBottom>
            Verilerin aktarılacağı {isSantiyeTransfer ? 'şantiyeyi' : 'müşteriyi'} seçin:
          </Typography>
          <Box sx={{ 
            maxHeight: '400px', 
            overflow: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            mb: 2
          }}>
            <CustomerSelectionTable
              customers={availableCustomers}
              onSelectCustomer={setSelectedTargetCustomer}
              selectedId={selectedTargetCustomer?.id}
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Not: Seçilen {isSantiyeTransfer ? 'şantiyenin' : 'müşterinin'} puantaj verileri 
          hedef {isSantiyeTransfer ? 'şantiyeye' : 'müşteriye'} aktarılacaktır.
        </Typography>

        <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={onClose}>
            İptal
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleTransfer}
            disabled={!selectedTargetCustomer}
          >
            Verileri Aktar
          </Button>
        </Box>
      </ModalBox>
    </Modal>
  );
};

export default TransferCustomerModal;
