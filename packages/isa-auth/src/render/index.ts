/**
 *  @todo provider button objects render other UI components.
 * object for various UI components (JS, React, Vue, etc.)
 * Each key is a component name, and the value is the component itself.
 */

// Example: Plain JS, React, and Vue components

// Plain JS component (function)
function JsButton(props) {
  const button = document.createElement('button');
  button.textContent = props.label || 'JS Button';
  button.onclick = props.onClick;
  return button;
}

// React component
const ReactButton = function (props: { label?: string; onClick?: () => void }) {
  const React = require('react');
  return React.createElement(
    'button',
    { onClick: props.onClick },
    props.label || 'React Button',
  );
};

// Vue component (Options API)
const VueButton = {
  props: ['label'],
  template: `<button @click="$emit('click')">{{ label || 'Vue Button' }}</button>`,
};