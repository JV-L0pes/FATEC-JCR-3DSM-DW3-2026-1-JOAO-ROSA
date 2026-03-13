import mongoose, { Document, Schema } from 'mongoose';

export interface IShoppingItem extends Document {
  name: string;
  quantity: number;
  unit?: string;
  purchased: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shoppingItemSchema = new Schema<IShoppingItem>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: 'un' },
    purchased: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'shoppingitems',
  }
);

export const ShoppingItem = mongoose.model<IShoppingItem>('ShoppingItem', shoppingItemSchema);
