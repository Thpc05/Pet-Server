import mongoose from 'mongoose';

const NewUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    crm: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// O segredo está aqui: export default
const NewUserModel = mongoose.model('NewUser', NewUserSchema);

export default NewUserModel;