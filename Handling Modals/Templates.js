import { createReducer, createActions } from 'reduxsauce'
import Immutable from 'seamless-immutable'
import { LoginTypes } from './LoginRedux'

/* ------------- Types and Action Creators ------------- */

const { Types, Creators } = createActions({
  loadBelowTopBar: ['mainControlPanel'],
  changeTitle: ['title'],
  changeIcon: ['icon'],
  changeShowFilterInfo: ['showFilter'],
  changeShowFilterList: ['showList'],
  changeShowFilterSearch: ['filterSearch'],
  displaySearchBar: ['showSearchBar'],
  displayToolBar: ['showToolBar'],
  displaySideBar: ['showSideBar'],
  displayFilterRightText: ['showFilterRightText'],
  removeItemFilterRightText: ['indexRemoveItemFilterRightText'],
  setToolBarInfo: ['info'],
  changeItemToolBarInfo:['info'],
  setSearch: ['filterContent'],
  sidebarActivateGroups: ['groupList'],
  // SAMPLE CODE: action creator
  handleModal: ['data'],// data: {open: true | false, modal: 'name of modal component', data: {data object passed to modal view}}
  handleActionStatus: ['show', 'data'],
  openNotifications: ['notificationsOpen'],
  setFilterAdvancedSearch: ['configuration'],
})

export const TemplatesTypes = Types
export default Creators

/* ------------- Initial State ------------- */

export const INITIAL_STATE = Immutable({
  actionStatus: {show: false, data: null},// {show: true|false, data: {msg: 'Retreiving...', component: 'CustomSnackbar', type: 'status'|'success'|'error'|'warning'|'prompt'}}
  mainControlPanel: null,
  title: 'Claim Go',
  icon: 'build',
  showFilterRightText: {
    listCategory: [],
    listSubcategory: [],
  },
  advancedFilter: {},
  infoToolBar: {},
  groupList: '',
  filterContent: {},
  activeModal: {open: false, modal: 'McGuffin', data: null},// SAMPLE CODE: State prop to map to view component
  notificationsOpen: false
})

/* ------------- Selectors ------------- */

// export const ClaimsSelectors = {
//   getData: state => state.data
// }

/* ------------- Reducers ------------- */

export const placeUnderTopBar = (state, action) => {
  const { mainControlPanel } = action
  return state.merge({ mainControlPanel })
}

export const openNotifications = (state, action) => {
  const { notificationsOpen } = action
  return state.merge({ notificationsOpen })
}

export const setTitle = (state, action) => {
  const { title } = action
  return state.merge({ title })
}
export const setIcon = (state, action) => {
  const { icon } = action
  return state.merge({ icon })
}
export const setShowFilterInfo = (state, action) => {
  const { showFilter } = action
  return state.merge({ showFilter })
}
export const setShowFilterList = (state, action) => {
  const { showList } = action
  return state.merge({ showList })
}
export const setShowFilterSearch = (state, action) => {
  const { filterSearch } = action
  return state.merge({ filterSearch })
}
export const setDisplaySearchBar = (state, action) => {
  const { showSearchBar } = action
  return state.merge({ showSearchBar })
}
export const setDisplayToolBar = (state, action) => {
  const { showToolBar } = action
  return state.merge({ showToolBar })
}
export const setDisplaySideBar = (state, action) => {
  const { showSideBar } = action
  return state.merge({ showSideBar })
}
export const setFilterRightText = (state, action) => {
  const { showFilterRightText } = action
  const { listCategory = [], listSubcategory = [] } = showFilterRightText

  let fContent = {}
  listCategory.filter((e, i) => {
    const a = []
    listSubcategory[i].map(is => {
      a.push(String(is).toLowerCase())
    } )

    fContent = {...fContent, [String(e).toLowerCase()]: a }
  })
  const searchFilter = state.filterContent && state.filterContent.searchText ? {searchText: state.filterContent.searchText}:{}
  return state.merge({filterContent: {...fContent, ...searchFilter}, showFilterRightText: { listSubcategory: listSubcategory, listCategory } })
}

