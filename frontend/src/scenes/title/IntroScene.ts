import Phaser from 'phaser';
import { INTRO_SLIDES } from '@data/intro-slides';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { SFX } from '@utils/audio-keys';
import { SceneRouter } from '@scenes/SceneRouter';
import { SceneKey } from '@scenes/scene-keys';
import type { IntroSceneData } from '@scenes/scene-data';
import { SceneInputRegistry } from '@scenes/SceneInputRegistry';
import { isMobile } from '@ui/theme';
import { NICKNAME_MAX_LENGTH } from '@utils/nickname-validation';
import { DomTextInputAdapter } from '@ui/dom/DomTextInputAdapter';
import { NameEntryPanel } from '@ui/widgets/NameEntryPanel';
import { AppearancePicker, type AppearanceIndex } from '@ui/widgets/AppearancePicker';
import { ProfessorIntroView } from '@ui/widgets/ProfessorIntroView';
import {
  IntroFlowController,
  sanitizeNameInput,
  canAppendNameCharacter,
  type IntroAppearance,
} from './IntroFlowController';

export class IntroScene extends Phaser.Scene {
  private isAnimating = false;
  private flow = new IntroFlowController();
  private introView?: ProfessorIntroView;
  private namePanel?: NameEntryPanel;
  private appearancePicker?: AppearancePicker;
  private hiddenInput?: DomTextInputAdapter;

  private readonly inputRegistry = new SceneInputRegistry(this);

  constructor() {
    super({ key: SceneKey.Intro });
  }

  init(data?: IntroSceneData): void {
    this.flow = new IntroFlowController({
      difficulty: data?.difficulty,
      challengeModes: Array.isArray(data?.challengeModes) ? data.challengeModes : [],
    });
  }

  create(): void {
    this.introView = new ProfessorIntroView(this);
    this.showCurrentSlide();
    this.bindAdvanceInput();
    this.events.once('shutdown', this.shutdown, this);
  }

  shutdown(): void {
    this.inputRegistry.clear();
    this.destroyHiddenInput();
    this.introView?.destroy();
    this.introView = undefined;
    this.namePanel?.destroy();
    this.namePanel = undefined;
    this.appearancePicker?.destroy();
    this.appearancePicker = undefined;
  }

  private bindAdvanceInput(): void {
    this.inputRegistry.clear();
    this.inputRegistry.bindKey('keydown-ENTER', () => this.advance());
    this.inputRegistry.bindKey('keydown-SPACE', () => this.advance());
    this.inputRegistry.bindPointer(this.input, 'pointerdown', () => this.advance());
  }

  private advance(): void {
    if (this.isAnimating) return;
    const result = this.flow.advance(INTRO_SLIDES.length);
    if (result === 'slide') {
      this.showCurrentSlide();
      return;
    }
    if (result === 'naming') {
      this.showNamingScreen();
      return;
    }
    if (result === 'done') this.finishIntro();
  }

  private showCurrentSlide(): void {
    const slide = INTRO_SLIDES[this.flow.getState().slideIndex];
    if (!slide || !this.introView) return;
    this.isAnimating = true;
    this.introView.showSlide(slide, () => {
      this.isAnimating = false;
    });
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
  }

  private showNamingScreen(): void {
    this.isAnimating = true;
    this.introView?.fadeOut(() => {
      this.inputRegistry.clear();
      this.introView?.destroy();
      this.introView = undefined;
      this.namePanel = new NameEntryPanel(this, {
        onPreset: name => this.applyPresetName(name),
        onDone: () => this.confirmName(),
        onSkip: () => {
          this.flow.setNameInput('Red');
          this.confirmName();
        },
        onFocusInput: () => this.hiddenInput?.focusTemporarily(),
      });
      this.createMobileInput();
      this.bindNameInput();
      this.isAnimating = false;
    });
  }

