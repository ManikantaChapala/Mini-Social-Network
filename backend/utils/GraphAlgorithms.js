class Graph {
  constructor() {
    this.adjacencyList = new Map();
  }

  // Add vertex (user)
  addVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
  }

  // Add edge (friendship)
  addEdge(vertex1, vertex2) {
    this.addVertex(vertex1);
    this.addVertex(vertex2);
    this.adjacencyList.get(vertex1).push(vertex2);
    this.adjacencyList.get(vertex2).push(vertex1);
  }

  // BFS for finding shortest path between users
  bfsShortestPath(start, end) {
    if (start === end) return [start];
    
    const queue = [[start]];
    const visited = new Set([start]);

    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];
      
      const neighbors = this.adjacencyList.get(node) || [];
      
      for (const neighbor of neighbors) {
        if (neighbor === end) {
          return [...path, neighbor];
        }
        
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    
    return null; // No path found
  }

  // DFS for community detection
  dfsComponentDetection() {
    const visited = new Set();
    const components = [];

    for (const vertex of this.adjacencyList.keys()) {
      if (!visited.has(vertex)) {
        const component = [];
        this.dfsHelper(vertex, visited, component);
        components.push(component);
      }
    }

    return components;
  }

  dfsHelper(vertex, visited, component) {
    visited.add(vertex);
    component.push(vertex);

    const neighbors = this.adjacencyList.get(vertex) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        this.dfsHelper(neighbor, visited, component);
      }
    }
  }

  // Find mutual friends
  findMutualFriends(user1, user2) {
    const friends1 = new Set(this.adjacencyList.get(user1) || []);
    const friends2 = new Set(this.adjacencyList.get(user2) || []);
    
    return [...friends1].filter(friend => friends2.has(friend));
  }

  // Minimum Spanning Tree for optimal friend suggestions
  kruskalMST(edges) {
    // Sort edges by weight (connection strength)
    edges.sort((a, b) => a.weight - b.weight);
    
    const parent = new Map();
    const rank = new Map();
    
    // Initialize Union-Find
    const makeSet = (vertex) => {
      parent.set(vertex, vertex);
      rank.set(vertex, 0);
    };
    
    const find = (vertex) => {
      if (parent.get(vertex) !== vertex) {
        parent.set(vertex, find(parent.get(vertex)));
      }
      return parent.get(vertex);
    };
    
    const union = (vertex1, vertex2) => {
      const root1 = find(vertex1);
      const root2 = find(vertex2);
      
      if (root1 !== root2) {
        if (rank.get(root1) < rank.get(root2)) {
          parent.set(root1, root2);
        } else if (rank.get(root1) > rank.get(root2)) {
          parent.set(root2, root1);
        } else {
          parent.set(root2, root1);
          rank.set(root1, rank.get(root1) + 1);
        }
        return true;
      }
      return false;
    };

    // Initialize all vertices
    const vertices = new Set();
    edges.forEach(edge => {
      vertices.add(edge.from);
      vertices.add(edge.to);
    });
    
    vertices.forEach(vertex => makeSet(vertex));

    const mst = [];
    for (const edge of edges) {
      if (union(edge.from, edge.to)) {
        mst.push(edge);
      }
    }

    return mst;
  }
}

// Priority Queue implementation for feed ranking
class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  enqueue(item, priority) {
    this.heap.push({ item, priority });
    this.heapifyUp();
  }

  dequeue() {
    if (this.heap.length === 0) return null;
    
    const max = this.heap[0];
    const end = this.heap.pop();
    
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.heapifyDown();
    }
    
    return max.item;
  }

  heapifyUp() {
    let index = this.heap.length - 1;
    
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      
      if (this.heap[parentIndex].priority >= this.heap[index].priority) break;
      
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  heapifyDown() {
    let index = 0;
    
    while (this.leftChild(index) < this.heap.length) {
      const leftChildIndex = this.leftChild(index);
      const rightChildIndex = this.rightChild(index);
      
      let maxIndex = leftChildIndex;
      
      if (rightChildIndex < this.heap.length && 
          this.heap[rightChildIndex].priority > this.heap[leftChildIndex].priority) {
        maxIndex = rightChildIndex;
      }
      
      if (this.heap[index].priority >= this.heap[maxIndex].priority) break;
      
      [this.heap[index], this.heap[maxIndex]] = [this.heap[maxIndex], this.heap[index]];
      index = maxIndex;
    }
  }

  leftChild(index) {
    return 2 * index + 1;
  }

  rightChild(index) {
    return 2 * index + 2;
  }

  isEmpty() {
    return this.heap.length === 0;
  }
}

// Topological sort for timeline organization
class TopologicalSort {
  static sort(posts) {
    const graph = new Map();
    const inDegree = new Map();
    
    // Initialize graph
    posts.forEach(post => {
      graph.set(post._id.toString(), []);
      inDegree.set(post._id.toString(), 0);
    });
    
    // Build dependency graph based on shares and replies
    posts.forEach(post => {
      post.shares.forEach(share => {
        const sharedPostId = share.originalPost?.toString();
        if (sharedPostId && graph.has(sharedPostId)) {
          graph.get(sharedPostId).push(post._id.toString());
          inDegree.set(post._id.toString(), inDegree.get(post._id.toString()) + 1);
        }
      });
    });
    
    // Kahn's algorithm
    const queue = [];
    const result = [];
    
    // Find all nodes with no incoming edges
    for (const [node, degree] of inDegree) {
      if (degree === 0) {
        queue.push(node);
      }
    }
    
    while (queue.length > 0) {
      const current = queue.shift();
      result.push(current);
      
      const neighbors = graph.get(current) || [];
      neighbors.forEach(neighbor => {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }
    
    return result;
  }
}

module.exports = {
  Graph,
  PriorityQueue,
  TopologicalSort
};