// src/components/CustomerTable.js

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const TableContainerStyled = styled(TableContainer)(({ theme }) => ({
  '& .MuiTableCell-root': {
    borderBottom: '1px solid #ccc',
    borderRight: '1px solid #ccc',
  },
  '& .MuiTableCell-root:last-child': {
    borderRight: 'none',
  },
}));

const CustomerTable = ({ customers, onEdit, onDelete, type, getSantiyeForCompany }) => {
  return (
    <TableContainerStyled component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell style={{ width: '25%' }}>Müşteri Adı</TableCell>
            <TableCell style={{ width: '15%' }}>Telefon</TableCell>
            <TableCell style={{ width: '20%' }}>E-posta</TableCell>
            <TableCell style={{ width: '15%' }}>Cari Kodu</TableCell>
            <TableCell style={{ width: '15%' }}>Şantiyeler</TableCell>
            <TableCell style={{ width: '10%' }}>İşlemler</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {customers.map((customer) => (
            <React.Fragment key={customer.id}>
              <TableRow>
                <TableCell>{customer['Müşteri Adı']}</TableCell>
                <TableCell>{customer['Telefon']}</TableCell>
                <TableCell>{customer['E-posta']}</TableCell>
                <TableCell>{customer['cariCode']}</TableCell>
                <TableCell>
                  {type === 'approved' && getSantiyeForCompany ? (
                    getSantiyeForCompany(customer.id).length > 0 ? (
                      <ul style={{ paddingLeft: '20px', margin: 0 }}>
                        {getSantiyeForCompany(customer.id).map(santiye => (
                          <li key={santiye.id}>{santiye['Müşteri Adı']}</li>
                        ))}
                      </ul>
                    ) : (
                      'Yok'
                    )
                  ) : (
                    'Yok'
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => onEdit(customer)}
                  >
                    Düzenle
                  </Button>
                  {type === 'approved' && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => onDelete(customer)}
                      style={{ marginLeft: '10px' }}
                    >
                      Sil
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainerStyled>
  );
};

export default CustomerTable;
