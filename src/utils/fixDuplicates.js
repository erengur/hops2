// src/utils/fixDuplicates.js

import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch, query, where } from 'firebase/firestore';

const fixDuplicates = async () => {
  const db = getFirestore();
  const customerListRef = collection(db, 'müşteri listesi');

  try {
    // Tüm müşterileri ve şantiyeleri al
    const snapshot = await getDocs(customerListRef);
    const allEntries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // İsimleri takip etmek için bir harita oluştur
    const nameMap = {};

    // Tüm kayıtları dolaşarak çakışmaları tespit et
    for (const entry of allEntries) {
      const name = entry['Müşteri Adı']?.trim();
      const isSantiye = !!entry['Şantiye'];

      if (!name) continue;

      if (!nameMap[name]) {
        nameMap[name] = {
          customer: null,
          santiye: null,
        };
      }

      if (isSantiye) {
        nameMap[name].santiye = entry;
      } else {
        nameMap[name].customer = entry;
      }
    }

    // Çakışmaları işleme koy
    const batch = writeBatch(db);
    for (const name in nameMap) {
      const { customer, santiye } = nameMap[name];

      if (customer && santiye) {
        // Aynı isimli hem müşteri hem de şantiye var
        // Müşteriyi silelim, şantiyeyi tutalım

        console.log(`Çakışma tespit edildi: ${name}`);

        // Müşteriyi sil
        batch.delete(doc(db, 'müşteri listesi', customer.id));

        // Gerekirse, şantiyeyi güncelle (örneğin, 'Şantiye' alanını kaldırarak müşteriye dönüştürme)
        // Bu durumda şantiyeyi olduğu gibi bırakıyoruz
      }
    }

    // Batch işlemini gerçekleştir
    await batch.commit();

    console.log('Çakışmalar başarıyla giderildi.');

    // Şimdi puantaj kayıtlarını güncelleyelim
    await updatePuantajlar(db, nameMap);

  } catch (error) {
    console.error('Çakışmalar giderilirken hata oluştu:', error);
  }
};

// Puantaj kayıtlarını güncelleme fonksiyonu
const updatePuantajlar = async (db, nameMap) => {
  try {
    const puantajlarRef = collection(db, 'puantajlar');
    const batch = writeBatch(db);

    for (const name in nameMap) {
      const { customer, santiye } = nameMap[name];

      if (customer && santiye) {
        // Silinen müşteri adına sahip puantaj kayıtlarını bul
        const puantajQuery = query(
          puantajlarRef,
          where('Müşteri Adı', '==', customer['Müşteri Adı'])
        );

        const puantajSnapshot = await getDocs(puantajQuery);

        puantajSnapshot.forEach((puantajDoc) => {
          batch.update(puantajDoc.ref, {
            'Müşteri Adı': santiye['Müşteri Adı'],
            'Cari Kodu': santiye['cariCode'],
          });
        });
      }
    }

    // Batch işlemini gerçekleştir
    await batch.commit();

    console.log('Puantaj kayıtları başarıyla güncellendi.');
  } catch (error) {
    console.error('Puantaj kayıtları güncellenirken hata oluştu:', error);
  }
};

export default fixDuplicates;
