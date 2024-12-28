import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, getFirestore, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import './OperatorEkle.css';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { auth } from './firebaseConfig';

const formatPhoneDisplay = (value) => {
  if (!value.startsWith('+90')) {
    value = '+90' + value.slice(3);
  }
  
  const numbers = value.slice(3).replace(/\D/g, '');
  
  if (numbers.length <= 10) {
    let formatted = '+90';
    if (numbers.length > 0) formatted += '(' + numbers.slice(0, 3);
    if (numbers.length > 3) formatted += ') ' + numbers.slice(3, 6);
    if (numbers.length > 6) formatted += ' ' + numbers.slice(6, 8);
    if (numbers.length > 8) formatted += ' ' + numbers.slice(8, 10);
    return formatted;
  }
  return value;
};

const cleanPhoneNumber = (phone) => {
  return '+90' + phone.replace(/\D/g, '').slice(-10);
};

const EditOperatorModal = ({ open, onClose, operator, onSave }) => {
  const [name, setName] = useState(operator?.name || '');
  const [surname, setSurname] = useState(operator?.surname || '');
  const [phoneNumber, setPhoneNumber] = useState(operator?.phoneNumber || '+90');

  useEffect(() => {
    if (operator) {
      setName(operator.name);
      setSurname(operator.surname);
      setPhoneNumber(operator.phoneNumber || '+90');
    }
  }, [operator]);

  const handleSubmit = () => {
    onSave({ 
      name, 
      surname, 
      phoneNumber: cleanPhoneNumber(phoneNumber),
      phoneNumberDisplay: phoneNumber
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Operatör Düzenle</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Ad"
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          margin="dense"
          label="Soyad"
          type="text"
          fullWidth
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
          required
        />
        <TextField
          margin="dense"
          label="Telefon"
          type="tel"
          fullWidth
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(formatPhoneDisplay(e.target.value))}
          required
          inputProps={{
            pattern: "\\+90\\([0-9]{3}\\) [0-9]{3} [0-9]{2} [0-9]{2}",
          }}
          helperText="Format: +90(5XX) XXX XX XX"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          İptal
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const OperatorEkle = () => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [operators, setOperators] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editOperatorId, setEditOperatorId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState(null);

  const db = getFirestore();

  useEffect(() => {
    const fetchOperators = async () => {
      const operatorsCollection = collection(db, `users/${auth.currentUser?.email}/operators`);
      const operatorSnapshot = await getDocs(operatorsCollection);
      const operatorList = operatorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOperators(operatorList);
    };

    fetchOperators();
  }, [db]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newOperator = { 
      name, 
      surname, 
      phoneNumber: cleanPhoneNumber(phoneNumber),
      phoneNumberDisplay: phoneNumber
    };

    try {
      const docRef = await addDoc(collection(db, `users/${auth.currentUser?.email}/operators`), newOperator);
      setOperators([...operators, { id: docRef.id, ...newOperator }]);
      
      setName('');
      setSurname('');
      setPhoneNumber('');
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  const handleEdit = (operator) => {
    setSelectedOperator(operator);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedOperator) => {
    try {
      const docRef = doc(db, 'operatorListesi', selectedOperator.id);
      await updateDoc(docRef, updatedOperator);
      setOperators(operators.map(op => 
        op.id === selectedOperator.id ? { ...op, ...updatedOperator } : op
      ));
      setIsEditModalOpen(false);
      setSelectedOperator(null);
    } catch (error) {
      console.error('Error updating operator: ', error);
    }
  };

  const handleDelete = async (operatorId) => {
    try {
      await deleteDoc(doc(db, 'operatorListesi', operatorId));
      setOperators(operators.filter(op => op.id !== operatorId));
    } catch (error) {
      console.error('Error deleting document: ', error);
    }
  };

  return (
    <div className="operator-container">
      <h2>Operatör Ekle</h2>
      <form onSubmit={handleSubmit} className="operator-form">
        <input
          type="text"
          placeholder="Ad"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="operator-input"
          required
        />
        <input
          type="text"
          placeholder="Soyad"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
          className="operator-input"
          required
        />
        <input
          type="tel"
          placeholder="+90(5XX) XXX XX XX"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(formatPhoneDisplay(e.target.value))}
          className="operator-input"
          pattern="\+90\([0-9]{3}\) [0-9]{3} [0-9]{2} [0-9]{2}"
          title="Lütfen geçerli bir telefon numarası giriniz: +90(5XX) XXX XX XX"
          required
        />
        <button type="submit" className="operator-button">
          Operatör Ekle
        </button>
      </form>

      <ul className="operator-list">
        {operators.map((operator) => (
          <li key={operator.id} className="operator-item">
            <span>
              {operator.name} {operator.surname}
              {operator.phoneNumber && ` - Tel: ${operator.phoneNumberDisplay || operator.phoneNumber}`}
            </span>
            <div className="button-group">
              <button 
                onClick={() => handleEdit(operator)} 
                className="edit-button"
              >
                Düzenle
              </button>
              <button 
                onClick={() => handleDelete(operator.id)} 
                className="delete-button"
              >
                Sil
              </button>
            </div>
          </li>
        ))}
      </ul>

      <EditOperatorModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedOperator(null);
        }}
        operator={selectedOperator}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default OperatorEkle;