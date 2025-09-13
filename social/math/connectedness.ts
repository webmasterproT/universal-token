/**
 * Connectedness Algorithms
 * C(A,B): Pairwise connectedness between two humans
 * C(A,S): Union connectedness between human A and set S
 */

export interface ConnectednessResult {
  score: number; // [0, 1] connectedness strength
  pathCount: number; // Number of independent paths
  shortestPath: number; // Length of shortest path
  diversityScore: number; // Path diversity measure
  confidence: number; // Confidence in the measurement
}

export interface ConnectednessOptions {
  maxDepth?: number; // Maximum path length to consider
  decayFactor?: number; // 1/3^n decay for responsibility ripple
  minPathDiversity?: number; // Minimum path independence required
  confidenceThreshold?: number; // Minimum confidence for valid result
}

const DEFAULT_OPTIONS: Required<ConnectednessOptions> = {
  maxDepth: 6,
  decayFactor: 1/3,
  minPathDiversity: 0.7,
  confidenceThreshold: 0.6
};

/**
 * Calculate pairwise connectedness C(A,B)
 * Uses 1/3^n weighted responsibility propagation with path diversity
 */
export function calculatePairwiseConnectedness(
  sourceHER: string,
  targetHER: string,
  sponsorGraph: Map<string, string[]>,
  options: ConnectednessOptions = {}
): ConnectednessResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Early return for direct connection
  if (sponsorGraph.get(sourceHER)?.includes(targetHER)) {
    return {
      score: 1.0,
      pathCount: 1,
      shortestPath: 1,
      diversityScore: 1.0,
      confidence: 1.0
    };
  }
  
  // Find all paths using bounded BFS with decay
  const paths = findWeightedPaths(sourceHER, targetHER, sponsorGraph, opts.maxDepth);
  
  if (paths.length === 0) {
    return {
      score: 0.0,
      pathCount: 0,
      shortestPath: Infinity,
      diversityScore: 0.0,
      confidence: 1.0
    };
  }
  
  // Calculate path weights with 1/3^n decay
  const weightedPaths = paths.map(path => ({
    path,
    weight: Math.pow(opts.decayFactor, path.length - 1),
    length: path.length
  }));
  
  // Calculate diversity score (independence of paths)
  const diversityScore = calculatePathDiversity(weightedPaths);
  
  // Aggregate weighted connectedness score
  const totalWeight = weightedPaths.reduce((sum, wp) => sum + wp.weight, 0);
  const normalizedScore = Math.min(1.0, totalWeight); // Cap at 1.0
  
  // Calculate confidence based on path count and diversity
  const confidence = calculateConfidence(weightedPaths, diversityScore);
  
  return {
    score: normalizedScore,
    pathCount: paths.length,
    shortestPath: Math.min(...paths.map(p => p.length)),
    diversityScore,
    confidence
  };
}

/**
 * Calculate union connectedness C(A,S) for human A and set S
 * Represents how connected A is to the collective S
 */
export function calculateUnionConnectedness(
  sourceHER: string,
  targetSet: string[],
  sponsorGraph: Map<string, string[]>,
  options: ConnectednessOptions = {}
): ConnectednessResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Calculate pairwise connectedness to each member of S
  const pairwiseResults = targetSet.map(target => 
    calculatePairwiseConnectedness(sourceHER, target, sponsorGraph, options)
  );
  
  // Filter out low-confidence results
  const validResults = pairwiseResults.filter(
    r => r.confidence >= opts.confidenceThreshold
  );
  
  if (validResults.length === 0) {
    return {
      score: 0.0,
      pathCount: 0,
      shortestPath: Infinity,
      diversityScore: 0.0,
      confidence: 0.0
    };
  }
  
  // Use maximum connectedness (best connection to set)
  const maxScore = Math.max(...validResults.map(r => r.score));
  const totalPaths = validResults.reduce((sum, r) => sum + r.pathCount, 0);
  const shortestPath = Math.min(...validResults.map(r => r.shortestPath));
  
  // Diversity is average of individual diversities, weighted by confidence
  const weightedDiversitySum = validResults.reduce(
    (sum, r) => sum + (r.diversityScore * r.confidence), 0
  );
  const totalConfidence = validResults.reduce((sum, r) => sum + r.confidence, 0);
  const avgDiversity = totalConfidence > 0 ? weightedDiversitySum / totalConfidence : 0;
  
  // Overall confidence is average of individual confidences
  const overallConfidence = validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length;
  
  return {
    score: maxScore,
    pathCount: totalPaths,
    shortestPath,
    diversityScore: avgDiversity,
    confidence: overallConfidence
  };
}

/**
 * Find weighted paths between source and target using bounded BFS
 */
