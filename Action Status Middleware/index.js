import Reactotron from 'reactotron-react-js'
import { combineReducers, applyMiddleware, createStore, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { routerReducer, routerMiddleware } from 'react-router-redux'
import { createBrowserHistory } from 'history'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web and AsyncStorage for react-native
import { createActionStatusMiddleware } from 'claimgolib/middlewares/ActionStatusMiddleware'

import mySaga from '../sagas'

import immutablePersistenceTransform from './ImmutablePersistenceTransform'
let sagaMiddleware = createSagaMiddleware();
//if it is not a build, add reactotron
if (!process.env.REACT_APP_BUILD_STAMP) {
  const sagaMonitor = Reactotron.createSagaMonitor({ sagaMiddleware })
  sagaMiddleware = createSagaMiddleware({sagaMonitor})
}

export const history = createBrowserHistory()
const historyMiddleware = routerMiddleware(history)

// SAMPLE CODE: create action status middle ware
const actionStatusMiddleware = store => next => action => createActionStatusMiddleware(store, next, action)

const reducers = combineReducers({
  badges: require('./Badges').reducer,
  templates: require('./Templates').reducer,
  claims: require('./Claims').reducer,
  claimsTemplate: require('./ClaimsTemplate').reducer,
  // clients: require('./Clients').reducer,
  // users: require('./Users').reducer,
  administration: require('./Administration').reducer,
  administrationTemplate: require('./AdministrationTemplate').reducer,
  accountingTemplate: require('./AccountingTemplate').reducer,
  accounting: require('./Accounting').reducer,
  reportsTemplate: require('./ReportsTemplate').reducer,
  dashboard: require('./Dashboard').reducer,
  router: routerReducer,
  login: require('./LoginRedux').reducer,
  evaporate: require('./Evaporate').reducer,
  connection: require('./Connection').reducer,
  tableColumns: require('./TableColumns').reducer,
  thirdParty: require('./ThirdParty').reducer,
})

const persistConfig = {
  key: 'root',
  storage,
  blacklist: [
    // 'claims',
    'claimsTemplate',
    'router',
    'templates',
    'accountingTemplate',
    'componentTrees',
    'reportsTemplate',
    //'administration',
    'administrationTemplate',
    'evaporate',

    // 'login',
    // 'thirdParty',

    'connection',
  ],
  transforms: [immutablePersistenceTransform],
}

const persistedReducer = persistReducer(persistConfig, reducers)

let store = createStore(persistedReducer, applyMiddleware(sagaMiddleware, historyMiddleware, actionStatusMiddleware))
let persistor = persistStore(store)
//if it is not a build, add reactotron
if (!process.env.REACT_APP_BUILD_STAMP) {
  // SAMPLE CODE: apply actionStatusMiddleware
  store = createStore(persistedReducer, compose(applyMiddleware(sagaMiddleware, historyMiddleware, actionStatusMiddleware), Reactotron.createEnhancer()))
  persistor = persistStore(store)
}
//export const store = createStore(persistedReducer, applyMiddleware(sagaMiddleware, historyMiddleware, actionStatusMiddleware))
//export const persistor = persistStore(store)
sagaMiddleware.run(mySaga)

export {
  store,
  persistor
}
