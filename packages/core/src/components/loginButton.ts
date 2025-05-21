class LoginButton {
  label: string;
  action: Function;
  config: {
    id: string;
    type: string;
    style: Record<string, any>;
  };

  constructor({ label = 'Login', action, config }) {
    this.label = label;
    this.config = config;
    this.action = action;
  }
  
  getButtonClass(): string {
    return `btn-isa-login-${this.label}`;
  }

  toJSON() {
    return {
      id: this.config.id,
      type: this.config.type,
      label: this.label,
      style: this.config.style,
      onClick: this.action,
      className: this.getButtonClass(),
    };
  }
}

export default LoginButton;