function findWeightedPaths(
  source: string,
  target: string,
  graph: Map<string, string[]>,
  maxDepth: number
): string[][] {
  const paths: string[][] = [];
  const visited = new Set<string>();
  
  function dfs(current: string, path: string[], depth: number) {
    if (depth > maxDepth) return;
    if (visited.has(current) && current !== target) return;
    
    if (current === target && path.length > 1) {
      paths.push([...path]);
      return;
    }
    
    const neighbors = graph.get(current) || [];
    visited.add(current);
    
    for (const neighbor of neighbors) {
      if (!path.includes(neighbor)) { // Prevent cycles
        dfs(neighbor, [...path, neighbor], depth + 1);
      }
    }
    
    visited.delete(current);
  }
  
  dfs(source, [source], 0);
  
  // Remove duplicate paths and sort by length
  const uniquePaths = Array.from(
    new Set(paths.map(p => JSON.stringify(p)))
  ).map(p => JSON.parse(p) as string[]);
  
  return uniquePaths.sort((a, b) => a.length - b.length);
}

/**
 * Calculate path diversity score (independence measure)
 * Higher score = more independent paths = more robust connection
 */
function calculatePathDiversity(
  weightedPaths: Array<{ path: string[]; weight: number; length: number }>
): number {
  if (weightedPaths.length <= 1) return 1.0;
  
  // Calculate overlap between paths
  const totalOverlap = weightedPaths.reduce((totalOverlap, pathA, i) => {
    return totalOverlap + weightedPaths.slice(i + 1).reduce((pairOverlap, pathB) => {
      const overlapNodes = pathA.path.filter(
        (node, idx) => idx > 0 && idx < pathA.path.length - 1 && // Exclude endpoints
        pathB.path.includes(node)
      );
      const maxLength = Math.max(pathA.path.length, pathB.path.length);
      return pairOverlap + (overlapNodes.length / maxLength);
    }, 0);
  }, 0);
  
  const maxPossibleOverlap = (weightedPaths.length * (weightedPaths.length - 1)) / 2;
  const overlapRatio = maxPossibleOverlap > 0 ? totalOverlap / maxPossibleOverlap : 0;
  
  return Math.max(0, 1 - overlapRatio);
}

/**
 * Calculate confidence in connectedness measurement
 * Based on path count, diversity, and consistency of weights
 */
function calculateConfidence(
  weightedPaths: Array<{ path: string[]; weight: number; length: number }>,
  diversityScore: number
): number {
  if (weightedPaths.length === 0) return 0;
  
  // Base confidence from path count (more paths = higher confidence)
  const pathCountFactor = Math.min(1.0, weightedPaths.length / 3);
  
  // Diversity contribution (diverse paths = higher confidence)
  const diversityFactor = diversityScore;
  
  // Consistency factor (similar path lengths = higher confidence)
  const lengths = weightedPaths.map(wp => wp.length);
  const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const lengthVariance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
  const consistencyFactor = 1 / (1 + lengthVariance);
  
  // Combined confidence with weighted factors
  return (
    pathCountFactor * 0.4 +
    diversityFactor * 0.4 +
    consistencyFactor * 0.2
  );
}

/**
 * Batch calculate connectedness for multiple pairs
 * Optimized for network-wide trust dial calculations
 */
export function batchCalculateConnectedness(
  queries: Array<{ source: string; target: string | string[] }>,
  sponsorGraph: Map<string, string[]>,
  options: ConnectednessOptions = {}
): Map<string, ConnectednessResult> {
  const results = new Map<string, ConnectednessResult>();
  
  for (const query of queries) {
    const key = typeof query.target === 'string' 
      ? `${query.source}->${query.target}`
      : `${query.source}->[${query.target.join(',')}]`;
    
    const result = typeof query.target === 'string'
      ? calculatePairwiseConnectedness(query.source, query.target, sponsorGraph, options)
      : calculateUnionConnectedness(query.source, query.target, sponsorGraph, options);
    
    results.set(key, result);
  }
  
  return results;
}

/**
 * Build sponsor graph from HER data
 * Used as input for connectedness calculations
 */
export function buildSponsorGraph(herData: Map<string, { sponsors: string[] }>): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  
  for (const [herCID, data] of herData) {
    // Add bidirectional edges for sponsor relationships
    for (const sponsor of data.sponsors) {
      // Forward edge: sponsor -> human
      const sponsorEdges = graph.get(sponsor) || [];
      if (!sponsorEdges.includes(herCID)) {
        sponsorEdges.push(herCID);
        graph.set(sponsor, sponsorEdges);
      }
      
      // Backward edge: human -> sponsor (for path finding)
      const humanEdges = graph.get(herCID) || [];
      if (!humanEdges.includes(sponsor)) {
        humanEdges.push(sponsor);
        graph.set(herCID, humanEdges);
      }
    }
  }
  
  return graph;
}