  private createMobileInput(): void {
    if (!isMobile()) return;
    this.hiddenInput = new DomTextInputAdapter({
      maxLength: NICKNAME_MAX_LENGTH,
      name: 'nickname-disabled',
      top: '40%',
      sanitize: sanitizeNameInput,
      onInput: value => {
        this.flow.setNameInput(value);
        this.namePanel?.setName(value);
      },
    });
    this.hiddenInput.mount();
  }

  private bindNameInput(): void {
    this.inputRegistry.bindKey('keydown', (event: KeyboardEvent) => {
      if (this.hiddenInput?.isFocused()) return;
      if (event.key === 'Enter') {
        this.confirmName();
        return;
      }
      if (event.key === 'Backspace') {
        this.namePanel?.setName(this.flow.backspaceName());
        return;
      }
      const { nameInput } = this.flow.getState();
      if (canAppendNameCharacter(nameInput, event.key)) {
        this.namePanel?.setName(this.flow.appendNameCharacter(event.key));
      }
    });
  }

  private applyPresetName(name: string): void {
    this.namePanel?.setName(this.flow.setNameInput(name));
    this.hiddenInput?.setValue(name);
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
  }

  private confirmName(): void {
    this.destroyHiddenInput();
    const name = this.flow.confirmName();
    const state = this.flow.getState();
    const gm = GameManager.getInstance();
    gm.setPlayerName(name);
    gm.setDifficulty(state.difficulty);
    gm.setChallengeModes([...state.challengeModes]);
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    this.showAppearanceScreen();
  }

  private showAppearanceScreen(): void {
    this.isAnimating = true;
    this.inputRegistry.clear();
    this.namePanel?.fadeOut(() => {
      this.namePanel?.destroy();
      this.namePanel = undefined;
      this.appearancePicker = new AppearancePicker(this, {
        initialSelection: this.appearanceToIndex(this.flow.getState().appearance),
        onSelect: selection => {
          this.flow.selectAppearance(this.indexToAppearance(selection));
          AudioManager.getInstance().playSFX(SFX.CURSOR);
        },
        onDone: () => this.confirmAppearance(),
      });
      this.bindAppearanceInput();
      this.isAnimating = false;
    });
  }

  private bindAppearanceInput(): void {
    const select = (selection: AppearanceIndex) => this.appearancePicker?.select(selection);
    this.inputRegistry.bindKey('keydown-LEFT', () => select(0));
    this.inputRegistry.bindKey('keydown-RIGHT', () => select(1));
    this.inputRegistry.bindKey('keydown-UP', () => select(0));
    this.inputRegistry.bindKey('keydown-DOWN', () => select(1));
    this.inputRegistry.bindKey('keydown-ENTER', () => this.confirmAppearance());
  }

  private confirmAppearance(): void {
    const appearance = this.flow.confirmAppearance();
    GameManager.getInstance().setPlayerGender(appearance);
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    this.showConfirmation(this.flow.getState().playerName);
  }

  private showConfirmation(name: string): void {
    this.isAnimating = true;
    this.inputRegistry.clear();
    this.appearancePicker?.fadeOut(() => {
      this.appearancePicker?.destroy();
      this.appearancePicker = undefined;
      this.introView = new ProfessorIntroView(this, { showHint: false });
      this.introView.showConfirmation(name, () => {
        this.bindAdvanceInput();
        this.isAnimating = false;
      });
    });
  }

  private finishIntro(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.cameras.main.flash(500, 255, 255, 255);
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      SceneRouter.for(this).transitionTo(SceneKey.Overworld);
    });
  }

  private destroyHiddenInput(): void {
    this.hiddenInput?.destroy();
    this.hiddenInput = undefined;
  }

  private appearanceToIndex(appearance: IntroAppearance): AppearanceIndex {
    return appearance === 'boy' ? 0 : 1;
  }

  private indexToAppearance(index: AppearanceIndex): IntroAppearance {
    return index === 0 ? 'boy' : 'girl';
  }
}
