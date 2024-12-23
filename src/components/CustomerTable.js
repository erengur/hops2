// CustomerTable.js
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TableSortLabel,
  Collapse,
  Box,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Şantiyeleri cari kodlarına göre sıralayan yardımcı fonksiyon
const sortSantiyeByCariCode = (santiyeler) => {
  return [...santiyeler].sort((a, b) => {
    const cariCodeA = a['Şantiye Cari Kodu'] || '';
    const cariCodeB = b['Şantiye Cari Kodu'] || '';
    
    // Cari kodun son kısmını (sayısal değeri) al
    const numberA = parseInt(cariCodeA.split('/').pop() || '0', 10);
    const numberB = parseInt(cariCodeB.split('/').pop() || '0', 10);
    
    return numberA - numberB;
  });
};

const CustomerTable = ({ 
  customers, 
  onEdit, 
  onEditSantiye, 
  onDelete,
  onDeleteSantiye,
  onTransferSantiye
}) => {
  const [orderBy, setOrderBy] = useState('Müşteri Adı');
  const [order, setOrder] = useState('asc');
  const [openRows, setOpenRows] = useState({});

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    if (orderBy === 'cariCode') {
      return order === 'asc'
        ? a.cariCode.localeCompare(b.cariCode, undefined, { numeric: true, sensitivity: 'base' })
        : b.cariCode.localeCompare(a.cariCode, undefined, { numeric: true, sensitivity: 'base' });
    } else {
      return order === 'asc'
        ? a['Müşteri Adı'].localeCompare(b['Müşteri Adı'])
        : b['Müşteri Adı'].localeCompare(a['Müşteri Adı']);
    }
  }).map(customer => ({
    ...customer,
    şantiyeler: customer.şantiyeler ? sortSantiyeByCariCode(customer.şantiyeler) : []
  }));

  const toggleRow = (id) => {
    setOpenRows(prevState => ({ ...prevState, [id]: !prevState[id] }));
  };

  const iconButtonStyles = {
    borderRadius: '50%', 
    padding: '6px',
    width: '35px',
    height: '35px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.04)'
    }
};

  const handleTransferClick = (santiye) => {
    console.log('Transfer edilecek şantiye:', santiye);
    onTransferSantiye(santiye);
  };

  return (
    <TableContainer component={Paper} sx={{ overflowX: 'hidden' }}>
      <Table
        size="small"
        sx={{ '& .MuiTableCell-root': { padding: '4px' }, tableLayout: 'auto', width: '100%' }}
      >
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            <TableCell>
              <TableSortLabel
                active={orderBy === 'Müşteri Adı'}
                direction={orderBy === 'Müşteri Adı' ? order : 'asc'}
                onClick={() => handleRequestSort('Müşteri Adı')}
              >
                Müşteri Adı
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'cariCode'}
                direction={orderBy === 'cariCode' ? order : 'asc'}
                onClick={() => handleRequestSort('cariCode')}
              >
                Cari Kodu
              </TableSortLabel>
            </TableCell>
            <TableCell>Telefon</TableCell>
            <TableCell>E-posta</TableCell>
            <TableCell align="center">İşlemler</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedCustomers.map((customer) => (
            <React.Fragment key={customer.id}>
              <TableRow>
                <TableCell padding="checkbox">
                  {customer.şantiyeler && customer.şantiyeler.length > 0 && (
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      sx={iconButtonStyles}
                      disableRipple
                      disableFocusRipple
                      onClick={() => toggleRow(customer.id)}
                    >
                      {openRows[customer.id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  )}
                </TableCell>
                <TableCell>{customer['Müşteri Adı']}</TableCell>
                <TableCell>{customer.cariCode}</TableCell>
                <TableCell>{customer.Telefon}</TableCell>
                <TableCell>{customer['E-posta']}</TableCell>
                <TableCell align="center">
                  <Box display="inline-flex" gap="0px" sx={{ minWidth: '120px', justifyContent: 'center' }}>
                    <IconButton
                      sx={iconButtonStyles}
                      disableRipple
                      disableFocusRipple
                      onClick={() => onEdit(customer)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      sx={iconButtonStyles}
                      disableRipple
                      disableFocusRipple
                      onClick={() => onDelete(customer)}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      sx={iconButtonStyles}
                      disableRipple
                      disableFocusRipple
                      onClick={() => handleTransferClick(customer)}
                      title="Veri Aktarma"
                    >
                      <ArrowForwardIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
              {customer.şantiyeler && customer.şantiyeler.length > 0 && (
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={openRows[customer.id]} timeout="auto" unmountOnExit>
                      <Box margin={1}>
                        <Typography variant="h6" gutterBottom component="div">
                          Şantiyeler
                        </Typography>
                        <Table size="small" sx={{ '& .MuiTableCell-root': { padding: '4px' }, width: '100%' }}>
                          <TableHead>
                            <TableRow>
                              <TableCell>Şantiye Adı</TableCell>
                              <TableCell>Cari Kodu</TableCell>
                              <TableCell>Telefon</TableCell>
                              <TableCell>E-posta</TableCell>
                              <TableCell align="center">İşlemler</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {customer.şantiyeler.map((şantiye) => (
                              <TableRow key={şantiye.id}>
                                <TableCell component="th" scope="row">
                                  {şantiye['Müşteri Adı']}
                                </TableCell>
                                <TableCell>{şantiye.cariCode}</TableCell>
                                <TableCell>{şantiye.Telefon}</TableCell>
                                <TableCell>{şantiye['E-posta']}</TableCell>
                                <TableCell align="center">
                                <Box display="inline-flex" gap="0px" sx={{ minWidth: '120px', justifyContent: 'center' }}>
                                    <IconButton
                                      sx={iconButtonStyles}
                                      disableRipple
                                      disableFocusRipple
                                      onClick={() => onEditSantiye(şantiye)}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                    <IconButton
                                      sx={iconButtonStyles}
                                      disableRipple
                                      disableFocusRipple
                                      onClick={() => onDeleteSantiye(şantiye)}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                    <IconButton
                                      sx={iconButtonStyles}
                                      disableRipple
                                      disableFocusRipple
                                      onClick={() => handleTransferClick(şantiye)}
                                      title="Veri Aktarma"
                                    >
                                      <ArrowForwardIcon />
                                    </IconButton>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomerTable;
