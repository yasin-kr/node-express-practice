// SMTP taşıyıcısını modül yüklenirken kurar; auth service’in e-posta gönderimini sağlar.
//E-posta gönderme işlevselliğini ayrı bir yardımcı fonksiyon olan sendMail içine alalım

import nodemailer from "nodemailer";
import { SMTP } from "../constants/index.js";
import {env} from "../utils/env.js"

const transporter = nodemailer.createTransport({
  host: env(SMTP.SMTP_HOST),
  port: Number(env(SMTP.SMTP_PORT)),
  auth: {
    user: env(SMTP.SMTP_USER),
    pass: env(SMTP.SMTP_PASSWORD),
  },
});

// Alıcı, gönderen, konu ve HTML içeren seçenekleri alır; sendMail sonucunu döndürür, hatayı çağırana iletir.
export const sendEmail = async option => {
  return await transporter.sendMail(option)
}
