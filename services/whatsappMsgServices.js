const request = require("request");
const path = require('path');
const GALLABOX_OTP="bw_scan_app";
const GALLABOX_SUCCESSMSG = "bw_scan_app_utility2";
const GALLABOX_MISSEDMSG = "missed_cartridgereplacement";
const GALLABOX_FIRSTTIMEMSG = "welcome_cartidge_success";
const GALLABOX_WATERREPORTS = "waterreport_template";
const GALLABOX_SUCCESSMSG_NEW= "installation_success_1";

//send customer success msg
const sendWhatsAppMsg = async (mobile_number, name) => {
  console.log(mobile_number,name);
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      url: process.env.GALLABOX_URL,
      headers: {
        apisecret: process.env.GALLABOX_API_SECRET, // lowercase
        apikey: process.env.GALLABOX_API_KEY, // lowercase
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelId: process.env.GALLABOX_CHANNEL_ID,
        channelType: "whatsapp",
        recipient: {
          name: mobile_number,
          phone: `91${mobile_number}`,
        },
        whatsapp: {
          type: "template",
          template: {
            templateName: GALLABOX_SUCCESSMSG,
            bodyValues: { name: name }, // Change from object to array
          },
        },
      }),
    };

    request(options, (error, response) => {
      if (error) {
        console.error("Error sending WhatsApp Msg:", error);
        return reject({ success: false, message: "Failed to send Msg via WhatsApp." });
      }
      console.log("WhatsApp Message Sent:", response.body);
      resolve({ success: true, message: "Msg sent successfully." });
    });
  });
};

//send otp for technician
const sendWhatsAppOtp = async (mobile_number, otp) => {
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      url: process.env.GALLABOX_URL,
      headers: {
        apisecret: process.env.GALLABOX_API_SECRET, // lowercase
        apikey: process.env.GALLABOX_API_KEY, // lowercase
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelId: process.env.GALLABOX_CHANNEL_ID,
        channelType: "whatsapp",
        recipient: {
          name: mobile_number,
          phone: `91${mobile_number}`,
        },
        whatsapp: {
          type: "template",
          template: {
            templateName: GALLABOX_OTP,
            bodyValues: { otp: otp.toString() }, // Change from object to array
          },
        },
      }),
    };

    request(options, (error, response) => {
      if (error) {
        console.error("Error sending WhatsApp OTP:", error);
        return reject({
          success: false,
          message: "Failed to send OTP via WhatsApp.",
        });
      }
      console.log("WhatsApp Message Sent:", response.body);
      resolve({ success: true, message: "OTP sent successfully." });
    });
  });
};

//send missed cartidge msg
const sendMissedCatridgeMsg = async( mobile_number, name) => {
    console.log(mobile_number,name);
    return new Promise((resolve, reject) => {
      const options = {
        method: "POST",
        url: process.env.GALLABOX_URL,
        headers: {
          apisecret: process.env.GALLABOX_API_SECRET, // lowercase
          apikey: process.env.GALLABOX_API_KEY, // lowercase
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: process.env.GALLABOX_CHANNEL_ID,
          channelType: "whatsapp",
          recipient: {
            name: mobile_number,
            phone: `91${mobile_number}`,
          },
          whatsapp: {
            type: "template",
            template: {
              templateName: GALLABOX_MISSEDMSG,
              bodyValues: { name: name }, // Change from object to array
            },
          },
        }),
      };
  
      request(options, (error, response) => {
        if (error) {
          console.error("Error sending WhatsApp Msg:", error);
          return reject({ success: false, message: "Failed to send Msg via WhatsApp." });
        }
        console.log("WhatsApp Message Sent:", response.body);
        resolve({ success: true, message: "Msg sent successfully." });
      });
    });
};

//send for new customers
// const sendFirstTimeMsg = async (mobile_number,url) => {
//     console.log(mobile_number,url);
//     return new Promise((resolve, reject) => {
//       const template = {
//         templateName: GALLABOX_FIRSTTIMEMSG,
//       };
  
//       if (url) {
//         template.headerValues = { mediaUrl: url };
//       }

//       const options = {
//         method: "POST",
//         url: process.env.GALLABOX_URL,
//         headers: {
//           apisecret: process.env.GALLABOX_API_SECRET, // lowercase
//           apikey: process.env.GALLABOX_API_KEY, // lowercase
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           channelId: process.env.GALLABOX_CHANNEL_ID,
//           channelType: "whatsapp",
//           recipient: {
//             name: mobile_number,
//             phone: `91${mobile_number}`,
//           },
//           whatsapp: {
//             type: "template",
//             template, // shorthand for `template: template`
//           },
//         }),
//       };
  
//       request(options, (error, response) => {
//         if (error) {
//           console.error("Error sending WhatsApp Msg:", error);
//           return reject({ success: false, message: "Failed to send Msg via WhatsApp." });
//         }
//         console.log("WhatsApp Message Sent:", response.body);
//         resolve({ success: true, message: "Msg sent successfully." });
//       });
//     });
// };
const sendFirstTimeMsg = async (mobile_number, name) => {
  console.log(mobile_number,name);
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      url: process.env.GALLABOX_URL,
      headers: {
        apisecret: process.env.GALLABOX_API_SECRET, // lowercase
        apikey: process.env.GALLABOX_API_KEY, // lowercase
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelId: process.env.GALLABOX_CHANNEL_ID,
        channelType: "whatsapp",
        recipient: {
          name: mobile_number,
          phone: `91${mobile_number}`,
        },
        whatsapp: {
          type: "template",
          template: {
            templateName: GALLABOX_SUCCESSMSG_NEW,
            bodyValues: { name: name }, // Change from object to array
          },
        },
      }),
    };

    request(options, (error, response) => {
      if (error) {
        console.error("Error sending WhatsApp Msg:", error);
        return reject({ success: false, message: "Failed to send Msg via WhatsApp." });
      }
      console.log("WhatsApp Message Sent:", response.body);
      resolve({ success: true, message: "Msg sent successfully." });
    });
  });
};

//send waterReports
const sendWaterReportPdf = async(mobile_number,name,docUrl) => {
  console.log(mobile_number,name,docUrl);
    return new Promise((resolve, reject) => {
      const template = {
        templateName: GALLABOX_WATERREPORTS,
        bodyValues: { name: name },
      };
  
      if (docUrl) {
        const fileName = path.basename(docUrl);
        template.headerValues = { mediaUrl: docUrl, mediaName: fileName };
      }

      const options = {
        method: "POST",
        url: process.env.GALLABOX_URL,
        headers: {
          apisecret: process.env.GALLABOX_API_SECRET, // lowercase
          apikey: process.env.GALLABOX_API_KEY, // lowercase
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: process.env.GALLABOX_CHANNEL_ID,
          channelType: "whatsapp",
          recipient: {
            name: name,
            phone: `91${mobile_number}`,
          },
          whatsapp: {
            type: "template",
            template, // shorthand for `template: template`
          },
        }),
      };
  
      request(options, (error, response) => {
        if (error) {
          console.error("Error sending WhatsApp Msg:", error);
          return reject({ success: false, message: "Failed to send Msg via WhatsApp." });
        }
        console.log("WhatsApp Message Sent:", response.body);
        resolve({ success: true, message: "Msg sent successfully." });
      });
    });
};


module.exports = {sendWhatsAppOtp, sendWhatsAppMsg, sendMissedCatridgeMsg, sendFirstTimeMsg, sendWaterReportPdf};