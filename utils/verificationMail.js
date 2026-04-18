// //Backend\utils\verificationMail.js
// import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';
// dotenv.config();

// const NODEMAIL_EMAIL = process.env.NODEMAIL_EMAIL;
// const NODEMAIL_PASS_KEY = process.env.NODEMAIL_PASS_KEY;

// const transporter = nodemailer.createTransport({
//     service : 'gmail',
//     auth: {
//         user : NODEMAIL_EMAIL,
//         pass : NODEMAIL_PASS_KEY
//     },
//     tls: {
//         rejectUnauthorized: false
//     }
// })


// export const sendVerificationEmail = async (userEmailId ) => {
//     try {
//         const otpValue = parseInt(Math.floor((Math.random() * 1000000)).toString() , 10);

//         const mailContent = {
//             from : 'userstest100@gmail.com',
//             to : userEmailId ,
//             subject : 'OTP Verification',
//             html : 
//                 "<h2>Your Verification OTP for CareerUp Registration<h2>" + 
//                 "<h3>Here is your otp: <h3>" + "<br>" +
//                 '<h1>' + otpValue + '<h1>' ,
//         };

//         await transporter.sendMail(mailContent);
//         return {otpValue , result: true}
//     } catch (error) {
//         console.log(error, 'Mail send error');
//         return {
//             result: false
//         }
//     }
// };

// Backend/utils/verificationMail.js
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

// dotenv.config();


// export const sendVerificationEmail = async (userEmailId) => {
//   try {
//     const SMTP_USER = process.env.SMTP_USER;
// const SMTP_PASS = process.env.SMTP_PASS;

// const transporter = nodemailer.createTransport({
//   host: "smtp-relay.brevo.com",
//   port: 587,
//   secure: false,
//   auth: {
//     user: SMTP_USER,
//     pass: SMTP_PASS,
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// //   connectionTimeout: 10000,
//   greetingTimeout: 10000,
//   socketTimeout: 10000,
// });

//     const otpValue = Math.floor(100000 + Math.random() * 900000); // always 6 digits

//     const mailContent = {
//       from: `"CareerUp" <${SMTP_USER}>`,
//       to: userEmailId,
//       subject: "OTP Verification",
//       html: `
//         <h2>Your Verification OTP for CareerUp Registration</h2>
//         <p>Please use the OTP below to verify your account:</p>
//         <h1>${otpValue}</h1>
//         <p>This OTP is valid for a short time only.</p>
//       `,
//     };

//     await transporter.sendMail(mailContent);

//     return {
//       otpValue,
//       result: true,
//     };
//   } catch (error) {
//     console.error("Mail send error:", error.message);
//     return {
//       result: false,
//     };
//   }
// };
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendVerificationEmail = async (userEmailId) => {
  try {
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",

      // ✅ FIX: use 2525 (works better on Render)
      port: 2525,
      secure: false,

      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },

      // ✅ FIX: avoid TLS issues
      requireTLS: true,

      // ✅ keep timeouts
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    const otpValue = Math.floor(100000 + Math.random() * 900000);

    const mailContent = {
       from: `"CareerUp" <rahuljraj157@gmail.com>`,
      to: userEmailId,
      subject: "OTP Verification",
      html: `
        <h2>Your Verification OTP for CareerUp Registration</h2>
        <p>Please use the OTP below to verify your account:</p>
        <h1>${otpValue}</h1>
        <p>This OTP is valid for a short time only.</p>
      `,
    };

    await transporter.sendMail(mailContent);

    return {
      otpValue,
      result: true,
    };

  } catch (error) {
    console.error("🔥 Mail send error:", error.message);

    return {
      otpValue: null, // ✅ important for your controller
      result: false,
    };
  }
};