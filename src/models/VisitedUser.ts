import { Schema, model, Document } from 'mongoose';

export interface IVisitedUser extends Document {
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  role?: string;
  industry?: string;
  teamSize?: string;
  created_at?: Date;
}

const VisitedUserSchema = new Schema<IVisitedUser>({
  firstName: { type: String, maxlength: 100 },
  lastName: { type: String, maxlength: 100 },
  email: { type: String, required: true, unique: true, maxlength: 255 },
  phoneNumber: { type: String, maxlength: 20 },
  company: { type: String, maxlength: 255 },
  role: { type: String, maxlength: 100 },
  industry: { type: String, maxlength: 100 },
  teamSize: { type: String, maxlength: 50 },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'visited_users'
});

// Note: email unique index is already created by 'unique: true' in schema definition

export const VisitedUser = model<IVisitedUser>('VisitedUser', VisitedUserSchema);
