// src/components/DeleteCustomerModal.js

import React, { useState, useCallback } from 'react';
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
  doc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import CustomerSelectionTable from './CustomerSelectionTable';
import { handleDataTransfer } from './TransferCustomerModal';

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

const DeleteCustomerModal = ({
  isOpen,
  onClose,
  selectedCustomer,
  setAlertOpen,
  setError,
  setSuccessMessage,
  setSelectedCustomer,
  onTransfer
}) => {
  const [showTransferOption, setShowTransferOption] = useState(false);
  const [selectedTargetCustomer, setSelectedTargetCustomer] = useState(null);
  const [availableCustomers, setAvailableCustomers] = useState([]);

  // Diğer müşterileri getir
  const fetchAvailableCustomers = useCallback(async () => {
    const db = getFirestore();
    try {
      const customerQuery = query(
        collection(db, 'müşteri listesi'),
        where('Onay', '==', 'Onaylandı'),
        where('__name__', '!=', selectedCustomer.id)
      );
      const snapshot = await getDocs(customerQuery);
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableCustomers(customers);
    } catch (error) {
      console.error('Müşteriler getirilirken hata oluştu:', error);
      setError('Müşteriler getirilirken hata oluştu.');
      setAlertOpen(true);
    }
  }, [selectedCustomer, setError, setAlertOpen]);

  const handleTransferAndDelete = async () => {
    try {
      // Önce verileri transfer et
      await handleDataTransfer({
        sourceCustomer: selectedCustomer,
        targetCustomer: selectedTargetCustomer,
        isSantiyeTransfer: false,
        setError,
        setSuccessMessage,
        setAlertOpen,
      });

      const db = getFirestore();

      // Eğer ana müşteriyse, şantiyelerini de güncelle
      if (!selectedCustomer.parentId) {
        const batch = writeBatch(db);
        const santiyeQuery = query(
          collection(db, 'müşteri listesi'),
          where('parentId', '==', selectedCustomer.id)
        );
        const santiyeSnapshot = await getDocs(santiyeQuery);

        santiyeSnapshot.forEach((santiyeDoc) => {
          batch.update(santiyeDoc.ref, {
            parentId: selectedTargetCustomer.id,
          });
        });

        await batch.commit();
      }

      // Müşteriyi sil
      await deleteDoc(doc(db, 'müşteri listesi', selectedCustomer.id));

      setSuccessMessage('Müşteri silindi ve veriler başarıyla aktarıldı.');
      setAlertOpen(true);
      onClose();
      setSelectedCustomer(null);
    } catch (error) {
      console.error('İşlem sırasında bir hata oluştu:', error);
      setError('İşlem sırasında bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  const handleDeleteOnly = async () => {
    const db = getFirestore();
    try {
      await deleteDoc(doc(db, 'müşteri listesi', selectedCustomer.id));

      const puantajlarRef = collection(db, 'puantajlar');
      const puantajQuery = query(
        puantajlarRef,
        where('Müşteri Adı', '==', selectedCustomer['Müşteri Adı'])
      );
      const puantajlarSnapshot = await getDocs(puantajQuery);

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
      onClose();
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Müşteri silinirken bir hata oluştu:', error);
      setError('Müşteri silinirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
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
              <strong>Cari Kodu:</strong> {selectedCustomer.cariCode}
            </Typography>
          </Box>
        )}

        <Typography color="error" mb={2}>
          Bu müşteriyi sildiğinizde, ilgili puantaj verileri kaybolacaktır.
        </Typography>

        <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={onClose}>
            İptal
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              onClose();
              onTransfer(selectedCustomer);
            }}
          >
            Verileri Taşı
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteOnly}
          >
            Sil
          </Button>
        </Box>
      </ModalBox>
    </Modal>
  );
};

export default DeleteCustomerModal;
