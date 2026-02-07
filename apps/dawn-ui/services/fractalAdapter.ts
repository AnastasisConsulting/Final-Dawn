type Target = 'navbot' | 'vizzy' | 'lyra';

type FractalContext = {
  settingsPrompt?: string;
  objectKey?: string;
};

export function runFractalTurn(text: string, target: Target, ctx: FractalContext): { output: { scene: { title: string; text: string }; nav: { hint: string; joke: string } }; response: string; suggestions: string[] } {
  const output = {
    scene: {
      title: 'Simulated Fractal Field',
      text: `You prodded the fractal kernel with "${text}". Context: ${ctx.objectKey || 'unknown'}`
    },
    nav: {
      hint: 'The way forward is the next button.',
      joke: 'Fractals only respond to sarcasm, apparently.'
    }
  };
  const response = `${output.scene.title}\n\n${output.scene.text}\n\nNav hint: ${output.nav.hint}\nNav joke: ${output.nav.joke}`;
  const suggestions = ['Say hi to Lyra', 'Look around', 'Check the dock panels'];
  return { output, response, suggestions };
}

export function resetFractalSession() {
  // no-op stub
}
