// src/components/AdminPanel.js

import React from 'react';
import fixDuplicates from '../utils/fixDuplicates';

const AdminPanel = () => {
  const handleFixDuplicates = async () => {
    await fixDuplicates();
  };

  return (
    <div>
      <h1>Yönetici Paneli</h1>
      <button onClick={handleFixDuplicates}>Çakışmaları Gider</button>
    </div>
  );
};

export default AdminPanel;
