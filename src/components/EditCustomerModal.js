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
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  deleteDoc,
  addDoc,
  getDoc,
} from 'firebase/firestore';

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
  const [selectedParentCustomer, setSelectedParentCustomer] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  useEffect(() => {
    if (selectedCustomer) {
      setEditName(selectedCustomer['Müşteri Adı'] || '');
      setEditPhone(selectedCustomer['Telefon'] || '');
      setEditEmail(selectedCustomer['E-posta'] || '');
      setEditCariCode(selectedCustomer['cariCode'] || '');
      const shantiyeler = approvedCustomers.filter(
        (cust) => cust.parentId === selectedCustomer.id
      );
      setCustomerShantiyeler(shantiyeler);
    }
  }, [selectedCustomer, approvedCustomers]);

  useEffect(() => {
    const fetchAllCustomers = async () => {
      const db = getFirestore();
      const customersRef = collection(db, 'müşteri listesi');
      const customersSnapshot = await getDocs(customersRef);
      const customersData = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllCustomers(customersData);
    };

    fetchAllCustomers();
  }, []);

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
      const customerListRef = collection(db, 'müşteri listesi');
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

  const proceedWithUpdate = () => {
    const changes = [];

    if ((editName || '').trim() !== (selectedCustomer['Müşteri Adı'] || '').trim()) {
      changes.push({
        field: 'Müşteri Adı',
        old: selectedCustomer['Müşteri Adı'] || '',
        new: (editName || '').trim(),
      });
    }
    if ((editPhone || '').trim() !== (selectedCustomer['Telefon'] || '').trim()) {
      changes.push({
        field: 'Telefon',
        old: selectedCustomer['Telefon'] || '',
        new: (editPhone || '').trim(),
      });
    }
    if ((editEmail || '').trim() !== (selectedCustomer['E-posta'] || '').trim()) {
      changes.push({
        field: 'E-posta',
        old: selectedCustomer['E-posta'] || '',
        new: (editEmail || '').trim(),
      });
    }
    if ((editCariCode || '').trim() !== (selectedCustomer.cariCode || '').trim()) {
      changes.push({
        field: 'Cari Kodu',
        old: selectedCustomer.cariCode || '',
        new: (editCariCode || '').trim(),
      });
    }

    setUpdateChanges(changes);
    setIsConfirmUpdateOpen(true);
  };

  const confirmUpdate = async () => {
    setIsConfirmUpdateOpen(false);

    const db = getFirestore();
    try {
      const oldCustomerName = (selectedCustomer['Müşteri Adı'] || '').trim();
      const oldCariCode = (selectedCustomer.cariCode || '').trim();

      const customerRef = doc(db, 'müşteri listesi', selectedCustomer.id);
      await updateDoc(customerRef, {
        'Müşteri Adı': editName.trim(),
        Telefon: editPhone.trim(),
        'E-posta': editEmail.trim(),
        cariCode: editCariCode.trim(),
        Onay: 'Onaylandı',
      });

      const batch = writeBatch(db);

      // İlgili Puantajları Güncelle
      const puantajlarRef = collection(db, 'puantajlar');
      const puantajQuery = query(
        puantajlarRef,
        where('Müşteri Adı', '==', oldCustomerName)
      );
      const puantajlarSnapshot = await getDocs(puantajQuery);

      puantajlarSnapshot.forEach((puantajDoc) => {
        batch.update(puantajDoc.ref, {
          'Müşteri Adı': editName.trim(),
          'Cari Kodu': editCariCode.trim(),
        });
      });

      await batch.commit();

      setSuccessMessage('Müşteri başarıyla güncellendi.');
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
      await deleteDoc(doc(db, 'müşteri listesi', conflictingCustomer.id));
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

  const handleAddAsSantiye = async (parentCustomer) => {
    setIsAddAsSantiyeModalOpen(false);
    setSelectedParentCustomer(null);

    if (!selectedCustomer || !parentCustomer) {
      setError('Müşteri bilgileri eksik.');
      setAlertOpen(true);
      return;
    }

    const db = getFirestore();
    try {
      // Ana müşterinin mevcut şantiye sayısını al
      const parentCustomerDoc = await getDoc(doc(db, 'müşteri listesi', parentCustomer.id));
      const parentCustomerData = parentCustomerDoc.data();
      const currentSantiyeCount = parentCustomerData.santiyeCount || 0;

      // Yeni şantiye verilerini hazırla
      const newSantiyeData = {
        'Müşteri Adı': selectedCustomer['Müşteri Adı'] || '',
        Telefon: selectedCustomer['Telefon'] || '',
        'E-posta': selectedCustomer['E-posta'] || '',
        cariCode: `${parentCustomer.cariCode}/${currentSantiyeCount + 1}`,
        Şantiye: selectedCustomer['Şantiye'] || true,
        parentId: parentCustomer.id,
        Onay: 'Onaylandı',
        'Şantiye Adı': selectedCustomer['Müşteri Adı'] || '',
        'Şantiye Cari Kodu': `${parentCustomer.cariCode}/${currentSantiyeCount + 1}`,
      };

      // Boş string değerleri undefined olarak değiştir
      Object.keys(newSantiyeData).forEach(key => {
        if (newSantiyeData[key] === '') {
          newSantiyeData[key] = null;
        }
      });

      // Yeni şantiye ekle
      await addDoc(collection(db, 'müşteri listesi'), newSantiyeData);

      // Ana müşterinin şantiye sayısını güncelle
      await updateDoc(doc(db, 'müşteri listesi', parentCustomer.id), {
        santiyeCount: currentSantiyeCount + 1,
      });

      // Orijinal müşteri belgesini sil
      await deleteDoc(doc(db, 'müşteri listesi', selectedCustomer.id));

      setSuccessMessage('Müşteri başarıyla şantiye olarak eklendi.');
      setAlertOpen(true);
      onClose();
    } catch (error) {
      console.error('Şantiye olarak eklenirken bir hata oluştu:', error);
      setError(`Şantiye olarak eklenirken bir hata oluştu: ${error.message}`);
      setAlertOpen(true);
    }
  };

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

  return (
    <>
      <Modal open={isOpen} onClose={onClose}>
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
      />

      <Modal open={isAddAsSantiyeModalOpen} onClose={() => setIsAddAsSantiyeModalOpen(false)}>
        <ModalBox>
          <Typography variant="h6" gutterBottom>
            Şantiye Olarak Ekle
          </Typography>
          <Typography variant="body1" gutterBottom>
            Lütfen bu müşteriyi şantiye olarak eklemek istediğiniz ana müşteriyi seçin:
          </Typography>
          <CustomerSelectionTable
            customers={allCustomers.filter(c => c.Onay === 'Onaylandı' && !c.parentId)}
            onSelectCustomer={(customer) => handleAddAsSantiye(customer)}
            includeSpecialCases={true}
          />
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