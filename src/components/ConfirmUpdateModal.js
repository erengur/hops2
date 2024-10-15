// src/components/ConfirmUpdateModal.js

import React from 'react';
import { Modal, Typography, Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const ConfirmUpdateBox = styled(Box)(({ theme }) => ({
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

const ConfirmUpdateModal = ({ isOpen, onClose, updateChanges, confirmUpdate, cancelUpdate }) => {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <ConfirmUpdateBox>
        <Typography variant="h6" gutterBottom>
          Değişiklikleri Onayla
        </Typography>
        <Typography>
          Yapılan değişiklikler aşağıda özetlenmiştir. Değişikliklerden emin misiniz?
        </Typography>
        <Box mt={2}>
          {updateChanges.map((change, index) => (
            <Typography key={index}>
              <strong>{change.field}:</strong> "{change.old}" yerine "{change.new}" olarak değiştirildi.
            </Typography>
          ))}
        </Box>
        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button variant="contained" onClick={cancelUpdate}>
            Hayır
          </Button>
          <Button variant="contained" color="primary" onClick={confirmUpdate} style={{ marginLeft: '10px' }}>
            Evet
          </Button>
        </Box>
      </ConfirmUpdateBox>
    </Modal>
  );
};

export default ConfirmUpdateModal;
