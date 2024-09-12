import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, getFirestore, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import './OperatorEkle.css';

const OperatorEkle = () => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [password, setPassword] = useState('');
  const [operators, setOperators] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editOperatorId, setEditOperatorId] = useState(null);

  const db = getFirestore();

  useEffect(() => {
    const fetchOperators = async () => {
      const operatorsCollection = collection(db, 'operatorListesi');
      const operatorSnapshot = await getDocs(operatorsCollection);
      const operatorList = operatorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOperators(operatorList);
    };

    fetchOperators();
  }, [db]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newOperator = { name, surname, password };

    try {
      if (isEditing) {
        const docRef = doc(db, 'operatorListesi', editOperatorId);
        await updateDoc(docRef, newOperator);
        setOperators(operators.map(op => (op.id === editOperatorId ? { ...op, ...newOperator } : op)));
        setIsEditing(false);
        setEditOperatorId(null);
      } else {
        const docRef = await addDoc(collection(db, 'operatorListesi'), newOperator);
        setOperators([...operators, { id: docRef.id, ...newOperator }]);
      }

      setName('');
      setSurname('');
      setPassword('');
    } catch (error) {
      console.error('Error adding/updating document: ', error);
    }
  };

  const handleEdit = (operator) => {
    setIsEditing(true);
    setEditOperatorId(operator.id);
    setName(operator.name);
    setSurname(operator.surname);
    setPassword(operator.password);
  };

  const handleDelete = async (operatorId) => {
    try {
      await deleteDoc(doc(db, 'operatorListesi', operatorId));
      setOperators(operators.filter(op => op.id !== operatorId));
    } catch (error) {
      console.error('Error deleting document: ', error);
    }
  };

  const handleSendApp = (operatorId) => {
    console.log(`Mobil uygulama ${operatorId} ID'li operatöre gönderildi.`);
  };

  return (
    <div className="operator-container">
      <h2>{isEditing ? 'Operatör Düzenle' : 'Operatör Ekle'}</h2>
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
          type="password"
          placeholder="Şifre (4 haneli)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="operator-input"
          pattern="\d{4}"
          title="Lütfen 4 haneli bir şifre giriniz"
          required
        />
        <button type="submit" className="operator-button">
          {isEditing ? 'Güncelle' : 'Operatör Ekle'}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setEditOperatorId(null);
              setName('');
              setSurname('');
              setPassword('');
            }}
            className="cancel-button"
          >
            İptal
          </button>
        )}
      </form>

      <ul className="operator-list">
        {operators.map((operator) => (
          <li key={operator.id} className="operator-item">
            <span>{operator.name} {operator.surname} - Şifre: {operator.password}</span>
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
              <button 
                onClick={() => handleSendApp(operator.id)} 
                className="send-app-button"
              >
                Mobil Uygulamayı Gönder
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OperatorEkle;