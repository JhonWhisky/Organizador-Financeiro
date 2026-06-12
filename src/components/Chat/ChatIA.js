import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import {
  Box, Fab, Dialog, DialogTitle, DialogContent, TextField, IconButton,
  Typography, Paper, CircularProgress, Tooltip, useTheme, Chip,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const SUGESTOES = [
  'Qual é o meu saldo livre este mês?',
  'Quanto devo no cartão este mês?',
  'Quais são as minhas assinaturas?',
  'Como está a minha situação financeira?',
];

function Mensagem({ msg, isDark }) {
  const isUser = msg.role === 'user';
  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 1.5 }}>
      {!isUser && (
        <Box sx={{ mr: 1, mt: 0.5 }}>
          <AutoAwesomeIcon fontSize="small" color="primary" />
        </Box>
      )}
      <Paper
        elevation={0}
        sx={{
          px: 2, py: 1.5, maxWidth: '80%', borderRadius: 3,
          borderTopRightRadius: isUser ? 4 : 16,
          borderTopLeftRadius: isUser ? 16 : 4,
          bgcolor: isUser
            ? 'primary.main'
            : isDark ? 'rgba(255,255,255,0.07)' : '#f0f4ff',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{msg.content}</Typography>
      </Paper>
    </Box>
  );
}

export default function ChatIA() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [aberto, setAberto] = useState(false);
  const [input, setInput] = useState('');
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const fimRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (fimRef.current) fimRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [historico, carregando]);

  useEffect(() => {
    if (aberto && !carregando) inputRef.current?.focus();
  }, [aberto, carregando]);

  const enviar = async (texto) => {
    const mensagem = (texto || input).trim();
    if (!mensagem || carregando) return;

    const novoHistorico = [...historico, { role: 'user', content: mensagem }];
    setHistorico(novoHistorico);
    setInput('');
    setErro('');
    setCarregando(true);

    try {
      const { data } = await api.post('/chat', {
        mensagem,
        historico: historico.map(m => ({ role: m.role, content: m.content })),
      });
      setHistorico([...novoHistorico, { role: 'model', content: data.resposta }]);
    } catch (e) {
      const msg = e.response?.data?.error || 'Não foi possível responder. Verifica a tua ligação.';
      setErro(msg);
      setHistorico(novoHistorico);
    } finally {
      setCarregando(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  return (
    <>
      <Tooltip title="Assistente IA" placement="left">
        <Fab
          color="primary"
          onClick={() => setAberto(true)}
          sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1200, boxShadow: 6 }}
        >
          <SmartToyIcon />
        </Fab>
      </Tooltip>

      <Dialog
        open={aberto}
        onClose={() => setAberto(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            height: '80vh', maxHeight: 700, display: 'flex', flexDirection: 'column',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid', borderColor: 'divider', py: 1.5, px: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight="bold">Assistente Financeiro</Typography>
            <Chip label="Gemini" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
          </Box>
          <IconButton size="small" onClick={() => setAberto(false)}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}>
          {historico.length === 0 && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2, py: 4 }}>
              <AutoAwesomeIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.7 }} />
              <Typography variant="body1" color="text.secondary" align="center">
                Olá! Sou o teu assistente financeiro.<br />Pergunta-me sobre os teus gastos, saldos e projeções.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 1 }}>
                {SUGESTOES.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    size="small"
                    onClick={() => enviar(s)}
                    clickable
                    variant="outlined"
                    color="primary"
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {historico.map((msg, i) => (
            <Mensagem key={i} msg={msg} isDark={isDark} />
          ))}

          {carregando && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AutoAwesomeIcon fontSize="small" color="primary" />
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">A pensar...</Typography>
            </Box>
          )}

          {erro && (
            <Typography variant="caption" color="error" sx={{ mb: 1 }}>{erro}</Typography>
          )}

          <div ref={fimRef} />
        </DialogContent>

        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            size="small"
            multiline
            maxRows={4}
            placeholder="Escreve a tua pergunta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={carregando}
            variant="outlined"
          />
          <IconButton
            color="primary"
            onClick={() => enviar()}
            disabled={!input.trim() || carregando}
            sx={{ alignSelf: 'flex-end' }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Dialog>
    </>
  );
}
