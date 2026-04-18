import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

import userModel from '../../models/userModel.js';
import companyModel from '../../models/companyModel.js';
import { sendVerificationEmail } from '../../utils/verificationMail.js';

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10); 
    const hash = await bcrypt.hash(password , salt);
    return hash;
}  

let globalStored = null;

// ================= REGISTER =================
export const register = async (req, res) => {
    try {
        console.log("📥 REGISTER BODY:", req.body);

        if (!req.body || !req.body.userData) {
            return res.status(400).json({ error: "userData missing" });
        }

        let {username , email , phone, role , password} = req.body.userData;

        console.log("📧 EMAIL:", email);

        if (!phone) {
            return res.status(400).json({ error: "Phone is required" });
        }

        phone = Number(phone);

        const existingUser = await userModel.findOne({email});
        const existingCompany = await companyModel.findOne({email});

        let existingMobile = await userModel.findOne({phone});
        if(!existingMobile){
            existingMobile = await companyModel.findOne({phone});
            if(existingMobile){
                return res.status(401).json({error : 'Account already exists'});
            }
        }

        if(existingUser || existingCompany || existingMobile){
            return res.status(401).json({error : 'Account already exists'});
        }

        const phoneNumberPattern = /^[0-9]{10}$/;
        if (!phoneNumberPattern.test(phone)) {
            return res.status(401).json({ error: 'Invalid phone number' });
        }

        // EMAIL SAFE
        let otpValue, result;
        try {
            const emailRes = await sendVerificationEmail(email);
            otpValue = emailRes?.otpValue;
            result = emailRes?.result;
            console.log("📨 OTP:", otpValue, result);
        } catch (err) {
            console.log("🔥 EMAIL ERROR:", err);
            return res.status(500).json({ error: "Email sending failed" });
        }

        globalStored = otpValue;

        if(otpValue && result){
            return res.json({message : 'Check email for OTP Verification'});
        } else {
            return res.status(500).json({error : 'Verification email failed to send'});
        }

    } catch (error) {
        console.log("🔥 REGISTER ERROR:", error);
        return res.status(500).json({ error: error.message || "Server Error" });
    }
}

// ================= OTP REGISTER =================
export const otpRegister = async (req, res) => {
    try {
        console.log("📥 OTP BODY:", req.body);
        console.log("📦 STORED OTP:", globalStored);

        if (!req.body || !req.body.userData) {
            return res.status(400).json({ error: "userData missing" });
        }

        let {username , email , phone, role , password } = req.body.userData;
        let otp = req.body.otp;

        if (!otp) {
            return res.status(400).json({ error: "OTP required" });
        }

        otp = Number(otp);

        const existingUser = await userModel.findOne({email});
        const existingCompany = await companyModel.findOne({email});

        let existingMobile = await userModel.findOne({phone})
        if(!existingMobile){
            existingMobile = await companyModel.findOne({phone});
            if(existingMobile){
                return res.status(401).json({error : 'Account already exists'});
            }
        }

        if(existingUser || existingCompany || existingMobile){
            return res.status(401).json({error : 'Account already exists'});
        }

        const phoneNumberPattern = /^[0-9]{10}$/;
        if (!phoneNumberPattern.test(phone)) {
            return res.status(401).json({ error: 'Invalid phone number' });
        }

        if(otp === globalStored) {

            const bcryptedpassword = await hashPassword(password);

            if(role === 'Candidate'){
                const user = new userModel({
                    name: username , email , role , phone, password : bcryptedpassword
                });

                await user.save(); 
                console.log("✅ USER CREATED:", user);

                return res.status(201).json({user ,message : 'Verification success!'});

            } else {
                const company = new companyModel({
                    name: username , email , role , phone, password : bcryptedpassword
                });

                await company.save();
                console.log("✅ COMPANY CREATED:", company);

                return res.status(201).json({company ,message : 'Verification Success!'});
            }

        } else {
            console.log("❌ OTP MISMATCH:", otp, globalStored);
            return res.status(401).json({error : 'Invalid OTP'});
        }

    } catch (error) {
        console.log("🔥 OTP REGISTER ERROR:", error);
        return res.status(500).json({ error: error.message || "Server Error" });
    }
}

