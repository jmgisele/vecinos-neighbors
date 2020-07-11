import store from '@/store';

export function hideTooltip(event) {
  if (event && event.currentTarget) {
    event.currentTarget.removeEventListener('mouseleave', hideTooltip);
    event.currentTarget.removeEventListener('blur', hideTooltip);
  }
  store.commit('hideTooltip');
}

export function showTooltip(tooltip, target) {
  if (!tooltip) return;
  if (target) {
    target.addEventListener('mouseleave', hideTooltip);
    target.addEventListener('blur', hideTooltip);
  }

  if (typeof tooltip === 'string') store.commit('showTooltip', { message: tooltip, position: 'bottom', target });
  else store.commit('showTooltip', { target, position: 'bottom', ...tooltip });
}

export default { showTooltip, hideTooltip };
