// src/utils/utils.js

import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

export const getNextSantiyeCariCode = async (parentId, parentCariCode) => {
  const db = getFirestore();
  const shantiyelerQuery = query(
    collection(db, 'müşteri listesi'),
    where('parentId', '==', parentId)
  );
  const shantiyelerSnapshot = await getDocs(shantiyelerQuery);
  const existingCariCodes = shantiyelerSnapshot.docs.map((doc) => doc.data().cariCode);

  let index = 1;
  while (existingCariCodes.includes(`${parentCariCode}/${index}`)) {
    index++;
  }
  return index;
};
