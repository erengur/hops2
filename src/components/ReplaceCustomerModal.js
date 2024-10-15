// src/components/ReplaceCustomerModal.js

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

const ReplaceCustomerModal = ({ isOpen, onClose, onReplace }) => {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalBox>
        <Typography variant="h6" gutterBottom>
          Müşteri ile Çakışma
        </Typography>
        <Typography gutterBottom>
          Şantiye adı müşteri adı ile çakışıyor. Bu müşterinin yerini bu şantiyenin almasını ister misiniz?
        </Typography>
        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button variant="contained" onClick={onClose}>
            Hayır
          </Button>
          <Button variant="contained" color="primary" onClick={onReplace} style={{ marginLeft: '10px' }}>
            Evet
          </Button>
        </Box>
      </ModalBox>
    </Modal>
  );
};

export default ReplaceCustomerModal;
