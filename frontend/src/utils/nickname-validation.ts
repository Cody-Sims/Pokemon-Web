/** Shared nickname validation constants used by NicknameScene and IntroScene. */

/** Characters allowed in a nickname: letters, digits, spaces, hyphens. */
export const NICKNAME_CHAR_REGEX = /^[a-zA-Z0-9 \-]$/;

/** Regex to strip invalid characters from DOM input values. */
export const NICKNAME_STRIP_REGEX = /[^a-zA-Z0-9 \-]/g;

/** Maximum nickname length. */
export const NICKNAME_MAX_LENGTH = 12;
