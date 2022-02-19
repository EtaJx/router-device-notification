import fs from 'fs';
import { exec } from 'child_process';
import { NOTIFICATION_URI } from '../config/env.config.js';
import { message } from './message.js';
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
  await fetch(`${NOTIFICATION_URI}/路由器通知/${message}`);
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

const checkIPisOnline = ip => {
  return new Promise(resolve => {
    exec(`ping -c 2 ${ip}`, (err) => {
      if (err) {
        console.log(`
        ERROR: ${ip}:
        ${err}
        `)
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

export const handleHosts = async hosts => {
  for (const host of hosts) {
    const {InterfaceType, HostName, ActualName, IPAddress, ID, LeaseTime} = host;
    if (LeaseTime > 0) {
      const isOnline = await checkIPisOnline(IPAddress);
      const hostData = {
        online: isOnline ? 'online' : 'offline',
        hostName: HostName,
        hostAlias: ActualName,
        netType: InterfaceType,
        ip: IPAddress,
        id: ID
      }
      let isNewDevice = false;
      let isUpdate = false

      if (!fs.existsSync(`${root}/hosts`)) {
        await createDir();
      }

      if (!fs.existsSync(`${root}/hosts/${ID}`)) {
        isNewDevice = true;
        fs.writeFileSync(`${root}/hosts/${ID}`, JSON.stringify(hostData), {encoding: 'utf8'})
      } else {
        isNewDevice = false;
        const info = JSON.parse(fs.readFileSync(`${root}/hosts/${ID}`).toString().replace('\n', ''));
        Object.entries(info).forEach(([key, value]) => {
          if (DIFF_KEYS.includes(key) && hostData[key] !== value) {
            isUpdate = true;
          }
        });
        if (isUpdate) {
          fs.writeFileSync(`${root}/hosts/${ID}`, JSON.stringify(hostData), {encoding: 'utf8'});
        }
      }

      if (isNewDevice || isUpdate) {
        const messageContent = message({
          isNew: isNewDevice,
          hostName: hostData.hostName,
          netType: hostData.netType,
          online: hostData.online,
          ip: hostData.ip,
          hostAlias: hostData.hostAlias
        })
        await notification(messageContent);
      }
    }
  }
}
