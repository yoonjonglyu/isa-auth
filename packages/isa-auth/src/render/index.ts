/**
 * Framework-agnostic renderers for ISA-AUTH buttons
 * Supports Vanilla JS, React, Vue, Angular, and Web Components
 */

export interface ButtonRenderInfo {
  onClick: () => void;
  label?: string;
  className?: string;
  icon?: string;
  svg?: string;
  style?: Partial<CSSStyleDeclaration>;
}

/**
 * Creates and returns a native HTMLButtonElement with vector icons & micro-animations
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
  button.style.gap = '10px';
  button.style.cursor = 'pointer';
  button.style.userSelect = 'none';
  button.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';

  if (info.style) {
    Object.assign(button.style, info.style);
  }

  // 1. Vector SVG Icon (High-Quality Vector)
  if (info.svg) {
    const iconContainer = document.createElement('span');
    iconContainer.className = 'isa-auth-icon';
    iconContainer.style.display = 'inline-flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'center';
    iconContainer.innerHTML = info.svg;
    button.appendChild(iconContainer);
  } else if (info.icon) {
    const iconImg = document.createElement('img');
    iconImg.src = info.icon;
    iconImg.alt = info.label || 'Auth icon';
    iconImg.style.width = '18px';
    iconImg.style.height = '18px';
    button.appendChild(iconImg);
  }

  const textSpan = document.createElement('span');
  textSpan.textContent = info.label || 'Sign In';
  button.appendChild(textSpan);

  // Micro-interactions (Hover & Active state)
  if (typeof button.addEventListener === 'function') {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1.5px)';
      button.style.filter = 'brightness(1.05)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.filter = 'none';
    });
    button.addEventListener('mousedown', () => {
      button.style.transform = 'translateY(0.5px) scale(0.99)';
    });
    button.addEventListener('mouseup', () => {
      button.style.transform = 'translateY(-1.5px)';
    });
  }

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

/**
 * TypeScript JSX IntrinsicElements Declaration for Web Component <isa-auth-button>
 * Eliminates "Property 'isa-auth-button' does not exist on type 'JSX.IntrinsicElements'" in React/Vue/TSX
 */
export interface IsaAuthButtonAttributes {
  provider?: string;
  label?: string;
  class?: string;
  style?: string;
  'onisa-auth-click'?: (event: CustomEvent) => void;
  children?: any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'isa-auth-button': IsaAuthButtonAttributes;
    }
  }
}
