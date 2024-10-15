// src/components/DeleteSantiyeModal.js

import React from 'react';
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

const DeleteSantiyeModal = ({
  isOpen,
  onClose,
  selectedSantiye,
  setCustomerShantiyeler,
  customerShantiyeler,
  setAlertOpen,
  setError,
  setSuccessMessage,
}) => {
  const handleDeleteSantiye = async () => {
    const db = getFirestore();
    try {
      // Delete Şantiye Document
      await deleteDoc(doc(db, 'müşteri listesi', selectedSantiye.id));

      const batch = writeBatch(db);

      // Update Puantajlar where 'Müşteri Adı' matches the şantiye name
      const puantajlarRef = collection(db, 'puantajlar');
      const puantajQuery = query(
        puantajlarRef,
        where('Müşteri Adı', '==', selectedSantiye['Müşteri Adı'])
      );
      const puantajlarSnapshot = await getDocs(puantajQuery);

      puantajlarSnapshot.forEach((puantajDoc) => {
        batch.update(puantajDoc.ref, {
          'Müşteri Adı': 'Silinmiş Şantiye',
        });
      });

      // Update Puantajlar where 'Cari Kodu' matches the şantiye cari code
      const puantajCariQuery = query(
        puantajlarRef,
        where('Cari Kodu', '==', selectedSantiye['cariCode'])
      );
      const puantajCariSnapshot = await getDocs(puantajCariQuery);

      puantajCariSnapshot.forEach((puantajDoc) => {
        batch.update(puantajDoc.ref, {
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
              <strong>Şantiye Adı:</strong> {selectedSantiye['Müşteri Adı']}
            </Typography>
            <Typography>
              <strong>Telefon:</strong> {selectedSantiye['Telefon']}
            </Typography>
            <Typography>
              <strong>E-posta:</strong> {selectedSantiye['E-posta']}
            </Typography>
            <Typography>
              <strong>Cari Kodu:</strong> {selectedSantiye['cariCode']}
            </Typography>
          </Box>
        )}
        <Typography color="error" mb={2}>
          Bu şantiyeyi silerseniz, ilgili puantaj verileri de kaybolacaktır. Devam etmek istediğinize emin misiniz?
        </Typography>
        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="secondary"
            onClick={handleDeleteSantiye}
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

export default DeleteSantiyeModal;
