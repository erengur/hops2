// src/components/DeleteCustomerModal.js

import React from 'react';
import {
  Modal,
  Typography,
  Box,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { getFirestore, doc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

const ModalBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  backgroundColor: '#ffffff',
  color: '#000000',
  boxShadow: theme.shadows[5],
  padding: theme.spacing(4),
  maxHeight: '80vh',
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
}) => {
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    const db = getFirestore();
    try {
      // If it's a main company, check for linked şantiyeler
      if (selectedCustomer.parentId === null) {
        // Check if any shantiyes are linked
        const shantiyelerQuery = query(
          collection(db, 'müşteri listesi'),
          where('parentId', '==', selectedCustomer.id)
        );
        const shantiyelerSnapshot = await getDocs(shantiyelerQuery);
        if (!shantiyelerSnapshot.empty) {
          setError('Bu ana şirketin bağlı şantiyeleri var. Önce şantiyeleri silmelisiniz.');
          setAlertOpen(true);
          onClose();
          return;
        }
      }

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
            onClick={onClose}
          >
            İptal
          </Button>
        </Box>
      </ModalBox>
    </Modal>
  );
};

export default DeleteCustomerModal;
