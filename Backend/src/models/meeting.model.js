import mongoose from "mongoose";
const Schema = mongoose.Schema;

const meetingSchema = new Schema({
    user_id: {
        type: Object,
    },
    meetingCode: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
        required: true,
    }
});


export const Meeting = mongoose.model("Meeting", meetingSchema);