// ================= LOGIN =================
export const login = async (req, res) => {
    try {
        const {email , password} = req.body;

        const user = await userModel.findOne({email});

        if(!user){
            const company = await companyModel.findOne({email});

            if(!company){
                return res.status(401).json({error : 'Account Does not exist'});
            }

            if (company.isBlocked) {
                return res.status(401).json({ error: 'Account is blocked' });
            }

            const matchPassword = await bcrypt.compare(password , company.password);
            if(!matchPassword){
                return res.status(401).json({error : 'Invalid Password'});
            }

            const token = jwt.sign({userId : company.id } , process.env.JWT_SECRET , {expiresIn : '2h'});

            return res.status(200).json({
                message : 'Login successfully',
                token,
                companyData : {
                    username : company.name,
                    useremail : company.email,
                    userId : company._id,
                    role : company.role,
                }
            });
        }

        if (user.isBlocked) {
            return res.status(401).json({ error: 'Account is blocked' });
        }

        const matchPassword = await bcrypt.compare(password , user.password);
        if(!matchPassword){
            return res.status(401).json({error : 'Invalid Password'});
        }

        const token = jwt.sign({userId : user.id } , process.env.JWT_SECRET , {expiresIn : '1h'});

        return res.status(200).json({
            message : 'Login successfully',
            token,
            userData : {
                username : user.name,
                useremail : user.email,
                userId : user._id,
                role: user.role,
            }
        });

    } catch (error) {
        console.log("🔥 LOGIN ERROR:", error);
        return res.status(500).json({ error: error.message || "Server Error" });
    }
}

// ================= GOOGLE SIGNUP =================
export const googleSignup = async (req, res) => {
    try {
        const token = req.body.token; // ✅ FIXED

        if (!token) {
            return res.status(400).json({ error: "Google token missing" });
        }

        const decodedData = jwt.decode(token);

        if (!decodedData) {
            return res.status(401).json({ error: "Invalid Google token" });
        }

        console.log("📥 GOOGLE SIGNUP:", decodedData);

        const { name, email, picture, jti } = decodedData;

        const user = await userModel.findOne({ email });
        if (user) {
            return res.status(401).json({ error: 'User Already Exist' });
        }

        const newUser = new userModel({
            name,
            email,
            profileImage: picture,
            password: jti,
            role: 'Candidate',
        });

        await newUser.save();

        return res.status(201).json({ message: 'user saved succesfully' });

    } catch (error) {
        console.log("🔥 GOOGLE SIGNUP ERROR:", error);
        return res.status(500).json({ error: "Google signup failed" });
    }
};

