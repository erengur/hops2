import React, { useState, useEffect } from 'react';
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
 TextField,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

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

// Güvenli erişim için bir yardımcı fonksiyon
const safeGet = (obj, key) => (obj && obj[key] ? obj[key] : 'Bilgi Yok');

const ConflictResolutionModal = ({
  isOpen,
  onClose,
  onConfirm,
  conflictingCustomer,
  oldCustomerData,
  newCustomerData = {},
  message,
  type = 'customer'
}) => {
  // Güvenli bir şekilde başlangıç değerlerini al
  const getInitialValue = (data, field) => {
    if (!data) return '';
    return data[field] || '';
  };

  // State'leri güvenli bir şekilde başlat
  const [finalName, setFinalName] = useState('');
  const [finalCariCode, setFinalCariCode] = useState('');
  const [validationError, setValidationError] = useState('');

  // Modal açıldığında state'leri güvenli bir şekilde güncelle
  useEffect(() => {
    if (isOpen && newCustomerData) {
      const nameField = type === 'santiye' ? 'Şantiye Adı' : 'Müşteri Adı';
      const cariField = type === 'santiye' ? 'Şantiye Cari Kodu' : 'cariCode';

      setFinalName(getInitialValue(newCustomerData, nameField));
      setFinalCariCode(getInitialValue(newCustomerData, cariField));
    }
  }, [isOpen, newCustomerData, type]);

  // Çakışma kontrolü için yeni fonksiyon
  const checkConflicts = async (name, cariCode) => {
    if (!name.trim() || !cariCode.trim()) return '';

    const db = getFirestore();
    const customerListRef = collection(db, 'müşteri listesi');
    
    try {
      // Güncellenecek ve aktarılacak kayıtların ID'leri
      const allowedIds = [
        oldCustomerData?.id,
        conflictingCustomer?.id
      ].filter(Boolean);

      // Güncellenecek ve aktarılacak kayıtların mevcut değerleri
      const allowedNames = [
        safeGet(oldCustomerData, type === 'santiye' ? 'Şantiye Adı' : 'Müşteri Adı'),
        safeGet(conflictingCustomer, type === 'santiye' ? 'Şantiye Adı' : 'Müşteri Adı')
      ].filter(Boolean);

      const allowedCariCodes = [
        safeGet(oldCustomerData, type === 'santiye' ? 'Şantiye Cari Kodu' : 'cariCode'),
        safeGet(conflictingCustomer, type === 'santiye' ? 'Şantiye Cari Kodu' : 'cariCode')
      ].filter(Boolean);

      // Eğer girilen değerler mevcut kayıtlardan birinin değeriyse kontrol etme
      const isNameAllowed = allowedNames.includes(name.trim());
      const isCariCodeAllowed = allowedCariCodes.includes(cariCode.trim());

      // Her iki değer de izin verilen değerlerden geliyorsa çakışma kontrolü yapma
      if (isNameAllowed && isCariCodeAllowed) {
        return '';
      }

      // Sadece yeni girilen değerler için çakışma kontrolü yap
      if (!isNameAllowed) {
        let nameQuery = query(
          customerListRef,
          where(type === 'santiye' ? 'Şantiye Adı' : 'Müşteri Adı', '==', name.trim())
        );
        const nameSnapshot = await getDocs(nameQuery);
        const nameConflicts = nameSnapshot.docs.filter(doc => !allowedIds.includes(doc.id));
        
        if (nameConflicts.length > 0) {
          return `Bu ${type === 'santiye' ? 'şantiye adı' : 'müşteri adı'} başka bir kayıt tarafından kullanılıyor.`;
        }
      }

      if (!isCariCodeAllowed) {
        let cariCodeQuery = query(
          customerListRef,
          where(type === 'santiye' ? 'Şantiye Cari Kodu' : 'cariCode', '==', cariCode.trim())
        );
        const cariCodeSnapshot = await getDocs(cariCodeQuery);
        const cariCodeConflicts = cariCodeSnapshot.docs.filter(doc => !allowedIds.includes(doc.id));

        if (cariCodeConflicts.length > 0) {
          return `Bu cari kod başka bir kayıt tarafından kullanılıyor.`;
        }
      }

      return '';
    } catch (error) {
      console.error('Çakışma kontrolü sırasında hata:', error);
      return 'Çakışma kontrolü yapılırken bir hata oluştu.';
    }
  };

  // TextField değişikliklerini kontrol et
  const handleNameChange = async (e) => {
    const newName = e.target.value;
    setFinalName(newName);
    setValidationError('');

    // Boş değer kontrolü
    if (!newName.trim() || !finalCariCode.trim()) return;

    // Değer girilmişse çakışma kontrolü yap
    const error = await checkConflicts(newName, finalCariCode);
    if (error) setValidationError(error);
  };

  const handleCariCodeChange = async (e) => {
    const newCariCode = e.target.value;
    setFinalCariCode(newCariCode);
    setValidationError('');

    // Boş değer kontrolü
    if (!finalName.trim() || !newCariCode.trim()) return;

    // Değer girilmişse çakışma kontrolü yap
    const error = await checkConflicts(finalName, newCariCode);
    if (error) setValidationError(error);
  };

  const handleConfirm = async () => {
    if (!finalName.trim() || !finalCariCode.trim()) return;

    // Son bir kez daha çakışma kontrolü yap
    const error = await checkConflicts(finalName.trim(), finalCariCode.trim());
    if (error) {
      setValidationError(error);
      return;
    }
    
    onConfirm({
      finalName: finalName.trim(),
      finalCariCode: finalCariCode.trim()
    });
  };

  // Verilerden en azından biri yoksa hata mesajı göster
  if (!conflictingCustomer || !oldCustomerData) {
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
          Şantiye Çakışması
        </Typography>

        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Aşağıdaki şantiyeler çakışıyor. Şantiyeleri birleştirmek için yeni bilgileri girin.
        </Typography>

        <TableContainer component={Paper} style={{ marginBottom: '20px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Alan</TableCell>
                <TableCell>1. Şantiye</TableCell>
                <TableCell>2. Şantiye</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{type === 'santiye' ? 'Şantiye Adı' : 'Müşteri Adı'}</TableCell>
                <TableCell>{safeGet(oldCustomerData, type === 'santiye' ? 'Şantiye Adı' : 'Müşteri Adı')}</TableCell>
                <TableCell>{safeGet(conflictingCustomer, type === 'santiye' ? 'Şantiye Adı' : 'Müşteri Adı')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{type === 'santiye' ? 'Şantiye Cari Kodu' : 'Cari Kodu'}</TableCell>
                <TableCell>{safeGet(oldCustomerData, type === 'santiye' ? 'Şantiye Cari Kodu' : 'cariCode')}</TableCell>
                <TableCell>{safeGet(conflictingCustomer, type === 'santiye' ? 'Şantiye Cari Kodu' : 'cariCode')}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Birleştirilmiş Şantiye Bilgileri
          </Typography>
          <TextField
            fullWidth
            label={type === 'santiye' ? 'Şantiye Adı' : 'Müşteri Adı'}
            value={finalName}
            onChange={handleNameChange}
            margin="normal"
            error={!!validationError}
          />
          <TextField
            fullWidth
            label={type === 'santiye' ? 'Şantiye Cari Kodu' : 'Cari Kodu'}
            value={finalCariCode}
            onChange={handleCariCodeChange}
            margin="normal"
            error={!!validationError}
          />
          {validationError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {validationError}
            </Typography>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Not: Birleştirme sonrası her iki şantiyenin verileri birleştirilmiş şantiyeye taşınacak ve tek şantiye olarak devam edilecektir.
        </Typography>

        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button onClick={onClose} color="primary" variant="outlined">
            İptal
          </Button>
          <Button 
            onClick={handleConfirm}
            color="primary" 
            variant="contained" 
            style={{ marginLeft: '10px' }}
            disabled={!finalName.trim() || !finalCariCode.trim() || !!validationError}
          >
            Şantiyeleri Birleştir
          </Button>
        </Box>
      </ModalBox>
    </Modal>
  );
};

export default ConflictResolutionModal;
