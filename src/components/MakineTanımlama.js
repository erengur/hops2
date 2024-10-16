import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import './MakineTanımlama.css';

const MakineTanımlama = () => {
  const [machines, setMachines] = useState([]);
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachinePlate, setNewMachinePlate] = useState('');
  const [newMachinePrice, setNewMachinePrice] = useState(''); // New State for Birim Fiyat
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingMachine, setEditingMachine] = useState(null);

  useEffect(() => {
    fetchMachines();
  }, []);

  // Fetch machine data from Firestore
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

  // Add new machine
  const addMachine = async () => {
    if (!newMachineName || !newMachinePlate || !newMachinePrice) {
      setError('Lütfen tüm bilgileri doldurunuz.');
      return;
    }

    const db = getFirestore();
    try {
      await addDoc(collection(db, 'makineListesi'), {
        MakineAdı: newMachineName,
        MakinePlakası: newMachinePlate,
        BirimFiyat: newMachinePrice, // Save Birim Fiyat in Firestore
      });
      setNewMachineName('');
      setNewMachinePlate('');
      setNewMachinePrice(''); // Clear input
      setSuccessMessage('Yeni makine başarıyla eklendi.');
      fetchMachines();
    } catch (error) {
      setError('Makine eklenirken bir hata oluştu.');
    }
  };

  // Delete machine
  const deleteMachine = async (machineId) => {
    const db = getFirestore();
    try {
      await deleteDoc(doc(db, 'makineListesi', machineId));
      setSuccessMessage('Makine başarıyla silindi.');
      fetchMachines();
    } catch (error) {
      setError('Makine silinirken bir hata oluştu.');
    }
  };

  // Start editing machine
  const startEditing = (machine) => {
    setEditingMachine({ ...machine });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMachine(null);
  };

  // Update machine
  const updateMachine = async () => {
    if (!editingMachine.MakineAdı || !editingMachine.MakinePlakası || !editingMachine.BirimFiyat) {
      setError('Lütfen tüm bilgileri doldurunuz.');
      return;
    }

    const db = getFirestore();
    try {
      await updateDoc(doc(db, 'makineListesi', editingMachine.id), {
        MakineAdı: editingMachine.MakineAdı,
        MakinePlakası: editingMachine.MakinePlakası,
        BirimFiyat: editingMachine.BirimFiyat, // Update Birim Fiyat
      });
      setSuccessMessage('Makine başarıyla güncellendi.');
      setEditingMachine(null);
      fetchMachines();
    } catch (error) {
      setError('Makine güncellenirken bir hata oluştu.');
    }
  };

  return (
    <div className="makine-tanımlama-container">
      <h2>Makine Tanımlama</h2>

      {/* Machine Add Form */}
      <div className="add-machine-form">
        <h3>Yeni Makine Ekle</h3>
        <input
          type="text"
          placeholder="Makine Kodu"
          value={newMachineName}
          onChange={(e) => setNewMachineName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Makine Detayı"
          value={newMachinePlate}
          onChange={(e) => setNewMachinePlate(e.target.value)}
        />
        <input
          type="text"
          placeholder="Birim Fiyat"
          value={newMachinePrice}
          onChange={(e) => setNewMachinePrice(e.target.value)}
        />
        <button onClick={addMachine}>Makine Ekle</button>
      </div>

      {/* Success or Error Message */}
      {successMessage && <p className="success-message">{successMessage}</p>}
      {error && <p className="error-message">{error}</p>}

      {/* Machine List */}
      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <table className="machine-table">
          <thead>
            <tr>
              <th>Makine Kodu</th>
              <th>Makine Detayı</th>
              <th>Birim Fiyat</th> {/* New Column */}
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((machine) => (
              <tr key={machine.id}>
                <td>
                  {editingMachine && editingMachine.id === machine.id ? (
                    <input
                      type="text"
                      value={editingMachine.MakineAdı}
                      onChange={(e) =>
                        setEditingMachine({
                          ...editingMachine,
                          MakineAdı: e.target.value,
                        })
                      }
                    />
                  ) : (
                    machine.MakineAdı
                  )}
                </td>
                <td>
                  {editingMachine && editingMachine.id === machine.id ? (
                    <input
                      type="text"
                      value={editingMachine.MakinePlakası}
                      onChange={(e) =>
                        setEditingMachine({
                          ...editingMachine,
                          MakinePlakası: e.target.value,
                        })
                      }
                    />
                  ) : (
                    machine.MakinePlakası
                  )}
                </td>
                <td>
                  {editingMachine && editingMachine.id === machine.id ? (
                    <input
                      type="text"
                      value={editingMachine.BirimFiyat}
                      onChange={(e) =>
                        setEditingMachine({
                          ...editingMachine,
                          BirimFiyat: e.target.value,
                        })
                      }
                    />
                  ) : (
                    machine.BirimFiyat
                  )}
                </td>
                <td>
                  {editingMachine && editingMachine.id === machine.id ? (
                    <>
                      <button onClick={updateMachine}>Kaydet</button>
                      <button onClick={cancelEditing}>İptal</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditing(machine)}>Düzenle</button>
                      <button onClick={() => deleteMachine(machine.id)}>Sil</button>
                    </>
                  )}
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
