import fetch from 'node-fetch';
import { LOCAL_HOST } from '../config/env.config.js';
import API from '../config/api.config.js';

const { host_info, index } = API;

export const getHostInfo = cookie => {
  return new Promise(async resolve => {
    const hostInfoReq = await fetch(`${LOCAL_HOST}/${host_info}`, {
      method: 'GET',
      headers: {
        '_ResponseFormat': 'JSON',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Host': LOCAL_HOST.replace(/http:\/\//g, ''),
        'Pragma': 'no-cache',
        'Referer': `${LOCAL_HOST}/${index}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
        "Cookie": cookie
      }
    });
    const hosts = await hostInfoReq.json();
    resolve(hosts);
  });
}