export const setRemoveItemFilterRightText = (state, action) => {
  const {
    indexRemoveItemFilterRightText: { indexCategory, indexSubcategory },
  } = action

  const { showFilterRightText } = state
  const { listCategory = [], listSubcategory = [] } = showFilterRightText

  let newListSubcategory = []
  let fContent = {}

  const newListCategory =
  listCategory.filter((e, i) => {

    let a = []
    let a2 = []
    if(i== indexCategory) {
      listSubcategory[i].map((e2, i2) => {
        if( i2 !== indexSubcategory) {
          a.push(String(e2).toLowerCase())
          a2.push(e2)
        }
      })
    } else {
      a2 = listSubcategory[i]
      a= listSubcategory[i]
    }

    if(a.length > 0) {
      fContent = {...fContent, [String(e).toLowerCase()]: a  }
      newListSubcategory = [ ...newListSubcategory, a2 ]
      return e
    }
  })
  const searchFilter = state.filterContent && state.filterContent.searchText ? {searchText: state.filterContent.searchText}:{}
  return state.merge({filterContent: {...fContent, ...searchFilter}, showFilterRightText: { listSubcategory: newListSubcategory, listCategory: newListCategory } })
}

export const setToolBarInfo = (state, action) => {
  const { info } = action

  return state.merge({ infoToolBar: info })
}

export const changeItemToolBarInfo = (state, action) => {
  const { info } = action

  return state.merge({ infoToolBar: { ...state.infoToolBar, ...info}  })
}

export const setSearchOnGriddle = (state, action) => {
    const { filterContent, filterContent: {searchText} } = action
    let stateFilter = {...state.filterContent}
    let searchFilter = {...filterContent}
    if(!searchText){
        delete stateFilter.searchText
        delete searchFilter.searchText
    }
    return state.merge({ filterContent: {...stateFilter, ...searchFilter} })
}

export const setFilterAdvancedSearch = (state, action) => {
  const { configuration } = action;
  return state.merge({ advancedFilter : configuration})
}

export const sidebarActivateGroups = (state, action) => {
  const { groupList } = action
  return state.merge({ groupList })
}
// SAMPLE CODE: Action handler function
export const handleModal = (state, action) => {
  const activeModal = action.data
  return state.merge({ activeModal })
}

export const handleActionStatus = (state, action) => {
  const { show, data } = action
  return state.merge({ actionStatus: {show, data} })
}

/* ------------- Hookup Reducers To Types ------------- */

export const reducer = createReducer(INITIAL_STATE, {
  [Types.LOAD_BELOW_TOP_BAR]: placeUnderTopBar,
  [Types.CHANGE_TITLE]: setTitle,
  [Types.CHANGE_ICON]: setIcon,
  [Types.CHANGE_SHOW_FILTER_INFO]: setShowFilterInfo,
  [Types.CHANGE_SHOW_FILTER_LIST]: setShowFilterList,
  [Types.CHANGE_SHOW_FILTER_SEARCH]: setShowFilterSearch,
  [Types.DISPLAY_SEARCH_BAR]: setDisplaySearchBar,
  [Types.DISPLAY_TOOL_BAR]: setDisplayToolBar,
  [Types.DISPLAY_SIDE_BAR]: setDisplaySideBar,
  [Types.DISPLAY_FILTER_RIGHT_TEXT]: setFilterRightText,
  [Types.REMOVE_ITEM_FILTER_RIGHT_TEXT]: setRemoveItemFilterRightText,
  [Types.SET_TOOL_BAR_INFO]: setToolBarInfo,
  [Types.CHANGE_ITEM_TOOL_BAR_INFO]: changeItemToolBarInfo,
  [Types.SET_SEARCH]: setSearchOnGriddle,
  [Types.SIDEBAR_ACTIVATE_GROUPS]: sidebarActivateGroups,
  [Types.HANDLE_MODAL]: handleModal,// SAMPLE CODE: Action handler
  [Types.HANDLE_ACTION_STATUS]: handleActionStatus,
  [Types.SET_FILTER_ADVANCED_SEARCH]: setFilterAdvancedSearch,
  [LoginTypes.LOGOUT]: () => INITIAL_STATE,
  [Types.OPEN_NOTIFICATIONS]: openNotifications,

})