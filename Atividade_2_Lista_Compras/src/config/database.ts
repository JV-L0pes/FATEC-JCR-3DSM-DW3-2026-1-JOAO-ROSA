import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-list';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB conectado com sucesso.');
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};
