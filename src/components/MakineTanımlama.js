import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import './MakineTanımlama.css';

const MakineTanımlama = () => {
  const [machines, setMachines] = useState([]);
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachinePlate, setNewMachinePlate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchMachines();
  }, []);

  // Makine verilerini Firestore'dan çekme
  const fetchMachines = async () => {
    setLoading(true);
    const db = getFirestore();
    try {
      const machinesSnapshot = await getDocs(collection(db, 'makineListesi'));
      const machineData = machinesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMachines(machineData);
    } catch (error) {
      setError('Veriler alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Yeni makine ekleme
  const addMachine = async () => {
    if (!newMachineName || !newMachinePlate) {
      setError('Lütfen makine adı ve plaka giriniz.');
      return;
    }

    const db = getFirestore();
    try {
      await addDoc(collection(db, 'makineListesi'), {
        MakineAdı: newMachineName,
        MakinePlakası: newMachinePlate,
      });
      setNewMachineName('');
      setNewMachinePlate('');
      setSuccessMessage('Yeni makine başarıyla eklendi.');
      fetchMachines(); // Verileri yeniden yükle
    } catch (error) {
      setError('Makine eklenirken bir hata oluştu.');
    }
  };

  // Makine silme
  const deleteMachine = async (machineId) => {
    const db = getFirestore();
    try {
      await deleteDoc(doc(db, 'makineListesi', machineId));
      setSuccessMessage('Makine başarıyla silindi.');
      fetchMachines(); // Verileri yeniden yükle
    } catch (error) {
      setError('Makine silinirken bir hata oluştu.');
    }
  };

  return (
    <div className="makine-tanımlama-container">
      <h2>Makine Tanımlama</h2>

      {/* Makine Ekleme Formu */}
      <div className="add-machine-form">
        <h3>Yeni Makine Ekle</h3>
        <input
          type="text"
          placeholder="Makine Adı"
          value={newMachineName}
          onChange={(e) => setNewMachineName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Makine Plakası"
          value={newMachinePlate}
          onChange={(e) => setNewMachinePlate(e.target.value)}
        />
        <button onClick={addMachine}>Makine Ekle</button>
      </div>

      {/* Başarı veya Hata Mesajı */}
      {successMessage && <p className="success-message">{successMessage}</p>}
      {error && <p className="error-message">{error}</p>}

      {/* Makine Listesi */}
      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <table className="machine-table">
          <thead>
            <tr>
              <th>Makine Adı</th>
              <th>Makine Plakası</th>
              <th>Sil</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((machine) => (
              <tr key={machine.id}>
                <td>{machine.MakineAdı}</td>
                <td>{machine.MakinePlakası}</td>
                <td>
                  <button onClick={() => deleteMachine(machine.id)}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MakineTanımlama;
