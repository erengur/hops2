import React, { useState, useEffect } from 'react';
import {
  Modal,
  Typography,
  TextField,
  Box,
  Button,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  getFirestore,
  doc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import CustomerSelectionTable from './CustomerSelectionTable';
import ConflictResolutionModal from './ConflictResolutionModal';
import ConfirmUpdateModal from './ConfirmUpdateModal';
import { auth } from './firebaseConfig';

const ModalBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 700,
  backgroundColor: '#ffffff',
  color: '#000000',
  boxShadow: theme.shadows[5],
  padding: theme.spacing(4),
  maxHeight: '90vh',
  overflowY: 'auto',
  border: '1px solid #ccc',
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  marginLeft: theme.spacing(1),
  width: '30px',
  height: '30px',
}));

const normalizeString = (str) => {
  return str.trim().replace(/\s+/g, ' '); // Baş, son ve fazla boşlukları temizler
};

const EditSantiyeModal = ({
  isOpen,
  onClose,
  selectedSantiye,
  setCustomerShantiyeler,
  customerShantiyeler,
  setAlertOpen,
  setError,
  setSuccessMessage,
  approvedCustomers,
}) => {
  const [editSantiyeName, setEditSantiyeName] = useState('');
  const [editSantiyePhone, setEditSantiyePhone] = useState('');
  const [editSantiyeEmail, setEditSantiyeEmail] = useState('');
  const [editSantiyeCariCode, setEditSantiyeCariCode] = useState('');
  const [isCustomerSelectionOpen, setIsCustomerSelectionOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictingSantiye, setConflictingSantiye] = useState(null);
  const [updateChanges, setUpdateChanges] = useState([]);
  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);

  useEffect(() => {
    if (selectedSantiye) {
      setEditSantiyeName(selectedSantiye['Şantiye Adı'] || selectedSantiye['Müşteri Adı'] || '');
      setEditSantiyePhone(selectedSantiye['Telefon'] || '');
      setEditSantiyeEmail(selectedSantiye['E-posta'] || '');
      setEditSantiyeCariCode(selectedSantiye['Şantiye Cari Kodu'] || selectedSantiye.cariCode || '');
      
      console.log('Seçilen şantiye verileri:', {
        santiyeAdi: selectedSantiye['Şantiye Adı'],
        musteriAdi: selectedSantiye['Müşteri Adı'],
        telefon: selectedSantiye['Telefon'],
        email: selectedSantiye['E-posta'],
        cariKod: selectedSantiye['Şantiye Cari Kodu'] || selectedSantiye.cariCode
      });
    }
  }, [selectedSantiye]);

  const handleUpdateSantiye = async () => {
    if (!editSantiyeName.trim() || !editSantiyeCariCode.trim()) {
      setError('Şantiye adı ve cari kodu gereklidir.');
      setAlertOpen(true);
      return;
    }

    const db = getFirestore();
    try {
      const batch = writeBatch(db);

      // Şantiyeyi güncelle
      const santiyeRef = doc(db, 'müşteri listesi', selectedSantiye.id);
      const updateData = {
        'Şantiye Adı': editSantiyeName.trim(),
        'Müşteri Adı': editSantiyeName.trim(), // Müşteri adını da güncelle
        'Telefon': editSantiyePhone.trim(),
        'E-posta': editSantiyeEmail.trim(),
        'Şantiye Cari Kodu': editSantiyeCariCode.trim(),
        'cariCode': editSantiyeCariCode.trim(), // Normal cariCode'u da güncelle
        'updatedAt': new Date().toISOString()
      };
      batch.update(santiyeRef, updateData);

      // İlgili puantajları güncelle
      const puantajlarRef = collection(db, 'puantajlar');
      const puantajQuery = query(
        puantajlarRef,
        where('Müşteri Adı', 'in', [
          selectedSantiye['Şantiye Adı'],
          selectedSantiye['Müşteri Adı']
        ])
      );

      const puantajSnapshot = await getDocs(puantajQuery);
      puantajSnapshot.forEach((puantajDoc) => {
        batch.update(puantajDoc.ref, {
          'Müşteri Adı': editSantiyeName.trim(),
          'Cari Kodu': editSantiyeCariCode.trim()
        });
      });

      // Tüm güncellemeleri tek seferde gerçekleştir
      await batch.commit();

      setSuccessMessage('Şantiye ve ilgili puantaj verileri başarıyla güncellendi.');
      setAlertOpen(true);
      onClose();
    } catch (error) {
      console.error('Şantiye güncellenirken hata:', error);
      setError('Şantiye güncellenirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  const proceedWithUpdate = () => {
    const changes = [];

    // Güvenli trim işlemi için yardımcı fonksiyon
    const safeTrim = (value) => value ? value.trim() : '';
    const safeCompare = (val1, val2) => safeTrim(val1) !== safeTrim(val2);

    if (safeCompare(editSantiyeName, selectedSantiye['Şantiye Adı'])) {
      changes.push({
        field: 'Şantiye Adı',
        old: selectedSantiye['Şantiye Adı'] || '',
        new: safeTrim(editSantiyeName),
      });
    }

    if (safeCompare(editSantiyePhone, selectedSantiye['Telefon'])) {
      changes.push({
        field: 'Telefon',
        old: selectedSantiye['Telefon'] || '',
        new: safeTrim(editSantiyePhone),
      });
    }

    if (safeCompare(editSantiyeEmail, selectedSantiye['E-posta'])) {
      changes.push({
        field: 'E-posta',
        old: selectedSantiye['E-posta'] || '',
        new: safeTrim(editSantiyeEmail),
      });
    }

    if (safeCompare(editSantiyeCariCode, selectedSantiye['Şantiye Cari Kodu'])) {
      changes.push({
        field: 'Şantiye Cari Kodu',
        old: selectedSantiye['Şantiye Cari Kodu'] || '',
        new: safeTrim(editSantiyeCariCode),
      });
    }

    setUpdateChanges(changes);
    setIsConfirmUpdateOpen(true);
  };

  const confirmUpdate = async () => {
    setIsConfirmUpdateOpen(false);
    const db = getFirestore();
    const batch = writeBatch(db);

    try {
      const oldSantiyeName = normalizeString(selectedSantiye['Şantiye Adı']);

      // Şantiye adını ve cari kodunu güncelle
      const santiyeRef = doc(db, 'müşteri listesi', selectedSantiye.id);
      const updateData = {
        'Şantiye Adı': normalizeString(editSantiyeName),
        'Müşteri Adı': normalizeString(editSantiyeName),
        Telefon: normalizeString(editSantiyePhone),
        'E-posta': normalizeString(editSantiyeEmail),
        'Şantiye Cari Kodu': normalizeString(editSantiyeCariCode),
        cariCode: normalizeString(editSantiyeCariCode),
        updatedAt: new Date().toISOString()
      };

      batch.update(santiyeRef, updateData);

      // İlgili Puantajları Güncelle
      const puantajlarRef = collection(db, 'puantajlar');
      const puantajQuery = query(
        puantajlarRef,
        where('Müşteri Adı', '==', oldSantiyeName)
      );
      const puantajlarSnapshot = await getDocs(puantajQuery);

      if (!puantajlarSnapshot.empty) {
        puantajlarSnapshot.forEach((puantajDoc) => {
          batch.update(puantajDoc.ref, {
            'Müşteri Adı': normalizeString(editSantiyeName),
            'Cari Kodu': normalizeString(editSantiyeCariCode),
          });
        });
      }

      await batch.commit();
      
      setSuccessMessage('Şantiye başarıyla güncellendi.');
      setAlertOpen(true);
      onClose();
    } catch (error) {
      console.error('Güncelleme sırasında bir hata oluştu:', error);
      setError('Güncelleme sırasında bir hata oluştu.');
      setAlertOpen(true);
    }
  };
  

  const handleConflictResolution = async (finalData) => {
    setIsConflictModalOpen(false);
    const db = getFirestore();
    const batch = writeBatch(db);

    try {
      if (!conflictingSantiye || !conflictingSantiye.id) {
        throw new Error('Çakışan şantiye bilgisi eksik veya geçersiz.');
      }

      // Her iki şantiyenin puantajlarını al
      const puantajlarRef = collection(db, 'puantajlar');
      
      // 1. Şantiyenin puantajları
      const puantajQuery1 = query(
        puantajlarRef,
        where('Müşteri Adı', '==', selectedSantiye['Şantiye Adı'])
      );
      
      // 2. Şantiyenin puantajları
      const puantajQuery2 = query(
        puantajlarRef,
        where('Müşteri Adı', '==', conflictingSantiye['Şantiye Adı'])
      );

      const [puantajlarSnapshot1, puantajlarSnapshot2] = await Promise.all([
        getDocs(puantajQuery1),
        getDocs(puantajQuery2)
      ]);

      // Tüm puantajları yeni şantiye bilgileriyle güncelle
      [...puantajlarSnapshot1.docs, ...puantajlarSnapshot2.docs].forEach((puantajDoc) => {
        batch.update(puantajDoc.ref, {
          'Müşteri Adı': finalData.finalName,
          'Cari Kodu': finalData.finalCariCode,
        });
      });

      // Birleştirilmiş şantiyeyi güncelle
      const santiyeRef = doc(db, 'müşteri listesi', selectedSantiye.id);
      batch.update(santiyeRef, {
        'Şantiye Adı': finalData.finalName,
        'Müşteri Adı': finalData.finalName,
        'Şantiye Cari Kodu': finalData.finalCariCode,
        cariCode: finalData.finalCariCode,
        updatedAt: new Date().toISOString()
      });

      // Çakışan şantiyeyi sil
      await deleteDoc(doc(db, 'müşteri listesi', conflictingSantiye.id));

      // Batch işlemini uygula
      await batch.commit();

      setSuccessMessage('Şantiyeler başarıyla birleştirildi ve tüm veriler aktarıldı.');
      setAlertOpen(true);
      onClose();
    } catch (error) {
      console.error('Şantiye birleştirme sırasında hata oluştu:', error);
      setError(`Şantiye birleştirme sırasında bir hata oluştu: ${error.message}`);
      setAlertOpen(true);
    }
  };

  const handleSelectCustomer = (customer) => {
    setEditSantiyeName(customer['Şantiye Adı']);
    setEditSantiyePhone(customer['Telefon'] || '');
    setEditSantiyeEmail(customer['E-posta'] || '');
    setEditSantiyeCariCode(customer['Şantiye Cari Kodu'] || '');
    setIsCustomerSelectionOpen(false);
  };

  const cancelUpdate = () => {
    setIsConfirmUpdateOpen(false);
    setUpdateChanges([]);
  };

  return (
    <>
      <Modal open={isOpen} onClose={onClose}>
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Şantiye Düzenle
          </Typography>
          
          <Box display="flex" alignItems="center" mb={2}>
            <TextField
              label="Şantiye Adı"
              fullWidth
              margin="normal"
              value={editSantiyeName}
              onChange={(e) => setEditSantiyeName(e.target.value)}
            />
            <StyledIconButton
              onClick={() => setIsCustomerSelectionOpen(!isCustomerSelectionOpen)}
              size="small"
            >
              <ArrowDropDownIcon fontSize="small" />
            </StyledIconButton>
          </Box>
          {isCustomerSelectionOpen && (
            <CustomerSelectionTable
              customers={approvedCustomers}
              onSelectCustomer={handleSelectCustomer}
            />
          )}
          <TextField
            label="Telefon"
            fullWidth
            margin="normal"
            value={editSantiyePhone}
            onChange={(e) => setEditSantiyePhone(e.target.value)}
          />
          <TextField
            label="E-posta"
            fullWidth
            margin="normal"
            value={editSantiyeEmail}
            onChange={(e) => setEditSantiyeEmail(e.target.value)}
          />
          <TextField
            label="Şantiye Cari Kodu"
            fullWidth
            margin="normal"
            value={editSantiyeCariCode}
            onChange={(e) => setEditSantiyeCariCode(e.target.value)}
          />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateSantiye}
            >
              Güncelle
            </Button>
          </Box>
        </ModalBox>
      </Modal>

      <ConflictResolutionModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        onConfirm={handleConflictResolution}
        conflictingCustomer={conflictingSantiye}
        newCustomerData={{
          'Şantiye Adı': editSantiyeName,
          'Şantiye Cari Kodu': editSantiyeCariCode,
        }}
        oldCustomerData={{
          'Şantiye Adı': selectedSantiye?.['Şantiye Adı'] || '',
          'Şantiye Cari Kodu': selectedSantiye?.['Şantiye Cari Kodu'] || '',
        }}
        message={`Bu isimde veya cari kodda bir şantiye zaten var. 
          Çakışan şantiyeye ait ${conflictingSantiye?.puantajCount || 0} adet puantaj verisi bulunmaktadır. 
          Bu verileri yeni şantiyeye aktarmak ister misiniz?`}
        type="santiye"
      />

      <ConfirmUpdateModal
        isOpen={isConfirmUpdateOpen}
        onClose={cancelUpdate}
        updateChanges={updateChanges}
        confirmUpdate={confirmUpdate}
        cancelUpdate={cancelUpdate}
      />
    </>
  );
};

export default EditSantiyeModal;
