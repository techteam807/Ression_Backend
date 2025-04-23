const request = require("request");
const GALLABOX_OTP="bw_scan_app";
const GALLABOX_SUCCESSMSG = "bw_scan_app_utility2";
const GALLABOX_MISSEDMSG = "missed_cartridgereplacement";
const GALLABOX_FIRSTTIMEMSG = "welcome_cartidge_success";

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

  const sendFirstTimeMsg = async (mobile_number,url) => {
    console.log(mobile_number,url);
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
              templateName: GALLABOX_FIRSTTIMEMSG,
              headerValues:{mediaUrl:url}
              // bodyValues: { name: name }, // Change from object to array
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

module.exports = {sendWhatsAppOtp, sendWhatsAppMsg, sendMissedCatridgeMsg, sendFirstTimeMsg};