import fetch from 'node-fetch';
import CryptoJS from 'crypto-js';
import { LOCAL_HOST } from '../config/env.config.js';
import API from '../config/api.config.js'

const { index, user_login_nonce, user_login_proof } = API;

const firstNonce = CryptoJS.lib.WordArray.random(8 * 4).toString();
const hasher = CryptoJS.algo.SHA256;
const hmac = CryptoJS.HmacSHA256;

const saltedPassWork = (password, salt, iterations) => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 8,
    iterations,
    hasher,
  });
}
const clientKey = saltPwd => {
  return hmac(saltPwd, 'Client Key');
}
const storedKey = clientKey => {
  const hasherObj = hasher.create();
  hasherObj.update(clientKey);
  return hasherObj.finalize();
}
const signature = (storedKey, authMessage) => {
  return hmac(storedKey, authMessage);
}
const clientProof = (password, salt, iterations, authMessage) => {
  const spwd = saltedPassWork(password, salt, iterations);
  const ckey = clientKey(spwd);
  const skey = storedKey(ckey);
  const csig = signature(skey, authMessage);

  for (let i = 0; i < ckey.sigBytes / 4; i += 1) {
    ckey.words[i] = ckey.words[i] ^ csig.words[i];
  }
  return ckey.toString();
}
const loginNonce = async () => {
  return new Promise(async resolve => {
    const loginFirstReq = await fetch(`${LOCAL_HOST}/${index}`);
    const loginSecondReqCookie = loginFirstReq.headers.get('set-cookie').match(/(.+?);/)[1];
    const loginIndexHtml = await loginFirstReq.text();
    const csrArr = loginIndexHtml.match(
      /<meta name="(csrf_token|csrf_param)" content="(.+?)"\/>/g
    );
    const csrfParam = csrArr[0].match(/content="(.+)"/)[1];
    const csrfToken = csrArr[1].match(/content="(.+)"/)[1];
    const loginSecondReq = await fetch(`${LOCAL_HOST}/${user_login_nonce}`, {
      method: 'POST',
      body: JSON.stringify({
        csrf: {
          csrf_param: csrfParam,
          csrf_token: csrfToken
        },
        data: {
          username: 'admin',
          firstnonce: firstNonce
        }
      }),
      headers: {
        Host: '192.168.2.1',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
        'Content-Type': 'application/json; charset=UTF-8',
        'Cookie': loginSecondReqCookie,
        '_ResponseFormat': 'JSON',
        'Referer': `${LOCAL_HOST}/${index}`,
        'Accept': 'application/json, text/javascript, */*; q=0.01'
      },
    });
    const loginSecondResJson = await loginSecondReq.json();
    const salt = CryptoJS.enc.Hex.parse(loginSecondResJson['salt']);
    resolve({
      ...loginSecondResJson,
      salt,
      authMsg: [firstNonce, loginSecondResJson['servernonce'], loginSecondResJson['servernonce']].join(','),
      secondCookie: loginSecondReqCookie,
    });
  });
}
const loginProof = password => {
  return new Promise(async resolve => {
    const data = await loginNonce();
    const {csrf_param, csrf_token, salt, iterations, authMsg, servernonce, secondCookie } = data;
    const loginThirdReq = await fetch(`${LOCAL_HOST}/${user_login_proof}`, {
      method: 'POST',
      body: JSON.stringify({
        csrf: {
          csrf_param,
          csrf_token,
        },
        data: {
          clientproof: clientProof(password, salt, iterations, authMsg),
          finalnonce: servernonce
        }
      }),
      headers: {
        'Host': LOCAL_HOST.replace(/http:\/\//g, ''),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
        'Content-Type': 'application/json; charset=UTF-8',
        'Cookie': secondCookie,
        '_ResponseFormat': 'JSON',
        'Referer': `${LOCAL_HOST}/${index}`,
        'Accept': 'application/json, text/javascript, */*; q=0.01'
      }
    });
    const loginThirdCookie = loginThirdReq.headers.get('set-cookie').match(/(.+?);/)[1];
    resolve(loginThirdCookie);
  })
}

export default loginProof;
