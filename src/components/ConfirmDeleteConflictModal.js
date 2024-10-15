// src/components/ConfirmDeleteConflictModal.js

import React from 'react';
import { Modal, Typography, Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

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

const ConfirmDeleteConflictModal = ({ isOpen, onClose, conflictingCustomer, onConfirm }) => {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalBox>
        <Typography variant="h6" gutterBottom>
          Çakışan Müşteriyi Sil
        </Typography>
        <Typography gutterBottom>
          "{conflictingCustomer?.['Müşteri Adı']}" adlı müşteri zaten var. Bu müşteriyi silmek ve güncellenen şantiyeyi bu isimle eklemek istiyor musunuz?
        </Typography>
        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button variant="contained" onClick={onClose}>
            Hayır
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={onConfirm}
            style={{ marginLeft: '10px' }}
          >
            Evet, Sil ve Güncelle
          </Button>
        </Box>
      </ModalBox>
    </Modal>
  );
};

export default ConfirmDeleteConflictModal;
