// A minimal local implementation of the graph pattern our production agents
// use (LangGraph): named nodes, plain edges, and conditional edges that route
// on state. State is a plain object; each node returns a partial update.

export const END = '__end__';

export class StateGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();       // node -> next node
    this.conditional = new Map(); // node -> (state) => next node
    this.entry = null;
  }

  addNode(name, fn) {
    this.nodes.set(name, fn);
    return this;
  }

  setEntryPoint(name) {
    this.entry = name;
    return this;
  }

  addEdge(from, to) {
    this.edges.set(from, to);
    return this;
  }

  // router(state) returns the name of the next node (or END).
  addConditionalEdges(from, router) {
    this.conditional.set(from, router);
    return this;
  }

  compile() {
    const { nodes, edges, conditional, entry } = this;
    if (!entry) throw new Error('graph has no entry point');
    return {
      async invoke(initialState) {
        let state = { ...initialState };
        let current = entry;
        let hops = 0;
        while (current !== END) {
          if (++hops > 25) throw new Error('graph exceeded max hops — cycle?');
          const node = nodes.get(current);
          if (!node) throw new Error(`unknown node: ${current}`);
          const update = await node(state);
          state = { ...state, ...(update ?? {}) };
          const router = conditional.get(current);
          current = router ? router(state) : edges.get(current) ?? END;
        }
        return state;
      },
    };
  }
}
