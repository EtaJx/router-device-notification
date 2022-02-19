export const message = ({ isNew, hostName, netType, online, ip, hostAlias }) => {
  const newDeviceMessage = `新设备: ${hostName} | ${netType === 'Ethernet' ? '有线' : '无线'} | ${online === 'online' ? '在线' : '离线'} | ${ip}`;
  const updateDeviceMessage = `设备: ${hostName} ${'| ' | hostAlias || ''} | ${netType === 'Ethernet' ? '有线' : '无线'} | ${online === 'online' ? '在线' : '离线'} | ${ip}`;
  return isNew ? newDeviceMessage : updateDeviceMessage;
}
