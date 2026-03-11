import React, { useState, useContext } from "react"; // Adicionar useContext
import { FinanceContext } from "../../context/FinanceContext"; // Importar contexto
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

export default function AssinaturasList() {
  const { assinaturas, setAssinaturas } = useContext(FinanceContext);
  // Estado inicial com dados mockados
  //   const [assinaturas, setAssinaturas] = useState([
  //     { id: 1, nome: 'Netflix', fatura: 'Cartão Nubank', responsavel: 'João', valor: 39.90 },
  //     { id: 2, nome: 'Spotify', fatura: 'Cartão Inter', responsavel: 'Maria', valor: 21.90 }
  //   ]);

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nome: "",
    fatura: "",
    responsavel: "",
    valor: "",
    diaCobranca: "",
  });

  const handleOpen = (assinatura = null) => {
    if (assinatura) {
      setFormData({ ...assinatura });
      setIsEditing(true);
    } else {
      setFormData({
        id: null,
        nome: "",
        fatura: "",
        responsavel: "",
        valor: "",
      });
      setIsEditing(false);
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSave = () => {
    if (isEditing) {
      setAssinaturas(
        assinaturas.map((a) =>
          a.id === formData.id
            ? { ...formData, valor: parseFloat(formData.valor) }
            : a,
        ),
      );
    } else {
      const novaAssinatura = {
        ...formData,
        id: Date.now(),
        valor: parseFloat(formData.valor),
      };
      setAssinaturas([...assinaturas, novaAssinatura]);
    }
    handleClose();
  };

  const handleDelete = (id) => {
    setAssinaturas(assinaturas.filter((a) => a.id !== id));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Adicionar Assinatura
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Nome</strong>
              </TableCell>
              <TableCell>
                <strong>Fatura (Cartão)</strong>
              </TableCell>
              <TableCell>
                <strong>Responsável</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Valor</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Dia</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Ações</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assinaturas.map((assinatura) => (
              <TableRow key={assinatura.id}>
                <TableCell>{assinatura.nome}</TableCell>
                <TableCell>
                  <Chip
                    label={assinatura.fatura}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{assinatura.responsavel}</TableCell>
                <TableCell align="right">
                  {Number(assinatura.valor).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </TableCell>
                <TableCell align="right">{assinatura.diaCobranca}</TableCell>
                <TableCell align="center">
                  <IconButton
                    color="primary"
                    onClick={() => handleOpen(assinatura)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(assinatura.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {assinaturas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nenhuma assinatura registrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          {isEditing ? "Editar Assinatura" : "Nova Assinatura"}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Nome da Assinatura"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            label="Fatura (Ex: Nubank)"
            name="fatura"
            value={formData.fatura}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            label="Responsável"
            name="responsavel"
            value={formData.responsavel}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            label="Valor"
            name="valor"
            type="number"
            value={formData.valor}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            label="Dia de Cobrança"
            name="diaCobranca"
            type="number"
            value={formData.diaCobranca}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" color="secondary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
