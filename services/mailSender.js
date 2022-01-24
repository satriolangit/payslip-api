const nodemailer = require("nodemailer");

const smtp = {
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: "shindengen.mail@gmail.com",
    pass: "@DigitalShindengen126!",
  },
};

const transporter = nodemailer.createTransport(smtp);

const send = (subject, to, message) => {
  const options = {
    from: "shindengen.mail@gmail.com",
    to: to,
    subject: subject,
    text: message,
  };

  transporter.sendMail(options, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

const sendBulk = (subject, tos, message) => {
  const options = {
    from: "shindengen.mail@gmail.com",
    to: tos.join(","),
    subject: subject,
    text: message,
  };

  transporter.sendMail(options, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = { send, sendBulk };
