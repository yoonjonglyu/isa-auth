import LoginButton from "./loginButton";

const metaLoginButton = new LoginButton({
  type: "rect",
  provider: "facebook",
  action: () => console.log("로그인 시도"),
  config: {
    id: "login-meta",
    text: "Facebook 계정으로 로그인",
    fullWidth: true,
    style: {
      backgroundColor: "#4267B2",
      color: "#fff",
    },
  },
});

export default metaLoginButton;
