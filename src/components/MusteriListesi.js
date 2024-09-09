import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import './MusteriListesi.css'; // Stil dosyasını kullanabilirsiniz

const MusteriListesi = ({ theme }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // Düzenlenecek müşteri
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Düzenleme modal'ı
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Yeni müşteri ekleme modal'ı
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Silme doğrulama modal'ı
  const [successMessage, setSuccessMessage] = useState(''); // Başarı mesajı için state

  // Edit form state'leri
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Yeni müşteri ekleme form state'leri
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  // Silme işlemi için state
  const [customerToDelete, setCustomerToDelete] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    const db = getFirestore();
    try {
      const customerSnapshot = await getDocs(collection(db, 'müşteri listesi'));
      const customerData = customerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() // Tüm verileri çekiyoruz
      }));
      setCustomers(customerData);
    } catch (error) {
      setError('Müşteri verileri alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Yeni müşteri ekleme fonksiyonu
  const handleAddNewCustomer = async () => {
    const db = getFirestore();
    try {
      const newCustomerRef = await addDoc(collection(db, 'müşteri listesi'), {
        'Müşteri Adı': newCustomerName,
        'Telefon': newCustomerPhone,
        'E-posta': newCustomerEmail
      });

      const newCustomer = {
        id: newCustomerRef.id,
        'Müşteri Adı': newCustomerName,
        'Telefon': newCustomerPhone,
        'E-posta': newCustomerEmail
      };
      setCustomers(prevCustomers => [...prevCustomers, newCustomer]);

      setSuccessMessage('Yeni müşteri başarıyla eklendi.');

      setTimeout(() => {
        setSuccessMessage('');
        setIsAddModalOpen(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerEmail('');
      }, 2000);

    } catch (error) {
      console.error('Yeni müşteri eklenirken bir hata oluştu: ', error);
    }
  };

  // Müşteriyi silme fonksiyonu (doğrulama sonrası)
  const handleDeleteCustomer = async () => {
    const db = getFirestore();
    try {
      await deleteDoc(doc(db, 'müşteri listesi', customerToDelete.id));

      // Silinen müşteriyi listeden çıkarıyoruz
      setCustomers(prevCustomers => prevCustomers.filter(cust => cust.id !== customerToDelete.id));

      // Başarı mesajını göster ve 2 saniye sonra modal'ı kapat
      setSuccessMessage('Müşteri başarıyla silinmiştir.');

      setTimeout(() => {
        setSuccessMessage('');
        setIsDeleteModalOpen(false); // 2 saniye sonra pop-up'ı kapat
      }, 2000);

    } catch (error) {
      console.error('Müşteri silinirken bir hata oluştu: ', error);
    }
  };

  // Silme modal'ını açma
  const openDeleteModal = (customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  // Edit butonuna tıklanınca modal'ı açma ve seçilen müşteri bilgilerini doldurma
  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setEditName(customer['Müşteri Adı']);
    setEditPhone(customer['Telefon']);
    setEditEmail(customer['E-posta']);
    setIsEditModalOpen(true);
  };

  // Müşteri bilgilerini güncelleme ve Firebase'e kaydetme
  const handleUpdateCustomer = async () => {
    const db = getFirestore();
    try {
      const customerRef = doc(db, 'müşteri listesi', selectedCustomer.id); // İlgili belge referansı
      await updateDoc(customerRef, {
        'Müşteri Adı': editName,
        'Telefon': editPhone,
        'E-posta': editEmail
      });

      setCustomers(prevCustomers =>
        prevCustomers.map(cust =>
          cust.id === selectedCustomer.id
            ? { ...cust, 'Müşteri Adı': editName, 'Telefon': editPhone, 'E-posta': editEmail }
            : cust
        )
      );

      setSuccessMessage('Değişiklikler başarıyla kaydedildi.');

      setTimeout(() => {
        setSuccessMessage('');
        setIsEditModalOpen(false);
      }, 2000);

    } catch (error) {
      console.error('Müşteri güncellenirken bir hata oluştu: ', error);
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className={`musteri-listesi-container ${theme}`}>
      <h2>Müşteri Listesi</h2>

      {/* Yeni Müşteri Ekle Butonu */}
      <button className="new-customer-btn" onClick={() => setIsAddModalOpen(true)}>
        Yeni Müşteri Ekle
      </button>

      <table className={`musteri-table ${theme}`}>
        <thead>
          <tr>
            <th>Müşteri Adı</th>
            <th>Telefon</th>
            <th>E-posta</th>
            <th>Düzenle</th>
            <th>Sil</th> {/* Sil sütunu */}
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer['Müşteri Adı'] || '-'}</td>
              <td>{customer['Telefon'] || '-'}</td>
              <td>{customer['E-posta'] || '-'}</td>
              <td>
                <button onClick={() => openEditModal(customer)}>Düzenle</button>
              </td>
              <td>
                <button onClick={() => openDeleteModal(customer)}>Sil</button> {/* Silme butonu */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Düzenleme Modal'ı */}
      {isEditModalOpen && (
        <div className={`modal ${theme}`}>
          <div className={`modal-content ${theme}`}>
            <h3>Müşteri Bilgilerini Düzenle</h3>

            <div className="form-group">
              <label>Müşteri Adı:</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Yeni müşteri adı"
              />
            </div>

            <div className="form-group">
              <label>Telefon:</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Yeni telefon numarası"
              />
            </div>

            <div className="form-group">
              <label>E-posta:</label>
              <input
                type="text"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Yeni e-posta adresi"
              />
            </div>

            {successMessage && <div className="success-message">{successMessage}</div>}

            <div className="modal-actions">
              <button onClick={handleUpdateCustomer}>Kaydet</button>
              <button onClick={() => setIsEditModalOpen(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Silme Doğrulama Modal'ı */}
      {isDeleteModalOpen && (
        <div className={`modal ${theme}`}>
          <div className={`modal-content ${theme}`}>
            <h3>Müşteriyi Sil</h3>
            <p>Bu müşteri silinecektir, emin misiniz?</p>
            <div className="form-group">
              <strong>Müşteri Adı:</strong> {customerToDelete['Müşteri Adı']}
            </div>
            <div className="form-group">
              <strong>Telefon:</strong> {customerToDelete['Telefon']}
            </div>
            <div className="form-group">
              <strong>E-posta:</strong> {customerToDelete['E-posta']}
            </div>

            {successMessage && <div className="success-message">{successMessage}</div>} {/* Başarı mesajı */}

            <div className="modal-actions">
              <button onClick={handleDeleteCustomer}>Sil</button>
              <button onClick={() => setIsDeleteModalOpen(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Müşteri Ekle Modal'ı */}
      {isAddModalOpen && (
        <div className={`modal ${theme}`}>
          <div className={`modal-content ${theme}`}>
            <h3>Yeni Müşteri Ekle</h3>

            <div className="form-group">
              <label>Müşteri Adı:</label>
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Müşteri adı girin"
              />
            </div>

            <div className="form-group">
              <label>Telefon:</label>
              <input
                type="text"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="Telefon numarası girin"
              />
            </div>

            <div className="form-group">
              <label>E-posta:</label>
              <input
                type="text"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="E-posta adresi girin"
              />
            </div>

            {successMessage && <div className="success-message">{successMessage}</div>}

            <div className="modal-actions">
              <button onClick={handleAddNewCustomer}>Kaydet</button>
              <button onClick={() => setIsAddModalOpen(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusteriListesi;
