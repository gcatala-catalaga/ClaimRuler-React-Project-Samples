import TemplateActions from 'claimgolib/redux/Templates'

const STATUS = {
    WS_GET: { msg: 'Retreiving...', component: 'CustomSnackbar', type: 'status' },
    WS_POST: { msg: 'Saving...', component: 'CustomSnackbar', type: 'status' },
    WS_PUT: { msg: 'Saving...', component: 'CustomSnackbar', type: 'status' },
    WS_DELETE: { msg: 'Deleting...', component: 'CustomSnackbar', type: 'status' },
    WS_SUCCESS: { msg: 'Success!', component: 'CustomSnackbar', type: 'success' },
    WS_ERROR: { msg: 'Error!', component: 'CustomSnackbar', type: 'error' }//,
    // APP_WARNING: { msg: 'Warning! Somebody call somebody!', component: 'SomePopUpComponent', type: 'warning' }
}

let actionStatus = {}

export const addActions = (actions) => {
    Object.entries(actions).forEach(([key, value]) => {
        if (!actionStatus[value]) {
            const type = value.split('_')[0]
            switch (type) {
                case 'GET':
                    actionStatus[value] = { payloadRequired: false, getData: (payload) => STATUS.WS_GET }
                    break
                case 'POST':
                    actionStatus[value] = { payloadRequired: false, getData: (payload) => STATUS.WS_POST }
                    break
                case 'PUT':
                    actionStatus[value] = { payloadRequired: false, getData: (payload) => STATUS.WS_PUT }
                    break
                case 'DELETE':
                    actionStatus[value] = { payloadRequired: false, getData: (payload) => STATUS.WS_DELETE }
                    break
                case 'RESPONSE':
                    actionStatus[value] = { payloadRequired: true, getData: (payload) => { return payload && payload.success ? STATUS.WS_SUCCESS : STATUS.WS_ERROR } }
                    break
                case 'FILE':
                    actionStatus[value] = { payloadRequired: false, getData: () => STATUS.WS_SUCCESS }
                default:
                    // do nothing
                    break
            }
        }
    })
}

export const createActionStatusMiddleware = (store, next, action) => {
    const a = actionStatus[action.type]// action exported into 'actionStatuses' from reducer
    if (a) {// make sure action exists
        const { payloadRequired, getData } = a
        const { toast: tempToast, type, uploadedFile } = action
        let isUpdate
        const toast = tempToast === false ? false : true
        if (payloadRequired) {// WS RESPONSE
            const { Method, payload } = action
            isUpdate = (Method) ? (Method === 'post' || Method === 'put' || Method === 'delete') : false
            // if a response to POST | PUT | DELETE...OR ws error(payload is null/undefined or payload.success == false)
            if ((isUpdate || !(payload && payload.success)) && toast) {
                store.dispatch(TemplateActions.handleActionStatus(true, getData(payload)))
            }
        } else {// ALL OTHER TYPES
            const t = action.type.split('_')[0]// action type
            isUpdate = (t) ? (t === 'POST' || t === 'PUT' || t === 'DELETE') : false
            if (isUpdate && toast) {// is a POST | PUT | DELETE
                store.dispatch(TemplateActions.handleActionStatus(true, getData(null)))
            } else if (type === 'FILE_UPLOADED_SUCCESS' && !uploadedFile.error && toast) {
                store.dispatch(TemplateActions.handleActionStatus(true, getData()))
            }
        }
    }
    return next(action)
}