// ================= GOOGLE LOGIN =================
export const googleLogin = async (req, res) => {
    try {
        const token = req.body.token;
        const decodedData = jwt.decode(token);

        if (!decodedData) {
            return res.status(401).json({ error: 'Invalid Google token' });
        }

        console.log("📥 GOOGLE LOGIN:", decodedData);

        const { email } = decodedData;

        let user = await userModel.findOne({email});

        if(!user){
            user = await companyModel.findOne({email});
        }

        if(!user){
            return res.status(401).json({error : 'User not found'});
        }

        if (user.isBlocked) {
            return res.status(401).json({ error: 'Account is blocked' });
        }

        const jwtToken = jwt.sign(
            {userId : user.id , email : user.email},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        return res.status(200).json({
            message : 'Login Successfull',
            token: jwtToken,
            userData : {
                username : user.name,
                useremail : user.email,
                role : user.role,
                userId : user._id
            }
        });

    } catch (error) {
        console.log("🔥 GOOGLE LOGIN ERROR:", error);
        return res.status(500).json({error : 'Internal Server Error'});
    }
}

// const client = new OAuth2Client(process.env.CLIENT_ID);
// export const googleSignup = async (req, res, next) => {
//   try {
//     const ticket = await client.verifyIdToken({
//       idToken: req.body.credential,
//       audience: process.env.CLIENT_ID,
//     });

//     const { name, email, picture } = ticket.getPayload();

//     const user = await userModel.findOne({ email });

//     if (user) {
//       return res.status(401).json({ error: 'User Already Exist' });
//     }

//     const newUser = new userModel({
//       name,
//       email,
//       profileImage: picture,
//       role: 'Candidate',
//       authProvider: 'google',
//     });

//     await newUser.save();

//     res.status(201).json({ message: 'User saved successfully' });
//   } catch (error) {
//     next(error);
//   }
// };



// // export const googleLogin = async (req, res, next) => {
// //     console.log(req.body,89998)
// //   try {
// //     // const token = req.body.credential;
// //     const token = req.body.token;

// //     if (!token) {
// //       return res.status(400).json({ error: 'Missing credential from Google' });
// //     }

// //     const ticket = await client.verifyIdToken({
// //       idToken: token,
// //       audience: process.env.CLIENT_ID,
// //     });

// //     const decodedData = ticket.getPayload();
// //     console.log('Decoded Google Data:', decodedData,999999995);

// //     const { name, email, picture } = decodedData;

// //     const user = await userModel.findOne({ email });

// //     if (!user) {
// //       return res.status(401).json({ error: 'User not found' });
// //     }

// //     if (user.isBlocked) {
// //       return res.status(403).json({ error: 'Account is blocked' });
// //     }

// //     const jwtSecret = process.env.JWT_SECRET;
// //     if (!jwtSecret) {
// //       throw new Error('JWT_SECRET not defined in environment');
// //     }

// //     const authToken = jwt.sign(
// //       { userId: user.id, email: user.email },
// //       jwtSecret,
// //       { expiresIn: '1h' }
// //     );

// //     return res.status(200).json({
// //       message: 'Login Successful',
// //       token: authToken,
// //       userData: {
// //         username: user.name,
// //         useremail: user.email,
// //         role: user.role,
// //         userId: user._id,
// //         profileImage: user.profileImage,
// //       },
// //     });

// //   } catch (error) {
// //     console.error('Google login error:', error);
// //     return res.status(500).json({ error: 'Internal Server Error' });
// //   }
// // };


// export const googleLogin = async (req, res, next) => {
//   console.log(req.body, 89998);
//   try {
//     const token = req.body.token;

//     if (!token) {
//       return res.status(400).json({ error: 'Missing credential from Google' });
//     }

//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: process.env.CLIENT_ID,
//     });

//     const decodedData = ticket.getPayload();
//     console.log('Decoded Google Data:', decodedData, 999999995);

//     const { name, email, picture } = decodedData;

//     let user = await userModel.findOne({ email });

//     // 👇 Auto-create user if not found
//     if (!user) {
//       user = new userModel({
//         name,
//         email,
//         profileImage: picture,
//         role: 'Candidate',
//         authProvider: 'google',
//       });
//       await user.save();
//       console.log('New user created via Google Login:', user.email);
//     }

//     if (user.isBlocked) {
//       return res.status(403).json({ error: 'Account is blocked' });
//     }

//     const jwtSecret = process.env.JWT_SECRET;
//     if (!jwtSecret) {
//       throw new Error('JWT_SECRET not defined in environment');
//     }

//     const authToken = jwt.sign(
//       { userId: user.id, email: user.email },
//       jwtSecret,
//       { expiresIn: '1h' }
//     );

//     return res.status(200).json({
//       message: 'Login Successful',
//       token: authToken,
//       userData: {
//         username: user.name,
//         useremail: user.email,
//         role: user.role,
//         userId: user._id,
//         profileImage: user.profileImage,
//       },
//     });

//   } catch (error) {
//     console.error('Google login error:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// };
