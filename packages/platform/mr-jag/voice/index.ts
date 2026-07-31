/**
 * Voice surface — stub adapter for future TTS/STT (no SDK contract changes).
 */

export type MrJagVoiceUtterance = {
  readonly text: string;
  readonly locale: string;
  readonly ssml?: string;
};

export function synthesizeMrJagVoice(input: {
  text: string;
  locale?: string;
}): MrJagVoiceUtterance {
  return {
    text: input.text,
    locale: input.locale ?? "en-US",
    ssml: `<speak>${input.text}</speak>`,
  };
}

export function createMrJagVoiceService() {
  return { synthesize: synthesizeMrJagVoice };
}
