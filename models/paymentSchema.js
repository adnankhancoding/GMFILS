import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  paymentMethod: { type: String, enum: ['Card', 'CashOnDelivery'], required: true },
  status: { type: String, enum: ['Success', 'Failed', 'Pending'], default: 'Pending' },
  transactionId: { type: String },
  amount: { type: Number, required: true }
}, { timestamps: true });

export const Payment = mongoose.model('Payment', paymentSchema);