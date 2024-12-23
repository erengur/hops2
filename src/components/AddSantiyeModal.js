import React, { useState, useEffect, useCallback } from 'react';
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
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import CustomerSelectionTable from './CustomerSelectionTable';
import ConflictResolutionModal from './ConflictResolutionModal';

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
  maxHeight: '80vh',
  overflowY: 'auto',
  border: '1px solid #ccc',
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  marginLeft: theme.spacing(1),
  width: '30px',
  height: '30px',
}));

const AddSantiyeModal = ({
  isOpen,
  onClose,
  selectedCustomer,
  setCustomerShantiyeler,
  customerShantiyeler,
  setAlertOpen,
  setError,
  setSuccessMessage,
}) => {
  const [santiyeName, setSantiyeName] = useState('');
  const [santiyePhone, setSantiyePhone] = useState('');
  const [santiyeEmail, setSantiyeEmail] = useState('');
  const [santiyeCariCode, setSantiyeCariCode] = useState('');
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictingSantiye, setConflictingSantiye] = useState(null);
  const [isCustomerSelectionOpen, setIsCustomerSelectionOpen] = useState(false);
  const [pendingCustomers, setPendingCustomers] = useState([]);

  const generateCariCode = useCallback(async () => {
    const db = getFirestore();
    const mainFirmCariCode = selectedCustomer?.cariCode;

    if (!mainFirmCariCode) {
      setError('Ana firmanın cari kodu bulunamadı.');
      setAlertOpen(true);
      return;
    }

    try {
      // Mevcut şantiyeleri getir ve cari kodlarını analiz et
      const shantiyeListRef = collection(db, 'müşteri listesi');
      const shantiyeQuery = query(
        shantiyeListRef,
        where('parentId', '==', selectedCustomer.id)
      );
      const shantiyeSnapshot = await getDocs(shantiyeQuery);
      
      // Mevcut şantiye numaralarını topla
      const existingNumbers = shantiyeSnapshot.docs
        .map(doc => {
          const cariCode = doc.data()['Şantiye Cari Kodu'] || '';
          const number = cariCode.split('/').pop();
          return number ? parseInt(number, 10) : 0;
        })
        .filter(num => !isNaN(num));

      // Boşluk kontrolü yap
      let nextNumber = 1;
      existingNumbers.sort((a, b) => a - b); // Sırala

      // Sıralı numaralarda ilk boşluğu bul
      for (let i = 0; i < existingNumbers.length; i++) {
        if (existingNumbers[i] !== i + 1) {
          nextNumber = i + 1;
          break;
        }
        nextNumber = i + 2;
      }

      const generatedCode = `${mainFirmCariCode}/${nextNumber}`;
      console.log('Mevcut şantiye numaraları:', existingNumbers);
      console.log('Yeni şantiye kodu:', generatedCode);

      setSantiyeCariCode(generatedCode);
    } catch (error) {
      console.error('Şantiyeler alınırken hata oluştu:', error);
      setError('Şantiyeler alınırken bir hata oluştu.');
      setAlertOpen(true);
    }
  }, [selectedCustomer, setAlertOpen, setError]);

  useEffect(() => {
    if (isOpen) {
      generateCariCode();
    }
  }, [isOpen, generateCariCode]);

  const handleAddSantiye = async () => {
    if (!santiyeName.trim()) {
      setError('Şantiye adı gereklidir.');
      setAlertOpen(true);
      return;
    }

    if (!santiyeCariCode.trim()) {
      setError('Cari kod gereklidir.');
      setAlertOpen(true);
      return;
    }

    await checkConflictsAndAdd();
  };

  const checkConflictsAndAdd = async () => {
    const db = getFirestore();
    try {
      // Şantiye adı çakışmasını kontrol et
      const santiyeListRef = collection(db, 'müşteri listesi');
      const nameConflictQuery = query(
        santiyeListRef,
        where('Şantiye Adı', '==', santiyeName.trim()),
        where('__name__', '!=', selectedCustomer?.id || '')
      );

      const nameConflictSnapshot = await getDocs(nameConflictQuery);

      if (!nameConflictSnapshot.empty) {
        const conflictingSantiye = {
          ...nameConflictSnapshot.docs[0].data(),
          id: nameConflictSnapshot.docs[0].id
        };

        // Veri aktarma modalını göster
        setConflictingSantiye(conflictingSantiye);
        setIsConflictModalOpen(true);
        return;
      }

      await addSantiyeToFirestore();
    } catch (error) {
      console.error('Çakışma kontrolü sırasında hata:', error);
      setError(`Çakışma kontrolü sırasında bir hata oluştu: ${error.message}`);
      setAlertOpen(true);
    }
  };

  const addSantiyeToFirestore = async () => {
    const db = getFirestore();
    try {
      // Cari kodun doğru s��rada olduğunu kontrol et
      const currentNumber = parseInt(santiyeCariCode.split('/').pop(), 10);
      const shantiyeQuery = query(
        collection(db, 'müşteri listesi'),
        where('parentId', '==', selectedCustomer.id)
      );
      const shantiyeSnapshot = await getDocs(shantiyeQuery);
      
      const existingNumbers = shantiyeSnapshot.docs
        .map(doc => {
          const cariCode = doc.data()['Şantiye Cari Kodu'] || '';
          const number = cariCode.split('/').pop();
          return number ? parseInt(number, 10) : 0;
        })
        .filter(num => !isNaN(num));

      // Eğer bu numara zaten kullanıldıysa, yeni bir kod generate et
      if (existingNumbers.includes(currentNumber)) {
        await generateCariCode(); // Yeni kod generate et
        setError('Şantiye kodu çakışması tespit edildi. Yeni kod oluşturuldu.');
        setAlertOpen(true);
        return;
      }

      const santiyeData = {
        'Müşteri Adı': santiyeName.trim(),
        Telefon: santiyePhone.trim(),
        'E-posta': santiyeEmail.trim(),
        cariCode: santiyeCariCode.trim(),
        Şantiye: true,
        parentId: selectedCustomer.id,
        Onay: 'Onaylandı',
        'Şantiye Adı': santiyeName.trim(),
        'Şantiye Cari Kodu': santiyeCariCode.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Eğer seçilen müşteri onay bekleyen listesinden geldiyse, o kaydı güncelleyelim
      const selectedPendingCustomer = pendingCustomers.find(
        customer => customer['Müşteri Adı'] === santiyeName.trim()
      );

      let docRef;
      if (selectedPendingCustomer) {
        // Var olan müşteriyi güncelle
        docRef = doc(db, 'müşteri listesi', selectedPendingCustomer.id);
        await updateDoc(docRef, santiyeData);
      } else {
        // Yeni şantiye ekle
        docRef = await addDoc(collection(db, 'müşteri listesi'), santiyeData);
      }

      // Ana müşterinin şantiye sayısını güncelle
      const parentRef = doc(db, 'müşteri listesi', selectedCustomer.id);
      const parentDoc = await getDoc(parentRef);
      const currentCount = parentDoc.data()?.santiyeCount || 0;
      await updateDoc(parentRef, {
        santiyeCount: currentCount + 1,
        updatedAt: new Date().toISOString()
      });

      setCustomerShantiyeler([
        ...customerShantiyeler,
        {
          id: selectedPendingCustomer ? selectedPendingCustomer.id : docRef.id,
          ...santiyeData
        },
      ]);

      setSuccessMessage('Şantiye başarıyla eklendi.');
      setAlertOpen(true);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Şantiye eklenirken bir hata oluştu:', error);
      throw new Error('Şantiye eklenirken bir hata oluştu.');
    }
  };

  const resetForm = () => {
    setSantiyeName('');
    setSantiyePhone('');
    setSantiyeEmail('');
    // Cari kodu sıfırlamıyoruz, çünkü otomatik olarak oluşturuluyor
  };

  const handleSelectCustomer = (customer) => {
    setSantiyeName(customer['Müşteri Adı'] || '');
    setSantiyePhone(customer.Telefon || '');
    setSantiyeEmail(customer['E-posta'] || '');
    // Cari kodu seçilen müşteriden almıyoruz, otomatik oluşturulan kodu koruyoruz
    setIsCustomerSelectionOpen(false);
  };

  const fetchPendingCustomers = useCallback(async () => {
    const db = getFirestore();
    try {
      const customerListRef = collection(db, 'müşteri listesi');
      const pendingCustomersQuery = query(
        customerListRef,
        where('Onay', '==', 'Onay Bekliyor'),
      );
      const querySnapshot = await getDocs(pendingCustomersQuery);
      const customers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPendingCustomers(customers);
    } catch (error) {
      console.error('Pending customers could not be fetched:', error);
      setError('Onay bekleyen müşteriler getirilemedi.');
      setAlertOpen(true);
    }
  }, [setError, setAlertOpen]);

  const handleConflictResolution = async () => {
    setIsConflictModalOpen(false);
    const db = getFirestore();
    const batch = writeBatch(db);

    try {
      if (!conflictingSantiye || !conflictingSantiye.id) {
        throw new Error('Çakışan şantiye bilgisi eksik veya geçersiz.');
      }

      // Her iki şantiyenin puantajlarını al
      const puantajlarRef = collection(db, 'puantajlar');
      const puantajQuery = query(
        puantajlarRef,
        where('Müşteri Adı', '==', conflictingSantiye['Şantiye Adı'])
      );
      const puantajlarSnapshot = await getDocs(puantajQuery);

      // Yeni şantiye verilerini hazırla
      const newSantiyeData = {
        'Müşteri Adı': santiyeName.trim(),
        'Şantiye Adı': santiyeName.trim(),
        Telefon: santiyePhone.trim(),
        'E-posta': santiyeEmail.trim(),
        cariCode: santiyeCariCode.trim(),
        'Şantiye Cari Kodu': santiyeCariCode.trim(),
        Şantiye: true,
        parentId: selectedCustomer.id,
        Onay: 'Onaylandı',
        updatedAt: new Date().toISOString()
      };

      // Çakışan şantiyeyi güncelle
      const conflictingSantiyeRef = doc(db, 'müşteri listesi', conflictingSantiye.id);
      batch.update(conflictingSantiyeRef, newSantiyeData);

      // Tüm puantajları güncelle
      puantajlarSnapshot.forEach((puantajDoc) => {
        batch.update(puantajDoc.ref, {
          'Müşteri Adı': santiyeName.trim(),
          'Cari Kodu': santiyeCariCode.trim(),
        });
      });

      await batch.commit();

      setSuccessMessage('Şantiyeler başarıyla birleştirildi ve tüm veriler aktarıldı.');
      setAlertOpen(true);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Şantiye birleştirme sırasında hata oluştu:', error);
      setError(`Şantiye birleştirme sırasında bir hata oluştu: ${error.message}`);
      setAlertOpen(true);
    }
  };

  return (
    <>
      <Modal open={isOpen} onClose={onClose}>
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Yeni Şantiye Ekle
          </Typography>
          <Box display="flex" alignItems="center">
            <TextField
              label="Şantiye Adı"
              fullWidth
              margin="normal"
              value={santiyeName}
              onChange={(e) => setSantiyeName(e.target.value)}
            />
            <StyledIconButton
              onClick={async () => {
                const newState = !isCustomerSelectionOpen;
                setIsCustomerSelectionOpen(newState);
                if (newState) {
                  await fetchPendingCustomers();
                }
              }}
              size="small"
            >
              <ArrowDropDownIcon fontSize="small" />
            </StyledIconButton>
          </Box>
          {isCustomerSelectionOpen && (
            <CustomerSelectionTable
              customers={pendingCustomers}
              onSelectCustomer={handleSelectCustomer}
            />
          )}
          <TextField
            label="Telefon"
            fullWidth
            margin="normal"
            value={santiyePhone}
            onChange={(e) => setSantiyePhone(e.target.value)}
          />
          <TextField
            label="E-posta"
            fullWidth
            margin="normal"
            value={santiyeEmail}
            onChange={(e) => setSantiyeEmail(e.target.value)}
          />
          <TextField
            label="Cari Kodu"
            fullWidth
            margin="normal"
            value={santiyeCariCode}
            disabled
          />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddSantiye}
            >
              Ekle
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
          'Şantiye Adı': santiyeName,
          'Şantiye Cari Kodu': santiyeCariCode,
        }}
        message="Bu isimde bir şantiye zaten var. Mevcut şantiyeyi güncellemek ve verileri aktarmak ister misiniz?"
      />
    </>
  );
};

export default AddSantiyeModal;

