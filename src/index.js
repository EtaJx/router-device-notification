import login from './service/login.js';
import { handleHosts } from './utils/hosts.js';
import { getHostInfo } from './service/hostInfo.js';
import { PASSWORD } from './config/env.config.js';
import schedule from 'node-schedule';

const rule = new schedule.RecurrenceRule();
rule.second = 0;
rule.minute = [0, 10, 20, 30, 40, 50];

const handleInfo = async () => {
  console.log('begin work');
  login(PASSWORD).then(async cookie => {
    const hosts = await getHostInfo(cookie);
    await handleHosts(hosts);
  });
}

schedule.scheduleJob(rule, async () => {
  await handleInfo();
});

