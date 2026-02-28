import { create } from 'zustand'
import type { SimulationStep, SimulationStatus } from '../algorithms/types'

interface SimulationState {
  status: SimulationStatus
  speed: number            // ms per step
  stepsPerTick: number     // how many env steps per timer tick (speed multiplier)
  currentStep: number
  totalStepCount: number   // actual total env steps (including silent/batched ones)
  history: SimulationStep[]
  totalReward: number
  selectedStepIndex: number | null

  // Actions
  setStatus: (status: SimulationStatus) => void
  setSpeed: (speed: number) => void
  setStepsPerTick: (n: number) => void
  addStep: (step: SimulationStep) => void
  setTotalStepCount: (n: number) => void
  reset: () => void
  setCurrentStep: (step: number) => void
  setSelectedStepIndex: (index: number | null) => void
}

export const useSimulationStore = create<SimulationState>((set) => ({
  status: 'idle',
  speed: 200,
  stepsPerTick: 1,
  currentStep: 0,
  totalStepCount: 0,
  history: [],
  totalReward: 0,
  selectedStepIndex: null,

  setStatus: (status) => set({ status }),
  setSpeed: (speed) => set({ speed }),
  setStepsPerTick: (n) => set({ stepsPerTick: n }),
  addStep: (step) =>
    set((state) => ({
      history: [...state.history, step],
      currentStep: state.history.length,
      totalReward: state.totalReward + step.reward,
    })),
  setTotalStepCount: (n) => set({ totalStepCount: n }),
  reset: () =>
    set({
      status: 'idle',
      currentStep: 0,
      totalStepCount: 0,
      history: [],
      totalReward: 0,
      selectedStepIndex: null,
    }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setSelectedStepIndex: (index) => set({ selectedStepIndex: index }),
}))
