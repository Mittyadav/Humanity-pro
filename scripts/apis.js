// scripts/apis.js
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

const CLAIM_FAUCET_URL = 'https://faucet.testnet.humanity.org/api/claim';
const IPINFO_URL = 'https://ipinfo.io/json';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

async function claimFaucet(address, proxy) {
  const headers = {
    'User-Agent': USER_AGENT,
    'Content-Type': 'application/json'
  };

  const payload = {
    address: address
  };

  const agent = new SocksProxyAgent(proxy);

  try {
    const response = await axios.post(CLAIM_FAUCET_URL, payload, {
      headers: headers,
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 10000
    });

    if (response.status === 200 && response.data.msg) {
      const txHashMatch = response.data.msg.match(/Txhash:\s*(0x[a-fA-F0-9]{64})/);
      if (txHashMatch) {
        return txHashMatch[1];
      } else {
        throw new Error('Transaction hash not found in response.');
      }
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    throw error;
  }
}

async function getPublicIP(proxy) {
  const headers = {
    'User-Agent': USER_AGENT
  };

  const agent = new SocksProxyAgent(proxy);

  try {
    const response = await axios.get(IPINFO_URL, {
      headers: headers,
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 10000
    });

    if (response.status === 200 && response.data.ip) {
      return response.data.ip;
    } else {
      throw new Error('Public IP not found in response.');
    }
  } catch (error) {
    throw error;
  }
}

module.exports = {
  claimFaucet,
  getPublicIP
};
