import AuthCore from 'isa-auth-core';

const Core = new AuthCore({ providerType: 'base', secret: 'test123' });

// type build error provider not is null
const provider = Core.getProvider();

const service = Core.getService();
service.getAuthInfo();
