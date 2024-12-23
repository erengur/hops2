// DeleteSantiyeModal.js
import React, { useState } from 'react';
import {
  Modal,
  Typography,
  Box,
  Button,
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
import TransferCustomerModal from './TransferCustomerModal';

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

const DeleteSantiyeModal = ({
  isOpen,
  onClose,
  selectedSantiye,
  setCustomerShantiyeler,
  customerShantiyeler,
  setAlertOpen,
  setError,
  setSuccessMessage,
  onTransfer
}) => {
  const handleDeleteOnly = async () => {
    const db = getFirestore();
    try {
      await deleteDoc(doc(db, 'müşteri listesi', selectedSantiye.id));

      const puantajlarRef = collection(db, 'puantajlar');
      const puantajQuery = query(
        puantajlarRef,
        where('Müşteri Adı', '==', selectedSantiye['Şantiye Adı'])
      );
      const puantajlarSnapshot = await getDocs(puantajQuery);

      const batch = writeBatch(db);
      puantajlarSnapshot.forEach((puantajDoc) => {
        batch.update(puantajDoc.ref, {
          'Müşteri Adı': 'Silinmiş Şantiye',
          'Cari Kodu': '',
        });
      });
      await batch.commit();

      setCustomerShantiyeler(
        customerShantiyeler.filter((santiye) => santiye.id !== selectedSantiye.id)
      );
      
      setSuccessMessage('Şantiye başarıyla silindi.');
      setAlertOpen(true);
      onClose();
    } catch (error) {
      console.error('Şantiye silinirken bir hata oluştu:', error);
      setError('Şantiye silinirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalBox>
        <Typography variant="h6" gutterBottom>
          Şantiyeyi Sil
        </Typography>
        {selectedSantiye && (
          <Box mb={2}>
            <Typography>
              <strong>Şantiye Adı:</strong> {selectedSantiye['Şantiye Adı']}
            </Typography>
            <Typography>
              <strong>Telefon:</strong> {selectedSantiye['Telefon']}
            </Typography>
            <Typography>
              <strong>E-posta:</strong> {selectedSantiye['E-posta']}
            </Typography>
            <Typography>
              <strong>Cari Kodu:</strong> {selectedSantiye['Şantiye Cari Kodu']}
            </Typography>
          </Box>
        )}

        <Typography color="error" mb={2}>
          Bu şantiyeyi sildiğinizde, ilgili puantaj verileri kaybolacaktır.
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
              onTransfer(selectedSantiye);
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

export default DeleteSantiyeModal;
