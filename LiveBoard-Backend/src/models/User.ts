import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    avatar?: string;
    isOnline: boolean;
    socketId?: string;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    avatar: { type: String },
    isOnline: { type: Boolean, default: false },
    socketId: { type: String }
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret: any) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.password;
        }
    }
});

export default mongoose.model<IUser>('User', UserSchema);
