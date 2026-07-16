import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ExamState {
  currentExamId: string | null
  currentSessionId: string | null
  answers: Record<string, string>
  questionIds: string[]
  timeRemaining: number
  isExamActive: boolean
  examDuration: number | null
  answerCount: number
  serverStartedAt: string | null
  serverExpiresAt: string | null
  startExam: (examId: string, duration: number, sessionId?: string, serverStartedAt?: string, serverExpiresAt?: string) => void
  setSessionId: (sessionId: string) => void
  setAnswer: (questionId: string, answer: string) => void
  setQuestionIds: (ids: string[]) => void
  setTimeRemaining: (timeOrUpdater: number | ((prev: number) => number)) => void
  setServerTime: (startedAt: string, expiresAt: string) => void
  endExam: () => void
  resetExam: () => void
}

export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      currentExamId: null,
      currentSessionId: null,
      answers: {},
      questionIds: [],
      timeRemaining: 0,
      isExamActive: false,
      examDuration: null,
      answerCount: 0,
      serverStartedAt: null,
      serverExpiresAt: null,
      startExam: (examId, duration, sessionId, serverStartedAt, serverExpiresAt) =>
        set({
          currentExamId: examId,
          currentSessionId: sessionId || null,
          answers: {},
          answerCount: 0,
          timeRemaining: duration * 60,
          isExamActive: true,
          examDuration: duration,
          serverStartedAt: serverStartedAt || null,
          serverExpiresAt: serverExpiresAt || null,
        }),
      setSessionId: (sessionId) => set({ currentSessionId: sessionId }),
      setAnswer: (questionId, answer) =>
        set((state) => {
          const isNew = !(questionId in state.answers)
          return {
            answers: { ...state.answers, [questionId]: answer },
            answerCount: isNew ? state.answerCount + 1 : state.answerCount,
          }
        }),
      setQuestionIds: (ids) => set({ questionIds: ids }),
      setTimeRemaining: (timeOrUpdater) => set((state) => ({
        timeRemaining: typeof timeOrUpdater === 'function'
          ? (timeOrUpdater as (prev: number) => number)(state.timeRemaining)
          : timeOrUpdater
      })),
      setServerTime: (startedAt, expiresAt) => set({
        serverStartedAt: startedAt,
        serverExpiresAt: expiresAt,
      }),
      endExam: () => set({ isExamActive: false }),
      resetExam: () =>
        set({
          currentExamId: null,
          currentSessionId: null,
          answers: {},
          answerCount: 0,
          questionIds: [],
          timeRemaining: 0,
          isExamActive: false,
          examDuration: null,
          serverStartedAt: null,
          serverExpiresAt: null,
        }),
    }),
    {
      name: 'edu-exam',
    }
  )
)

export const useExamId = () => useExamStore((s) => s.currentExamId)
export const useExamSessionId = () => useExamStore((s) => s.currentSessionId)
export const useIsExamActive = () => useExamStore((s) => s.isExamActive)
export const useExamTimeRemaining = () => useExamStore((s) => s.timeRemaining)
export const useExamAnswers = () => useExamStore((s) => s.answers)
export const useExamQuestionIds = () => useExamStore((s) => s.questionIds)
export const useExamAnswerCount = () => useExamStore((s) => s.answerCount)
