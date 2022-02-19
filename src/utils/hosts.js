import fs from 'fs';
import { exec } from 'child_process';
import { NOTIFICATION_URI } from '../config/env.config.js';
import path from 'path';
import fetch from 'node-fetch';

const root = path.resolve(process.cwd(), './');
const DIFF_KEYS = ['netType', 'online', 'ip'];

const sleep = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true);
    }, 1000);
  })
}

const notification = async message => {
  await sleep();
  const res = await fetch(`${NOTIFICATION_URI}/路由器通知/${message}`);
  const data = await res.json();
  console.log(data);
  return true;
}

const createDir = async () => {
  return new Promise(resolve => {
    exec(`mkdir ${root}/hosts`, (err, stdout, stderr) => {
      if (err) {
        throw err;
      }
      resolve(true);
    });
  });
}

export const handleHosts = async hosts => {
  for (const host of hosts) {
    const { InterfaceType, HostName, ActualName, IPAddress, Active, ID } = host;
    const hostData = {
      online: Active ? 'online' : 'offline',
      hostName: HostName,
      hostAlias: ActualName,
      netType: InterfaceType,
      ip: IPAddress,
      id: ID
    }
    if (!fs.existsSync(`${root}/hosts`)) {
      await createDir();
    }
    if (!fs.existsSync(`${root}/hosts/${ID}`)) {
      fs.writeFileSync(`${root}/hosts/${ID}`, JSON.stringify(hostData), { encoding: 'utf8' })
      await notification(`新设备: ${HostName} | ${hostData.netType === 'Ethernet' ? '有线' : '无线'} | ${hostData.online === 'online' ? '在线' : '离线'} | ${IPAddress}`);
    } else {
      const info = JSON.parse(fs.readFileSync(`${root}/hosts/${ID}`).toString().replace('\n', ''));
      let isUpdate = false
      Object.entries(info).forEach(([key, value]) => {
        if (DIFF_KEYS.includes(key) && info[key] !== value) {
          info[key] = hostData[key];
          console.log(info[key], hostData[key])
          isUpdate = true;
        }
      });

      if (isUpdate) {
        fs.writeFileSync(`${root}/hosts/${ID}`, JSON.stringify(hostData), {encoding: 'utf8'});
        await notification(`设备：${HostName} | ${ActualName ? `设备别名：${ActualName}` : ''} | ${hostData.netType} | ${hostData.online} | ${IPAddress}`);
      }
    }
  }
}
