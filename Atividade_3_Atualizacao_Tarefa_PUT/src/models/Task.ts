import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'tasks',
  }
);

export const Task = mongoose.model<ITask>('Task', taskSchema);
