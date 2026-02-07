import React from 'react';
import { SimVizRoot } from '../../../../affinity-viz/components/SimVizRoot';
// import { UniverseState, ViewLevel, EntityBase } from '../../../../affinity-viz/types'; // Types might need to be imported or mocked if not available strictly

import { useKernel } from '../../../hooks/useKernel';

export const AffinityVizPanel: React.FC = () => {
    const { state, dispatch, loadLocationFromAddress } = useKernel();

    // Map new selection event to old logic if needed, or just log
    const handleSelectionChange = (entity: any, level: any, universeState: any) => {
        console.log('[AffinityViz] Selection:', level, entity?.id);

        // If we want to trigger navigation/warp on selection of a specific level (e.g. Surface/City)
        // We could do it here.
        // For now, we just observe.
    };

    return (
        <div className="w-full h-full bg-[#020202]">
            <SimVizRoot
                embedded={true}
                onSelectionChange={handleSelectionChange}
            />
        </div>
    );
};
