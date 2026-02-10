import { ScaleNode } from "./scaleNode";
import { Scale } from "./scaleTypes";

export class ScaleGraph {
    nodes: ScaleNode[] = [];

    addNode(node: ScaleNode) {
        this.nodes.push(node);
    }

    connect(childId: string, parentId: string) {
        const child = this.nodes.find(n => n.id === childId);
        const parent = this.nodes.find(n => n.id === parentId);
        if (!child || !parent) return;
        child.parent = parent;
    }

    tickAll(baseDt = 1) {
        // fast → slow
        const ordered = [...this.nodes].sort(
            (a, b) =>
                tickMultiplier(b.scale) - tickMultiplier(a.scale)
        );

        for (const node of ordered) {
            node.tick(baseDt);
            node.propagateUp();
        }
    }
}
