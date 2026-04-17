import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import taskRoutes from './routes/taskRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/tasks', taskRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const start = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Atividade 3 — API em http://localhost:${PORT}`);
    console.log(`Ex.: PUT http://localhost:${PORT}/api/tasks/<id>`);
  });
};

start().catch(console.error);
