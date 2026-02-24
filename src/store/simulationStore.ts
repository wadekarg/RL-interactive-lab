import { create } from 'zustand'
import type { SimulationStep, SimulationStatus } from '../algorithms/types'

interface SimulationState {
  status: SimulationStatus
  speed: number            // ms per step
  currentStep: number
  history: SimulationStep[]
  totalReward: number
  selectedStepIndex: number | null

  // Actions
  setStatus: (status: SimulationStatus) => void
  setSpeed: (speed: number) => void
  addStep: (step: SimulationStep) => void
  reset: () => void
  setCurrentStep: (step: number) => void
  setSelectedStepIndex: (index: number | null) => void
}

export const useSimulationStore = create<SimulationState>((set) => ({
  status: 'idle',
  speed: 200,
  currentStep: 0,
  history: [],
  totalReward: 0,
  selectedStepIndex: null,

  setStatus: (status) => set({ status }),
  setSpeed: (speed) => set({ speed }),
  addStep: (step) =>
    set((state) => ({
      history: [...state.history, step],
      currentStep: state.history.length,
      totalReward: state.totalReward + step.reward,
    })),
  reset: () =>
    set({
      status: 'idle',
      currentStep: 0,
      history: [],
      totalReward: 0,
      selectedStepIndex: null,
    }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setSelectedStepIndex: (index) => set({ selectedStepIndex: index }),
}))
