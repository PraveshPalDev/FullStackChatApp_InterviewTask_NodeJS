import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    text: string;
    sender: mongoose.Types.ObjectId;
    recipient?: mongoose.Types.ObjectId;
    isPrivate: boolean;
    isRead: boolean;
    createdAt: Date;
}

const MessageSchema: Schema = new Schema({
    text: { type: String, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPrivate: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret: any) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

export default mongoose.model<IMessage>('Message', MessageSchema);
