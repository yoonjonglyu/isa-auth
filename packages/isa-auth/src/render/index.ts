/**
 * Framework-agnostic renderers for ISA-AUTH buttons
 * Supports Vanilla JS, React, Vue, Angular, and Web Components
 */

export interface ButtonRenderInfo {
  onClick: () => void;
  label?: string;
  className?: string;
  icon?: string;
  style?: Partial<CSSStyleDeclaration>;
}

/**
 * Creates and returns a native HTMLButtonElement
 */
export function renderByJs(info: ButtonRenderInfo): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.onclick = info.onClick;

  if (info.className) {
    button.className = info.className;
  }

  // Base layout styling
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.gap = '8px';
  button.style.cursor = 'pointer';

  if (info.style) {
    Object.assign(button.style, info.style);
  }

  if (info.icon) {
    const iconImg = document.createElement('img');
    iconImg.src = info.icon;
    iconImg.alt = info.label || 'Auth icon';
    iconImg.style.width = '20px';
    iconImg.style.height = '20px';
    button.appendChild(iconImg);
  }

  const textSpan = document.createElement('span');
  textSpan.textContent = info.label || 'Sign In';
  button.appendChild(textSpan);

  return button;
}

/**
 * React createElement wrapper
 */
export function renderByReact(info: ButtonRenderInfo) {
  try {
    const React =
      typeof (globalThis as any).require === 'function'
        ? (globalThis as any).require('react')
        : (typeof window !== 'undefined' ? (window as any).React : null);
    if (!React) return null;
    const children = [];
    if (info.icon) {
      children.push(
        React.createElement('img', {
          key: 'icon',
          src: info.icon,
          alt: info.label || 'Auth icon',
          style: { width: '20px', height: '20px' },
        })
      );
    }
    children.push(info.label || 'Sign In');

    return React.createElement(
      'button',
      {
        onClick: info.onClick,
        className: info.className,
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          ...info.style,
        },
      },
      ...children
    );
  } catch {
    console.warn('[ISA-AUTH] React is not available in the current environment.');
    return null;
  }
}

/**
 * Vue 3 / 2 Component definition object
 */
export function renderByVue(info: ButtonRenderInfo) {
  return {
    name: 'IsaAuthButton',
    props: {
      label: {
        type: String,
        default: info.label || 'Sign In',
      },
    },
    emits: ['click'],
    template: `
      <button 
        type="button" 
        :class="className" 
        :style="buttonStyle" 
        @click="handleClick"
      >
        <img v-if="icon" :src="icon" style="width: 20px; height: 20px;" alt="" />
        <span>{{ label }}</span>
      </button>
    `,
    data() {
      return {
        className: info.className,
        icon: info.icon,
        buttonStyle: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          ...info.style,
        },
      };
    },
    methods: {
      handleClick() {
        if (info.onClick) info.onClick();
        this.$emit('click');
      },
    },
  };
}

/**
 * Registers custom Web Component <isa-auth-button>
 */
export function registerWebComponent() {
  if (typeof window === 'undefined' || !window.customElements) return;
  if (customElements.get('isa-auth-button')) return;

  class IsaAuthButtonElement extends HTMLElement {
    connectedCallback() {
      const label = this.getAttribute('label') || 'Sign In';
      const className = this.getAttribute('class') || '';
      const button = renderByJs({
        label,
        className,
        onClick: () => {
          this.dispatchEvent(new CustomEvent('isa-auth-click', { bubbles: true }));
        },
      });
      this.appendChild(button);
    }
  }

  customElements.define('isa-auth-button', IsaAuthButtonElement);
}
