export interface IntroSlide {
  text: string;
  showProfessor: boolean;
  showPokemon: boolean;
}

export const INTRO_SLIDES = [
  {
    text: 'Hello there! Welcome to the\nworld of POKéMON!',
    showProfessor: true,
    showPokemon: false,
  },
  {
    text: 'My name is WILLOW. People call\nme the POKéMON PROFESSOR!',
    showProfessor: true,
    showPokemon: false,
  },
  {
    text: 'This world is inhabited by\ncreatures called POKéMON!',
    showProfessor: false,
    showPokemon: true,
  },
  {
    text: 'For some people, POKéMON are\npets. Others use them for\nfights.',
    showProfessor: false,
    showPokemon: true,
  },
  {
    text: 'Myself... I study POKéMON as\na profession.',
    showProfessor: true,
    showPokemon: false,
  },
  {
    text: 'The Aurum Region is home to\nPokémon found nowhere else.\nAether energy flows beneath\nour very feet.',
    showProfessor: true,
    showPokemon: false,
  },
  {
    text: 'But first, tell me a little\nabout yourself.',
    showProfessor: true,
    showPokemon: false,
  },
] as const satisfies readonly IntroSlide[];
