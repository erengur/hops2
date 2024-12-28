import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

// Verileri sadece taşıyan, silmeyen fonksiyon
export const migrateDataToUser = async (sourceEmail = 'erengursoy95@gmail.com') => {
  const db = getFirestore();
  const batch = writeBatch(db);
  let totalDocuments = 0;

  try {
    // Eski koleksiyonlardan verileri al
    const collections = {
      'müşteri listesi': 'customerList',
      'puantajlar': 'timeSheets',
      'makineListesi': 'machines',
      'operatorListesi': 'operators'
    };

    console.log('Veri taşıma işlemi başlıyor...');

    for (const [oldCollection, newCollection] of Object.entries(collections)) {
      console.log(`${oldCollection} koleksiyonu taşınıyor...`);
      
      // Eski koleksiyondan verileri al
      const oldCollectionRef = collection(db, oldCollection);
      const snapshot = await getDocs(oldCollectionRef);
      
      console.log(`${snapshot.docs.length} adet döküman bulundu`);
      totalDocuments += snapshot.docs.length;

      // Her bir dökümanı yeni yapıya taşı (ama silmeden)
      for (const oldDoc of snapshot.docs) {
        // Yeni koleksiyon yolunu oluştur
        const userCollectionPath = `users/${sourceEmail}/${newCollection}`;
        const newDocRef = doc(db, userCollectionPath, oldDoc.id);
        
        // Veriyi yeni konuma kopyala
        batch.set(newDocRef, {
          ...oldDoc.data(),
          createdAt: new Date(),
          owner: sourceEmail
        });
      }
    }

    // Batch işlemini gerçekleştir
    if (totalDocuments > 0) {
      await batch.commit();
      console.log(`Toplam ${totalDocuments} döküman başarıyla kopyalandı`);
    } else {
      console.log('Kopyalanacak döküman bulunamadı');
    }

    console.log('Veri taşıma işlemi başarılı');

  } catch (error) {
    console.error('Veri taşıma hatası:', error);
    console.error('Hata detayı:', error.message);
    throw error;
  }
};

// Eski koleksiyonları temizleme fonksiyonu
export const cleanupOldCollections = async () => {
  const db = getFirestore();
  const oldCollections = [
    'müşteri listesi',
    'puantajlar',
    'makineListesi',
    'operatorListesi'
  ];

  try {
    console.log('Eski koleksiyonlar temizleniyor...');
    
    for (const collectionName of oldCollections) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((document) => {
        batch.delete(doc(db, collectionName, document.id));
      });
      
      if (snapshot.docs.length > 0) {
        await batch.commit();
        console.log(`${collectionName} koleksiyonu temizlendi`);
      }
    }
    
    console.log('Temizleme işlemi tamamlandı');
  } catch (error) {
    console.error('Temizleme hatası:', error);
    throw error;
  }
}; 