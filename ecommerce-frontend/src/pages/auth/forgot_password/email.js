import emailjs from "@emailjs/browser";

export const sendOtpEmail = async (toEmail, passcode, time) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJSOTP_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("Missing EmailJS env vars: VITE_EMAILJS_SERVICE_ID, VITE_EMAILJSOTP_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY");
  }

  emailjs.init(publicKey);
  return emailjs.send(serviceId, templateId, {
    email: toEmail,
    passcode,
    time, //we will make use of this in the forgot password page to verify the OTP
  });
};