import React, { useState, useEffect } from 'react';
import {
  Modal,
  Typography,
  TextField,
  Box,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  deleteDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { auth } from './firebaseConfig';

import AddSantiyeModal from './AddSantiyeModal';
import EditSantiyeModal from './EditSantiyeModal';
import DeleteSantiyeModal from './DeleteSantiyeModal';
import ConfirmUpdateModal from './ConfirmUpdateModal';
import ConflictResolutionModal from './ConflictResolutionModal';
import CustomerSelectionTable from './CustomerSelectionTable';

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
  return str ? str.trim().replace(/\s+/g, ' ') : '';
};

const EditCustomerModal = ({
  isOpen,
  onClose,
  selectedCustomer,
  setSelectedCustomer,
  approvedCustomers,
  setAlertOpen,
  setError,
  setSuccessMessage,
}) => {
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCariCode, setEditCariCode] = useState('');
  const [customerShantiyeler, setCustomerShantiyeler] = useState([]);
  const [updateChanges, setUpdateChanges] = useState([]);
  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictingCustomer, setConflictingCustomer] = useState(null);
  const [isAddSantiyeModalOpen, setIsAddSantiyeModalOpen] = useState(false);
  const [isEditSantiyeModalOpen, setIsEditSantiyeModalOpen] = useState(false);
  const [isDeleteSantiyeModalOpen, setIsDeleteSantiyeModalOpen] = useState(false);
  const [selectedSantiye, setSelectedSantiye] = useState(null);
  const [isCustomerSelectionOpen, setIsCustomerSelectionOpen] = useState(false);
  const [isAddAsSantiyeModalOpen, setIsAddAsSantiyeModalOpen] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [selectedParentCustomer, setSelectedParentCustomer] = useState(null);

  // Eski müşteri verilerini tutan state
  const [oldCustomerData, setOldCustomerData] = useState(null);

  useEffect(() => {
    if (selectedCustomer) {
      // Modal ilk açıldığında orijinal verileri kaydet
      setOldCustomerData({
        'Müşteri Adı': selectedCustomer['Müşteri Adı'] || '',
        'cariCode': selectedCustomer['cariCode'] || ''
      });

      setEditName(selectedCustomer['Müşteri Adı'] || '');
      setEditPhone(selectedCustomer['Telefon'] || '');
      setEditEmail(selectedCustomer['E-posta'] || '');
      setEditCariCode(selectedCustomer['cariCode'] || '');

      const db = getFirestore();
      const santiyeQuery = query(
        collection(db, `users/${auth.currentUser?.email}/customerList`),
        where('parentId', '==', selectedCustomer.id)
      );

      getDocs(santiyeQuery)
        .then((snapshot) => {
          const santiyeler = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCustomerShantiyeler(santiyeler);
        })
        .catch((error) => {
          console.error('Şantiyeler getirilirken hata:', error);
          setError('Şantiyeler getirilirken bir hata oluştu.');
          setAlertOpen(true);
        });
    }
  }, [selectedCustomer, setError, setAlertOpen]);

  useEffect(() => {
    const fetchAllCustomers = async () => {
      const db = getFirestore();
      const customersRef = collection(db, `users/${auth.currentUser?.email}/customerList`);
      const customersSnapshot = await getDocs(customersRef);
      const customersData = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllCustomers(customersData);
    };

    fetchAllCustomers();
  }, []);

  useEffect(() => {
    const fetchApprovedCustomers = async () => {
      const db = getFirestore();
      const customersRef = collection(db, `users/${auth.currentUser?.email}/customerList`);
      const q = query(
        customersRef,
        where('Onay', '==', 'Onaylandı')
      );

      try {
        const snapshot = await getDocs(q);
        const approvedData = snapshot.docs.map(doc => ({
          id: doc.id,
          'Müşteri Adı': doc.data()['Müşteri Adı'] || '',
          'Onay': doc.data()['Onay'] || '',
          'cariCode': doc.data()['cariCode'] || '',
          'Şantiye': doc.data()['Şantiye'] || false,
          'parentId': doc.data().parentId || null,
        }));
        setAllCustomers(approvedData);
        console.log('Onaylanmış müşteriler:', approvedData);
      } catch (error) {
        console.error('Müşteriler getirilirken hata:', error);
      }
    };

    fetchApprovedCustomers();
  }, []);

  const handleCloseModal = () => {
    // Modal kapanırken değişiklikleri geri al
    if (oldCustomerData && selectedCustomer) {
      // Form alanlarını eski değerlere döndür
      setEditName(oldCustomerData['Müşteri Adı'] || '');
      setEditCariCode(oldCustomerData['cariCode'] || '');
      setEditPhone(selectedCustomer['Telefon'] || '');
      setEditEmail(selectedCustomer['E-posta'] || '');
    }
    onClose();
  };

  const handleUpdateCustomer = async () => {
    if (!editName.trim()) {
      setError('Müşteri adı gereklidir.');
      setAlertOpen(true);
      return;
    }

    if (!editCariCode.trim()) {
      setIsWarningModalOpen(true);
      return;
    }

    await checkConflictsAndUpdate();
  };

  const checkConflictsAndUpdate = async () => {
    const db = getFirestore();

    try {
      const customerListRef = collection(db, `users/${auth.currentUser?.email}/customerList`);
      const nameConflictQuery = query(
        customerListRef,
        where('Müşteri Adı', '==', editName.trim()),
        where('__name__', '!=', selectedCustomer.id)
      );
      const cariCodeConflictQuery = query(
        customerListRef,
        where('cariCode', '==', editCariCode.trim()),
        where('__name__', '!=', selectedCustomer.id)
      );

      const [nameConflictSnapshot, cariCodeConflictSnapshot] = await Promise.all([
        getDocs(nameConflictQuery),
        getDocs(cariCodeConflictQuery),
      ]);

      if (!nameConflictSnapshot.empty || !cariCodeConflictSnapshot.empty) {
        const conflictingDoc = !nameConflictSnapshot.empty
          ? nameConflictSnapshot.docs[0]
          : cariCodeConflictSnapshot.docs[0];

        setConflictingCustomer({ ...conflictingDoc.data(), id: conflictingDoc.id });
        setIsConflictModalOpen(true);
        return;
      }

      proceedWithUpdate();
    } catch (error) {
      console.error('Çakışma kontrolü sırasında hata:', error);
      setError(`Çakışma kontrolü sırasında bir hata oluştu: ${error.message}`);
      setAlertOpen(true);
    }
  };

  const proceedWithUpdate = async () => {
    const changes = [];
    const db = getFirestore();
    const batch = writeBatch(db);

    // Müşteri bilgilerini güncelle
    const customerRef = doc(db, `users/${auth.currentUser?.email}/customerList`, selectedCustomer.id);
    batch.update(customerRef, {
      'Müşteri Adı': editName,
      'Telefon': editPhone,
      'E-posta': editEmail,
      'cariCode': editCariCode,
      'updatedAt': new Date().toISOString()
    });

    // İlgili puantajları güncelle
    const puantajlarRef = collection(db, 'puantajlar');
    const puantajQuery = query(
      puantajlarRef,
      where('Müşteri Adı', '==', selectedCustomer['Müşteri Adı'])
    );
    
    const puantajSnapshot = await getDocs(puantajQuery);
    puantajSnapshot.forEach((puantajDoc) => {
      batch.update(puantajDoc.ref, {
        'Müşteri Adı': editName,
        'Cari Kodu': editCariCode
      });
    });

    // Tüm güncellemeleri tek seferde gerçekleştir
    await batch.commit();

    setSuccessMessage('Müşteri ve ilgili puantaj verileri başarıyla güncellendi.');
    setAlertOpen(true);
    onClose();
  };

  const confirmUpdate = async () => {
    setIsConfirmUpdateOpen(false);
    const db = getFirestore();
    const batch = writeBatch(db);

    try {
      // Eğer şantiye ise ve şantiye adı varsa kullan, yoksa müşteri adını kullan
      const oldSantiyeName = selectedSantiye 
        ? normalizeString(selectedSantiye['Şantiye Adı']) 
        : normalizeString(selectedCustomer['Müşteri Adı']);

      // Ana müşteriyi güncelle
      const customerRef = doc(db, `users/${auth.currentUser?.email}/customerList`, selectedCustomer.id);
      batch.update(customerRef, {
        'Müşteri Adı': editName.trim(),
        Telefon: editPhone.trim(),
        'E-posta': editEmail.trim(),
        cariCode: editCariCode.trim(),
        Onay: 'Onaylandı',
      });

      // İlgili Puantajları Güncelle
      const puantajlarRef = collection(db, 'puantajlar');
      const puantajQuery = query(
        puantajlarRef,
        where('Müşteri Adı', '==', oldSantiyeName)
      );
      const puantajlarSnapshot = await getDocs(puantajQuery);

      puantajlarSnapshot.forEach((puantajDoc) => {
        batch.update(puantajDoc.ref, {
          'Müşteri Adı': editName.trim(),
          'Cari Kodu': editCariCode.trim(),
        });
      });

      // Şantiyeleri güncelle (eğer ana müşteriyse)
      if (selectedCustomer.cariCode !== editCariCode.trim()) {
        const santiyeQuery = query(
          collection(db, `users/${auth.currentUser?.email}/customerList`),
          where('parentId', '==', selectedCustomer.id)
        );
        const santiyeSnapshot = await getDocs(santiyeQuery);

        santiyeSnapshot.forEach((santiyeDoc) => {
          const santiyeData = santiyeDoc.data();
          const oldSantiyeCariCode = santiyeData['Şantiye Cari Kodu'];
          const santiyeNumber = oldSantiyeCariCode?.split('/')?.pop() || '';
          const newSantiyeCariCode = santiyeNumber ? `${editCariCode.trim()}/${santiyeNumber}` : editCariCode.trim();

          batch.update(santiyeDoc.ref, {
            'Şantiye Cari Kodu': newSantiyeCariCode,
            cariCode: newSantiyeCariCode,
          });
        });

        // Şantiyelere ait puantajları güncelle
        for (const santiyeDoc of santiyeSnapshot.docs) {
          const santiyeData = santiyeDoc.data();
          const santiyePuantajQuery = query(
            puantajlarRef,
            where('Müşteri Adı', '==', santiyeData['Müşteri Adı'])
          );
          const santiyePuantajSnapshot = await getDocs(santiyePuantajQuery);

          santiyePuantajSnapshot.forEach((puantajDoc) => {
            const newSantiyeCariCode = `${editCariCode.trim()}/${santiyeData['Şantiye Cari Kodu']?.split('/')?.pop() || ''}`;
            batch.update(puantajDoc.ref, {
              'Cari Kodu': newSantiyeCariCode,
            });
          });
        }
      }

      // Tüm değişiklikleri commit et
      await batch.commit();

      setSuccessMessage('Müşteri ve ilgili şantiyeler başarıyla güncellendi.');
      setAlertOpen(true);
      onClose();
      setSelectedCustomer(null);
      setUpdateChanges([]);
    } catch (error) {
      console.error('Müşteri güncellenirken bir hata oluştu:', error);
      setError(`Müşteri güncellenirken bir hata oluştu: ${error.message}`);
      setAlertOpen(true);
    }
  };

  const handleConflictResolution = async () => {
    setIsConflictModalOpen(false);

    const db = getFirestore();
    try {
      if (!conflictingCustomer || !conflictingCustomer.id) {
        throw new Error('Çakışan müşteri bilgisi eksik veya geçersiz.');
      }

      // Çakışan müşteriyi sil
      await deleteDoc(doc(db, `users/${auth.currentUser?.email}/customerList`, conflictingCustomer.id));
      console.log(`Çakışan müşteri silindi: ${conflictingCustomer['Müşteri Adı']}`);

      // Güncellemeye devam et
      await confirmUpdate();

      setSuccessMessage('Çakışan müşteri silindi ve güncelleme yapıldı.');
      setAlertOpen(true);
    } catch (error) {
      console.error('Çakışma çözümlenirken hata oluştu:', error);
      setError(`Çakışma çözümlenirken bir hata oluştu: ${error.message}`);
      setAlertOpen(true);
    }
  };

  const cancelUpdate = () => {
    setIsConfirmUpdateOpen(false);
    setUpdateChanges([]);
  };

  const openAddSantiyeModal = () => {
    setIsAddSantiyeModalOpen(true);
  };

  const openEditSantiyeModal = (santiye) => {
    setSelectedSantiye(santiye);
    setIsEditSantiyeModalOpen(true);
  };

  const openDeleteSantiyeModal = (santiye) => {
    setSelectedSantiye(santiye);
    setIsDeleteSantiyeModalOpen(true);
  };

  const handleSelectCustomer = (customer) => {
    setEditName(customer['Müşteri Adı']);
    setEditPhone(customer['Telefon'] || '');
    setEditEmail(customer['E-posta'] || '');
    setEditCariCode(customer.cariCode);
    setIsCustomerSelectionOpen(false);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedParentCustomer(customer);
  };

  const handleAddAsSantiye = async () => {
    if (!editName.trim() || !selectedParentCustomer) {
      setError('Lütfen şantiye adını girin ve ana müşteriyi seçin.');
      setAlertOpen(true);
      return;
    }

    const db = getFirestore();
    try {
      // Ana müşterinin mevcut şantiyelerini getir
      const shantiyeQuery = query(
        collection(db, `users/${auth.currentUser?.email}/customerList`),
        where('parentId', '==', selectedParentCustomer.id)
      );
      const shantiyeSnapshot = await getDocs(shantiyeQuery);

      // Yeni şantiye numarası hesapla
      const existingNumbers = shantiyeSnapshot.docs
        .map(doc => {
          const cariCode = doc.data()['Şantiye Cari Kodu'] || '';
          const number = cariCode.split('/').pop();
          return number ? parseInt(number, 10) : 0;
        })
        .filter(num => !isNaN(num));

      let nextNumber = 1;
      existingNumbers.sort((a, b) => a - b);
      for (let i = 0; i < existingNumbers.length; i++) {
        if (existingNumbers[i] !== i + 1) {
          nextNumber = i + 1;
          break;
        }
        nextNumber = i + 2;
      }

      const newCariCode = `${selectedParentCustomer.cariCode}/${nextNumber}`;

      // Şantiye olarak güncelle
      await updateDoc(doc(db, `users/${auth.currentUser?.email}/customerList`, selectedCustomer.id), {
        'Şantiye Adı': editName.trim(),
        'Müşteri Adı': editName.trim(),
        'Şantiye': true,
        'parentId': selectedParentCustomer.id,
        'Şantiye Cari Kodu': newCariCode,
        'cariCode': newCariCode,
        'Onay': 'Onaylandı',
        'updatedAt': new Date().toISOString()
      });

      // Ana müşterinin şantiye sayısını güncelle
      await updateDoc(doc(db, `users/${auth.currentUser?.email}/customerList`, selectedParentCustomer.id), {
        santiyeCount: increment(1),
        updatedAt: new Date().toISOString()
      });

      setSuccessMessage('Müşteri başarıyla şantiye olarak eklendi.');
      setAlertOpen(true);
      setIsAddAsSantiyeModalOpen(false);
      onClose();
    } catch (error) {
      console.error('Şantiye eklenirken hata:', error);
      setError('Şantiye eklenirken bir hata oluştu.');
      setAlertOpen(true);
    }
  };

  // Aynı isimdeki diğer kayıtları silen yardımcı fonksiyon
  async function removeDuplicateCustomers(db, customerName, excludeId) {
    try {
      const customerListRef = collection(db, `users/${auth.currentUser?.email}/customerList`);
      const q = query(customerListRef, where('Müşteri Adı', '==', customerName));
      const querySnapshot = await getDocs(q);
  
      // Aynı isme sahip dökümanlardan güncellenen hariç diğerlerini sil
      for (const docSnap of querySnapshot.docs) {
        if (docSnap.id !== excludeId) {
          console.log(`Siliniyor (aynı isimli diğer kayıt): ${docSnap.id}, Adı: ${customerName}`);
          await deleteDoc(doc(db, `users/${auth.currentUser?.email}/customerList`, docSnap.id));
        }
      }
    } catch (err) {
      console.error('Aynı isimli veriler silinirken hata oluştu:', err);
    }
  }
  
  

  const handleWarningModalClose = () => {
    setIsWarningModalOpen(false);
  };

  const handleCariCodeSubmit = async () => {
    if (!editCariCode.trim()) {
      setError('Cari kodu gereklidir.');
      setAlertOpen(true);
      return;
    }

    setIsWarningModalOpen(false);
    await checkConflictsAndUpdate();
  };

  // AddAsSantiye modal içeriği
  const AddAsSantiyeContent = () => (
    <>
      <Typography variant="h6" gutterBottom>
        Şantiye Olarak Ekle
      </Typography>

      <TextField
        label="Şantiye Adı"
        fullWidth
        margin="normal"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
      />

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
        Ana Müşteriyi Seçin:
      </Typography>

      <Box sx={{ maxHeight: '400px', overflow: 'auto', mt: 1 }}>
        <CustomerSelectionTable
          customers={allCustomers.filter(customer => 
            customer['Onay'] === 'Onaylandı' && !customer['Şantiye']
          )}
          onSelectCustomer={handleCustomerSelect}
          selectedId={selectedParentCustomer?.id}
        />
      </Box>

      {selectedParentCustomer && (
        <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
          Seçilen Müşteri: {selectedParentCustomer['Müşteri Adı']}
        </Typography>
      )}

      <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
        <Button variant="outlined" onClick={() => setIsAddAsSantiyeModalOpen(false)}>
          İptal
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddAsSantiye}
          disabled={!editName.trim() || !selectedParentCustomer}
        >
          Şantiye Olarak Ekle
        </Button>
      </Box>
    </>
  );

  return (
    <>
      <Modal open={isOpen} onClose={handleCloseModal}>
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Müşteri Düzenle
          </Typography>
          <Box display="flex" alignItems="center">
            <TextField
              label="Müşteri Adı"
              fullWidth
              margin="normal"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
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
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />
          <TextField
            label="E-posta"
            fullWidth
            margin="normal"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
          />
          <TextField
            label="Cari Kodu"
            fullWidth
            margin="normal"
            value={editCariCode}
            onChange={(e) => setEditCariCode(e.target.value)}
          />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateCustomer}
            >
              Güncelle
            </Button>
          </Box>

          <Typography variant="h6" gutterBottom style={{ marginTop: '20px' }}>
            Şantiyeler
          </Typography>
          {selectedCustomer && selectedCustomer.Onay === 'Onay Bekliyor' && (
            <Button
              variant="contained"
              onClick={() => setIsAddAsSantiyeModalOpen(true)}
              style={{ marginBottom: '10px' }}
            >
              Şantiye Olarak Ekle
            </Button>
          )}
          {selectedCustomer && selectedCustomer.Onay === 'Onaylandı' && (
            <Button
              variant="contained"
              onClick={openAddSantiyeModal}
              style={{ marginBottom: '10px' }}
            >
              Yeni Şantiye Ekle
            </Button>
          )}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Şantiye Adı</TableCell>
                  <TableCell>Telefon</TableCell>
                  <TableCell>E-posta</TableCell>
                  <TableCell>Cari Kodu</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customerShantiyeler.map((santiye) => (
                  <TableRow key={santiye.id}>
                    <TableCell>{santiye['Müşteri Adı']}</TableCell>
                    <TableCell>{santiye['Telefon']}</TableCell>
                    <TableCell>{santiye['E-posta']}</TableCell>
                    <TableCell>{santiye['cariCode']}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => openEditSantiyeModal(santiye)}
                      >
                        Düzenle
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => openDeleteSantiyeModal(santiye)}
                        style={{ marginLeft: '10px' }}
                      >
                        Sil
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </ModalBox>
      </Modal>

      <AddSantiyeModal
        isOpen={isAddSantiyeModalOpen}
        onClose={() => setIsAddSantiyeModalOpen(false)}
        selectedCustomer={selectedCustomer}
        setCustomerShantiyeler={setCustomerShantiyeler}
        customerShantiyeler={customerShantiyeler}
        setAlertOpen={setAlertOpen}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
      />
      <EditSantiyeModal
        isOpen={isEditSantiyeModalOpen}
        onClose={() => setIsEditSantiyeModalOpen(false)}
        selectedSantiye={selectedSantiye}
        setCustomerShantiyeler={setCustomerShantiyeler}
        customerShantiyeler={customerShantiyeler}
        approvedCustomers={approvedCustomers}
        setAlertOpen={setAlertOpen}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
      />
      <DeleteSantiyeModal
        isOpen={isDeleteSantiyeModalOpen}
        onClose={() => setIsDeleteSantiyeModalOpen(false)}
        selectedSantiye={selectedSantiye}
        setCustomerShantiyeler={setCustomerShantiyeler}
        customerShantiyeler={customerShantiyeler}
        setAlertOpen={setAlertOpen}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
      />

      <ConfirmUpdateModal
        isOpen={isConfirmUpdateOpen}
        onClose={cancelUpdate}
        updateChanges={updateChanges}
        confirmUpdate={confirmUpdate}
        cancelUpdate={cancelUpdate}
      />

      <ConflictResolutionModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        onConfirm={handleConflictResolution}
        conflictingCustomer={conflictingCustomer}
        newCustomerData={{
          'Müşteri Adı': editName,
          'cariCode': editCariCode,
        }}
        oldCustomerData={oldCustomerData}
      />

      <Modal open={isAddAsSantiyeModalOpen} onClose={() => setIsAddAsSantiyeModalOpen(false)}>
        <ModalBox>
          <AddAsSantiyeContent />
        </ModalBox>
      </Modal>

      <Modal open={isWarningModalOpen} onClose={handleWarningModalClose}>
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Uyarı: Cari Kodu Eksik
          </Typography>
          <Typography variant="body1" gutterBottom>
            Cari kodu eklemediniz. Lütfen ekleyin.
          </Typography>
          <Box display="flex" alignItems="center" mt={2}>
            <Typography variant="body2" style={{ marginRight: '10px', flexGrow: 1 }}>
              {editName} - {editPhone}
            </Typography>
            <TextField
              label="Cari Kodu"
              value={editCariCode}
              onChange={(e) => setEditCariCode(e.target.value)}
              style={{ width: '150px' }}
            />
          </Box>
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button variant="contained" color="primary" onClick={handleCariCodeSubmit}>
              Kaydet
            </Button>
          </Box>
        </ModalBox>
      </Modal>
    </>
  );
};

export default EditCustomerModal;
