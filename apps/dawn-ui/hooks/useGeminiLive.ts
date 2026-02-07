interface UseGeminiLiveProps {
  onTranscription: (text: string, sender: 'user' | 'model') => void;
}

export const useGeminiLive = (_props: UseGeminiLiveProps) => {
  return {
    isActive: false,
    isSpeaking: false,
    toggle: () => {},
  };
};
