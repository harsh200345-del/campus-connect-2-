const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'sms-config.json');

// Default Config
let config = {
  provider: 'fast2sms', // 'fast2sms' | 'twilio' | 'simulator'
  fast2smsApiKey: process.env.FAST2SMS_API_KEY || '',
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromPhone: process.env.TWILIO_FROM_PHONE || ''
  }
};

// Load config from disk if exists
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      config = { ...config, ...data };
    } else {
      saveConfig(config);
    }
  } catch (err) {
    console.error('Error loading SMS config:', err);
  }
  return config;
}

function saveConfig(newConfig) {
  try {
    config = { ...config, ...newConfig };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving SMS config:', err);
    return false;
  }
}

// Send Real SMS via Fast2SMS (Indian Mobile Numbers)
function sendViaFast2SMS(apiKey, phone, otp) {
  return new Promise((resolve) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const postData = JSON.stringify({
      variables_values: otp.toString(),
      route: 'otp',
      numbers: cleanPhone
    });

    const options = {
      hostname: 'www.fast2sms.com',
      port: 443,
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`[SMS-SERVICE] Contacting Fast2SMS Gateway for +91 ${cleanPhone}...`);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          console.log('[FAST2SMS RESPONSE]:', parsed);
          if (parsed.return === true) {
            resolve({
              success: true,
              provider: 'fast2sms',
              message: `Real SMS successfully delivered to +91 ${cleanPhone}! Check your phone.`
            });
          } else {
            resolve({
              success: false,
              provider: 'fast2sms',
              error: parsed.message || 'Fast2SMS delivery failed',
              details: parsed
            });
          }
        } catch (e) {
          resolve({ success: false, provider: 'fast2sms', error: 'Invalid response from Fast2SMS: ' + body });
        }
      });
    });

    req.on('error', (err) => {
      console.error('[FAST2SMS HTTP ERROR]:', err);
      resolve({ success: false, provider: 'fast2sms', error: err.message });
    });

    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ success: false, provider: 'fast2sms', error: 'Fast2SMS connection timed out' });
    });

    req.write(postData);
    req.end();
  });
}

// Send Real SMS via Twilio (International / US / Indian numbers)
function sendViaTwilio(twilioConfig, phone, otp) {
  return new Promise((resolve) => {
    const { accountSid, authToken, fromPhone } = twilioConfig;
    let targetPhone = phone.replace(/\D/g, '');
    if (!targetPhone.startsWith('+')) {
      targetPhone = targetPhone.length === 10 ? `+91${targetPhone}` : `+${targetPhone}`;
    }

    const postData = new URLSearchParams({
      To: targetPhone,
      From: fromPhone,
      Body: `Your RKGIT Campus Share verification OTP is ${otp}. Valid for 5 minutes. Do not share.`
    }).toString();

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const options = {
      hostname: 'api.twilio.com',
      port: 443,
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`[SMS-SERVICE] Contacting Twilio Gateway for ${targetPhone}...`);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              success: true,
              provider: 'twilio',
              message: `Real SMS successfully sent via Twilio to ${targetPhone}!`
            });
          } else {
            resolve({
              success: false,
              provider: 'twilio',
              error: parsed.message || 'Twilio error'
            });
          }
        } catch (e) {
          resolve({ success: false, provider: 'twilio', error: body });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, provider: 'twilio', error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

// Master Dispatcher
async function dispatchOtpSms(phone, otp) {
  loadConfig();
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  // 1. Try Fast2SMS if API key is provided
  if (config.fast2smsApiKey && config.fast2smsApiKey.trim().length > 10) {
    const result = await sendViaFast2SMS(config.fast2smsApiKey.trim(), cleanPhone, otp);
    if (result.success) {
      return {
        deliveredReal: true,
        provider: 'fast2sms',
        message: `Real SMS delivered directly to your mobile (+91 ${cleanPhone}) via Fast2SMS! Check your messages.`
      };
    } else {
      console.warn(`[SMS-SERVICE] Fast2SMS returned error: ${result.error}. Falling back to instant simulator.`);
      return {
        deliveredReal: false,
        provider: 'fast2sms_fallback',
        error: result.error,
        message: `Fast2SMS attempt: ${result.error}. Simulated OTP displayed for demo.`
      };
    }
  }

  // 2. Try Twilio if configured
  if (config.twilio && config.twilio.accountSid && config.twilio.authToken && config.twilio.fromPhone) {
    const result = await sendViaTwilio(config.twilio, cleanPhone, otp);
    if (result.success) {
      return {
        deliveredReal: true,
        provider: 'twilio',
        message: `Real SMS delivered directly to your mobile (+91 ${cleanPhone}) via Twilio! Check your messages.`
      };
    } else {
      console.warn(`[SMS-SERVICE] Twilio error: ${result.error}. Falling back to simulator.`);
      return {
        deliveredReal: false,
        provider: 'twilio_fallback',
        error: result.error,
        message: `Twilio attempt: ${result.error}. Simulated OTP displayed for demo.`
      };
    }
  }

  // 3. Default: Instant Simulated Delivery (Always works, zero configuration required)
  console.log(`[SMS-SIMULATOR] Delivery to +91 ${cleanPhone} with OTP: ${otp}`);
  return {
    deliveredReal: false,
    provider: 'simulator',
    message: `OTP generated for +91 ${cleanPhone}. Simulated SMS banner active.`
  };
}

module.exports = {
  loadConfig,
  saveConfig,
  dispatchOtpSms
};
