export interface DomTextInputAdapterOptions {
  maxLength: number;
  name: string;
  top: string;
  left?: string;
  width?: string;
  sanitize?: (value: string) => string;
  onInput: (value: string) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export class DomTextInputAdapter {
  private input?: HTMLInputElement;
  private readonly sanitize: (value: string) => string;
  private focusTimer?: number;
  private readonly handleInput = (): void => {
    if (!this.input) return;
    const value = this.sanitize(this.input.value).slice(0, this.options.maxLength);
    this.input.value = value;
    this.options.onInput(value);
  };
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && this.options.onSubmit) {
      event.preventDefault();
      event.stopPropagation();
      this.options.onSubmit();
      return;
    }
    if (event.key === 'Escape' && this.options.onCancel) {
      event.preventDefault();
      event.stopPropagation();
      this.options.onCancel();
    }
  };

  constructor(private readonly options: DomTextInputAdapterOptions) {
    this.sanitize = options.sanitize ?? ((value: string) => value.slice(0, options.maxLength));
  }

  mount(): HTMLInputElement | undefined {
    if (typeof document === 'undefined') return undefined;
    if (this.input) return this.input;

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = this.options.maxLength;
    input.autocomplete = 'off';
    input.autocapitalize = 'words';
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('inputmode', 'text');
    input.name = this.options.name;
    Object.assign(input.style, {
      position: 'fixed',
      left: this.options.left ?? '50%',
      top: this.options.top,
      transform: 'translate(-50%, -50%)',
      width: this.options.width ?? '200px',
      fontSize: '16px',
      opacity: '0',
      zIndex: '9999',
      pointerEvents: 'none',
    });
    input.addEventListener('input', this.handleInput);
    input.addEventListener('keydown', this.handleKeyDown);
    document.body.appendChild(input);
    this.input = input;
    return input;
  }

  focus(): void {
    this.input?.focus();
  }

  focusTemporarily(durationMs = 500): void {
    const input = this.input;
    if (!input) return;
    input.style.pointerEvents = 'auto';
    input.focus();
    if (this.focusTimer !== undefined) window.clearTimeout(this.focusTimer);
    this.focusTimer = window.setTimeout(() => {
      if (this.input) this.input.style.pointerEvents = 'none';
      this.focusTimer = undefined;
    }, durationMs);
  }

  isFocused(): boolean {
    return Boolean(this.input && document.activeElement === this.input);
  }

  setValue(value: string): void {
    if (!this.input) return;
    const sanitized = this.sanitize(value).slice(0, this.options.maxLength);
    this.input.value = sanitized;
  }

  destroy(): void {
    if (this.focusTimer !== undefined) {
      window.clearTimeout(this.focusTimer);
      this.focusTimer = undefined;
    }
    if (!this.input) return;
    this.input.removeEventListener('input', this.handleInput);
    this.input.removeEventListener('keydown', this.handleKeyDown);
    this.input.blur();
    this.input.remove();
    this.input = undefined;
  }
}
