import AuthCore from 'isa-auth-core';

const GCore = new AuthCore({ providerType: 'google', secret: 'test123' });

// type build error provider not is null type.
const googleProvider = GCore.getProvider();
const GAuth = new googleProvider({
  clientId: '',
  callback: (token: string) => {
    return token;
  },
});
GAuth.init();
const Gservice = GCore.getService();
Gservice.getAuthInfo();
const Gbutton = GCore.getButton();

// const LineCore = new AuthCore({ providerType: 'line', secret: 'test123' });
// const LineProvider = LineCore.getProvider();
// const LAuth = new LineProvider({
//   clientId: '',
//   callback: (token: string) => {
//     return token;
//   },
// });
// LAuth.init();
// const Lservice = LineCore.getService();
// Lservice.getAuthInfo();
// const Lbutton = LineCore.getButton();
