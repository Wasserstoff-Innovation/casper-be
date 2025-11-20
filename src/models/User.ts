import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email?: string;
  avatar_url?: string;
  provider?: string;
  created_at: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String },
  email: { type: String },
  avatar_url: { type: String },
  provider: { type: String },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'users'
});

// Indexes
UserSchema.index({ email: 1 });

export const User = model<IUser>('User', UserSchema);
