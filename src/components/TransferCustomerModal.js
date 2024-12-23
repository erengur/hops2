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
} from 'firebase/firestore';
import CustomerSelectionTable from './CustomerSelectionTable';

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

  try {
    const puantajlarRef = collection(db, 'puantajlar');
    const sourceName = isSantiyeTransfer 
      ? sourceCustomer['Şantiye Adı'] || sourceCustomer['Müşteri Adı'] 
      : sourceCustomer['Müşteri Adı'];
    const targetName = isSantiyeTransfer 
      ? targetCustomer['Şantiye Adı'] || targetCustomer['Müşteri Adı'] 
      : targetCustomer['Müşteri Adı'];
    const targetCari = isSantiyeTransfer
      ? targetCustomer['Şantiye Cari Kodu'] || targetCustomer.cariCode
      : targetCustomer.cariCode;

    const puantajQuery = query(
      puantajlarRef,
      where('Müşteri Adı', '==', sourceName)
    );
    const puantajlarSnapshot = await getDocs(puantajQuery);

    puantajlarSnapshot.forEach((puantajDoc) => {
      batch.update(puantajDoc.ref, {
        'Müşteri Adı': targetName,
        'Cari Kodu': targetCari,
      });
    });

    await batch.commit();

    setSuccessMessage(
      `${puantajlarSnapshot.size} adet puantaj verisi başarıyla aktarıldı.`
    );
    setAlertOpen(true);
    
    if (onSuccess) {
      onSuccess(puantajlarSnapshot.size);
    }
  } catch (error) {
    console.error('Veri aktarımı sırasında hata oluştu:', error);
    setError(`Veri aktarımı sırasında bir hata oluştu: ${error.message}`);
    setAlertOpen(true);
    throw error;
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

  const fetchAvailableCustomers = useCallback(async () => {
    // Eğer selectedCustomer tanımlı değilse sorgu yapma:
    if (!selectedCustomer) {
      return;
    }
    const db = getFirestore();
    try {
      const baseQuery = collection(db, 'müşteri listesi');
      const customerQuery = isSantiyeTransfer ? 
        query(
          baseQuery,
          where('Onay', '==', 'Onaylandı'),
          where('Şantiye', '==', true),
          where('parentId', '==', selectedCustomer.parentId),
          where('__name__', '!=', selectedCustomer.id)
        ) :
        query(
          baseQuery,
          where('Onay', '==', 'Onaylandı'),
          where('__name__', '!=', selectedCustomer.id)
        );

      const snapshot = await getDocs(customerQuery);
      
      const customers = snapshot.docs.map(doc => {
        const data = doc.data();
        const musteriAdi = data['antiye Adı'] || data['Müşteri Adı'] || '';
        const cari = data['Şantiye Cari Kodu'] || data.cariCode || '';
        const parentId = data.parentId || '';
        return {
          id: doc.id,
          'Müşteri Adı': musteriAdi,
          cariCode: cari,
          parentId: parentId
        };
      });

      setAvailableCustomers(customers);
    } catch (error) {
      console.error('Veriler getirilirken hata oluştu:', error);
      setError('Veriler getirilirken hata oluştu.');
      setAlertOpen(true);
    }
  }, [selectedCustomer, setError, setAlertOpen, isSantiyeTransfer]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableCustomers();
      setSelectedTargetCustomer(null);
    }
  }, [isOpen, fetchAvailableCustomers]);

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
