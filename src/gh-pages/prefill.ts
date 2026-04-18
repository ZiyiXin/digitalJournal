const DEMO_EMAIL = (import.meta.env.VITE_DEMO_EMAIL ?? 'demo@digital-journal.local').trim();
const DEMO_PASSWORD = (import.meta.env.VITE_DEMO_PASSWORD ?? 'Demo123456!').trim();
const DEMO_NICKNAME = (import.meta.env.VITE_DEMO_NICKNAME ?? 'Demo User').trim();

function setInputValue(input: HTMLInputElement, value: string) {
  if (input.value === value) return;

  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event('input', {bubbles: true}));
  input.dispatchEvent(new Event('change', {bubbles: true}));
}

function fillDemoCredentials() {
  const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement | null;
  const passwordInput = document.querySelector('input[autocomplete="current-password"], input[autocomplete="new-password"]') as HTMLInputElement | null;
  const nicknameInput = document.querySelector('input[autocomplete="nickname"]') as HTMLInputElement | null;

  if (emailInput) setInputValue(emailInput, DEMO_EMAIL);
  if (passwordInput) setInputValue(passwordInput, DEMO_PASSWORD);
  if (nicknameInput && !nicknameInput.value) setInputValue(nicknameInput, DEMO_NICKNAME);
}

export function installDemoLoginPrefill() {
  const scheduleFill = () => {
    window.requestAnimationFrame(() => {
      fillDemoCredentials();
    });
  };

  scheduleFill();

  const observer = new MutationObserver(() => {
    scheduleFill();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return () => observer.disconnect();
}
