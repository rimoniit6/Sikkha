type ViewMode = string

export type NavigationState = {
  viewMode: ViewMode
  editId: string | null
  selectedPackageId: string | null
  selectedSetId: string | null
  deleteTarget: { type: 'package' | 'set'; id: string; packageId?: string } | null
}

export type NavigationAction =
  | { type: 'SET_VIEW'; viewMode: ViewMode }
  | { type: 'SET_EDIT_ID'; editId: string | null }
  | { type: 'SELECT_PACKAGE'; packageId: string | null }
  | { type: 'SELECT_SET'; setId: string | null }
  | { type: 'SET_DELETE_TARGET'; target: NavigationState['deleteTarget'] }
  | { type: 'RESET' }

export const initialNavigationState: NavigationState = {
  viewMode: 'list',
  editId: null,
  selectedPackageId: null,
  selectedSetId: null,
  deleteTarget: null,
}

export function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, viewMode: action.viewMode }
    case 'SET_EDIT_ID':
      return { ...state, editId: action.editId }
    case 'SELECT_PACKAGE':
      return { ...state, selectedPackageId: action.packageId }
    case 'SELECT_SET':
      return { ...state, selectedSetId: action.setId }
    case 'SET_DELETE_TARGET':
      return { ...state, deleteTarget: action.target }
    case 'RESET':
      return initialNavigationState
    default:
      return state
  }
}

export type FilterState = {
  search: string
  filterClassId: string
  filterStatus: string
}

export type FilterAction =
  | { type: 'SET_FILTER'; field: keyof FilterState; value: string }
  | { type: 'RESET_FILTERS' }

export const initialFilterState: FilterState = {
  search: '',
  filterClassId: '',
  filterStatus: '',
}

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, [action.field]: action.value }
    case 'RESET_FILTERS':
      return initialFilterState
    default:
      return state
  }
}

export function createRaceGuard() {
  let generation = 0
  function nextGeneration() { generation++ }
  function isStale(gen: number) { return gen !== generation }
  return { nextGeneration, isStale, getGeneration: () => generation }
}
