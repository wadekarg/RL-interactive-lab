import type { Environment, StepResult } from './types'

export interface GridState {
  row: number
  col: number
}

/** Actions: 0=Up, 1=Right, 2=Down, 3=Left */
export type GridAction = 0 | 1 | 2 | 3

export const ACTION_NAMES = ['Up', 'Right', 'Down', 'Left'] as const
export const ACTION_DELTAS: Record<GridAction, [number, number]> = {
  0: [-1, 0],  // Up
  1: [0, 1],   // Right
  2: [1, 0],   // Down
  3: [0, -1],  // Left
}

export enum CellType {
  Empty = 0,
  Wall = 1,
  Goal = 2,
  Pit = 3,
  Start = 4,
}

export interface GridWorldConfig {
  rows: number
  cols: number
  grid: CellType[][]
  startPos: GridState
  goalPos: GridState
  goalReward: number
  stepPenalty: number
  pitPenalty: number
}

/**
 * GridWorld environment.
 * Agent navigates a grid to reach a goal, avoiding walls and pits.
 */
export class GridWorldEnvironment implements Environment<GridState, GridAction> {
  readonly config: GridWorldConfig

  constructor(config?: Partial<GridWorldConfig>) {
    this.config = { ...GridWorldEnvironment.defaultConfig(), ...config }
  }

  reset(): GridState {
    return { ...this.config.startPos }
  }

  step(state: GridState, action: GridAction): StepResult<GridState> {
    const [dr, dc] = ACTION_DELTAS[action]
    let newRow = state.row + dr
    let newCol = state.col + dc

    // Bounds check — stay in place if out of bounds
    if (newRow < 0 || newRow >= this.config.rows || newCol < 0 || newCol >= this.config.cols) {
      newRow = state.row
      newCol = state.col
    }

    // Wall check — stay in place
    if (this.config.grid[newRow][newCol] === CellType.Wall) {
      newRow = state.row
      newCol = state.col
    }

    const nextState = { row: newRow, col: newCol }
    const cell = this.config.grid[newRow][newCol]

    if (cell === CellType.Goal) {
      return { nextState, reward: this.config.goalReward, done: true }
    }
    if (cell === CellType.Pit) {
      return { nextState, reward: this.config.pitPenalty, done: true }
    }

    return { nextState, reward: this.config.stepPenalty, done: false }
  }

  getActions(_state: GridState): GridAction[] {
    return [0, 1, 2, 3]
  }

  /** Convert state to string key for Q-table lookup */
  static stateKey(state: GridState): string {
    return `${state.row},${state.col}`
  }

  /** Get all non-wall states */
  getAllStates(): GridState[] {
    const states: GridState[] = []
    for (let r = 0; r < this.config.rows; r++) {
      for (let c = 0; c < this.config.cols; c++) {
        if (this.config.grid[r][c] !== CellType.Wall) {
          states.push({ row: r, col: c })
        }
      }
    }
    return states
  }

  static defaultConfig(): GridWorldConfig {
    // 5x5 grid with walls and a pit
    const grid: CellType[][] = [
      [CellType.Start, CellType.Empty, CellType.Empty, CellType.Empty, CellType.Goal],
      [CellType.Empty, CellType.Wall,  CellType.Empty, CellType.Wall,  CellType.Empty],
      [CellType.Empty, CellType.Empty, CellType.Empty, CellType.Empty, CellType.Empty],
      [CellType.Empty, CellType.Wall,  CellType.Pit,   CellType.Empty, CellType.Empty],
      [CellType.Empty, CellType.Empty, CellType.Empty, CellType.Empty, CellType.Empty],
    ]
    return {
      rows: 5,
      cols: 5,
      grid,
      startPos: { row: 0, col: 0 },
      goalPos: { row: 0, col: 4 },
      goalReward: 10,
      stepPenalty: -0.1,
      pitPenalty: -10,
    }
  }
}
