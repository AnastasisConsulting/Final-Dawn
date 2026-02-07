import { useGame } from '../context/GameContext';

export const useRelationship = () => {
    const { state, actions } = useGame();
    const { relationships } = state;

    const updateRelationship = (target: 'lyra' | 'vizzy' | 'navbot', delta: number) => {
        const current = relationships[target];
        // Clamp between 0 and 100
        const newValue = Math.max(0, Math.min(100, current + delta));
        actions.updateRelationship(target, newValue);
    };

    const setRelationship = (target: 'lyra' | 'vizzy' | 'navbot', value: number) => {
        actions.updateRelationship(target, Math.max(0, Math.min(100, value)));
    };

    return {
        relationships,
        updateRelationship,
        setRelationship
    };
};
