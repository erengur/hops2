import React from 'react';
import {
  Modal,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
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
  border: '1px solid #ccc',
  maxHeight: '90vh',
  overflowY: 'auto',
}));

const ConflictResolutionModal = ({ isOpen, onClose, onConfirm, conflictingCustomer, newCustomerData }) => {
  if (!conflictingCustomer || !newCustomerData) {
    return (
      <Modal open={isOpen} onClose={onClose}>
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Hata
          </Typography>
          <Typography variant="body1" gutterBottom>
            Müşteri bilgileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
          </Typography>
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button onClick={onClose} color="primary" variant="outlined">
              Kapat
            </Button>
          </Box>
        </ModalBox>
      </Modal>
    );
  }

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalBox>
        <Typography variant="h6" gutterBottom>
          Müşteri Çakışması
        </Typography>
        <Typography variant="body1" gutterBottom>
          Aşağıdaki bilgilere sahip bir müşteri zaten mevcut:
        </Typography>
        <TableContainer component={Paper} style={{ marginBottom: '20px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Alan</TableCell>
                <TableCell>Mevcut Müşteri</TableCell>
                <TableCell>Yeni / Güncellenecek Veri</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Müşteri Adı</TableCell>
                <TableCell>{conflictingCustomer['Müşteri Adı'] || 'Bilgi Yok'}</TableCell>
                <TableCell>{newCustomerData['Müşteri Adı'] || 'Bilgi Yok'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cari Kodu</TableCell>
                <TableCell>{conflictingCustomer['cariCode'] || 'Bilgi Yok'}</TableCell>
                <TableCell>{newCustomerData['cariCode'] || 'Bilgi Yok'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="body1" gutterBottom>
          Bu çakışmayı nasıl çözmek istersiniz?
        </Typography>
        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button onClick={onClose} color="primary" variant="outlined">
            İptal
          </Button>
          <Button 
            onClick={onConfirm} 
            color="secondary" 
            variant="contained" 
            style={{ marginLeft: '10px' }}
          >
            Mevcut Müşteriyi Sil ve Güncelle
          </Button>
        </Box>
      </ModalBox>
    </Modal>
  );
};

export default ConflictResolutionModal;