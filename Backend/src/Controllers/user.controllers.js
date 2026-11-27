import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import httpStatus from "http-status";
import bcrypt, { hash } from "bcrypt";
import crypto from "crypto";


export const login = async(request, response) => {
    let {username, password} = request.body;
    if(!username || !password) return response.status(400).json({message: "Please Enter the Username and Password Correctly"});

    let userFound = await User.findOne({username});

    if (!userFound) return response.status(httpStatus.NOT_FOUND).json({ message: "User not found"});

    let isPassword = await bcrypt.compare(password, userFound.password);

    if(isPassword) {
        let token = crypto.randomBytes(20).toString("hex");
        userFound.token = token;
        await userFound.save();
        return response.status(httpStatus.OK).json({token: token});
    }

    else {
        return response.status(httpStatus.UNAUTHORIZED).json({message: "INVALID USER"});
    }
}

export const userRegister = async(request, response) => {
    let {name, username, password} = request.body;

    let existingUser = await User.findOne({username});
    if(existingUser) return response.status(httpStatus.FOUND).json({message: "Username already exists!"});

    let hashedPassword = await bcrypt.hash(password, 10);

    let newUser = new User({name, username, password: hashedPassword});

    await newUser.save();

    response.status(httpStatus.CREATED).json({message: "Registered Successful"});
}

export const getUserHistory = async (request, response) => {
    const {token} = request.query;

    try {
        const user = await User.findOne({token: token});
        const meetings = await Meeting.find({user_id: user.username});
        response.json({meetings});
    } catch (e) {
        response.json({message: `Something went wrong ${e}`});
    }
}

export const addToHistory = async(request, response) => {
    const {token, meeting_code} = request.body;

    try {
        const user = await User.findOne({token: token});
        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        })

        await newMeeting.save();
        response.status(httpStatus.CREATED).json({message: "Added to history"})
    } catch (e) {
        response.json({ message: `Something went wrong ${e}`})
    }
}