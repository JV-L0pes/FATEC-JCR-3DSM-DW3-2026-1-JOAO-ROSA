import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import shoppingItemRoutes from './routes/shoppingItemRoutes';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API
app.use('/api/items', shoppingItemRoutes);

// Frontend estático
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Inicialização
const start = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
};

start().catch(console.error);
