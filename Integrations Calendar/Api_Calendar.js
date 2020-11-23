import axios from 'axios'
import { authIdTokenPromise, printResult } from 'claimgolib/util/helpers'
import { isCalendarInternal } from 'claimgolib/util/Util_Calendar'
/** 
 * API for getting ALL calendar events
 * appids are the ids for the services like 'Google', 'Outlook', etc.
 * */
export const getCalendarEvents = (appids, handler) => {
    const ERROR_CONFIGURATION = 'E0000'
    const ERROR_API = 'E0001'
    const ERRORS = {
        E0000: {type: 'configuration', message: 'The service with the following id is not configured: '},
        E0001: {type: 'api', message: 'API failed to retrieve data for service with id: '}
    }
    let rv = []// rv = return value
	// pull the value from the response
	function pullResponseVal(r){// r = response
        if(r && r.data){
            if(r.data.success === true){
                if(r.data.value)
                    return r.data.value
            }else{
                return ERROR_CONFIGURATION
            }
        }
		return ERROR_API
	}
	// call view component handler
	function handleResponse(id, v){// v = value
        if(v === ERROR_API || v === ERROR_CONFIGURATION){
            v = [{appid: id, error: ERRORS[v].type, message: `${ERRORS[v].message}${id}`}]
        }else{
            v = v.map(i => ({...i, ...{appid: id}}))// attach an appid to each item to flag it as 'Google', 'Outlook', etc.
        }
        const ti = appids.findIndex(i => {return i['appid'] === id})// ti = target index
        appids.splice(ti, 1)

        rv = [...rv, ...v]

        if(appids.length === 0) handler && handler(rv)
	}
	// call API to get contact data
	function makeCall(appid){// external appid will be a number | internal appid will be a string representing userid like this: 'user_42'
		authIdTokenPromise()
		.then(response => {
            const token = response && response.idToken && response.idToken.jwtToken
            let api_path
            if(isCalendarInternal(appid)){// GET events from ClaimRuler system
                api_path = `${'/notifications/task/items?userid='}${appid.split('_')[1]}`
            }else{// GET events from third-party services
                api_path = `${'/rmi/integrations/apps/'}${appid}${'/proxy?eventtype=calendar'}`
            }
            const url = `${process.env.REACT_APP_API_BASE_URL}${api_path}`
			axios.get(url, {
				baseURL: url,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': token,
					'x-api-key': process.env.REACT_APP_X_API_KEY,
					'uname': 'none'
				},
				timeout: 10000
			})
			.then(response => {
				printResult(response)
                const v = pullResponseVal(response)
				handleResponse(appid, v)// resolve(response)
			})
			.catch(error => {
				handleResponse(appid, null)// reject(error)
				throw error
			})
		})
    }
    appids.forEach(obj => {makeCall(obj.appid)})
}

/** 
 * API for saving calendar events to external service
 * Works for POST, PUT, DELETE by using event object key {action: 'create | update | delete'}
 * */
export const postExternalCalendarEvent = (appid, event, handler) => {
	// pull the value from the response
	function pullResponseVal(r){// r = response
        if(r && r.data && r.data.success === true)
            return event
		return null
	}
	// call view component handler
	function handleResponse(v){// v = value
        handler && handler(v)
	}
	// call API to get contact data
	function makeCall(){
		authIdTokenPromise()
		.then(response => {
			// console.log('(CLDR-API) postExternalCalendarEvent().makeCall() RESPONSE: ', response)
			const token = response && response.idToken && response.idToken.jwtToken
			const url = `${process.env.REACT_APP_API_BASE_URL}${'/rmi/integrations/apps/'}${appid}${'/proxy?eventtype=calendar'}`
			axios.post(url, event, {
				baseURL: url,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': token,
					'x-api-key': process.env.REACT_APP_X_API_KEY,
					'uname': 'none'
				},
				timeout: 10000
			})
			.then(response => {
				printResult(response)
				const v = pullResponseVal(response)
				handleResponse(v)// resolve(response)
			})
			.catch(error => {
				handleResponse(null)// reject(error)
				throw error
			})
		})
	}
	makeCall()
}

/** 
 * API for saving calendar events to internal service
 * */
export const saveInternalCalendarEvent = (userid, event, handler) => {
	// pull the value from the response
	function pullResponseVal(r){// r = response
        if(r && r.data && r.data.success === true)
            return event
		return null
	}
	// call view component handler
	function handleResponse(v){// v = value
        handler && handler(v)
	}
	// call API to get contact data
	function makeCall(){
		authIdTokenPromise()
		.then(response => {
            const token = response && response.idToken && response.idToken.jwtToken
            const eventid = event.eventid
            const method = eventid ? 'put':'post'

            let api_path
            if(method === 'put'){// PUT
                api_path = `${'/notifications/task/items/'}${eventid}${'?userid='}${userid}`
            }else{// POST
                const type = event.kind.split('#')[0]
                api_path = `${'/notifications/task/'}${type}${'?userid='}${userid}`
            }
            const body = {...event}; delete body.eventid
            const url = `${process.env.REACT_APP_API_BASE_URL}${api_path}`
            axios[method](url, body, {
				baseURL: url,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': token,
					'x-api-key': process.env.REACT_APP_X_API_KEY,
					'uname': 'none'
				},
				timeout: 10000
			})
			.then(response => {
				printResult(response)
				const v = pullResponseVal(response)
				handleResponse(v)// resolve(response)
			})
			.catch(error => {
				handleResponse(null)// reject(error)
				throw error
			})
		})
	}
	makeCall()
}

/** 
 * API for deleting calendar events to internal service
 * */
export const deleteInternalCalendarEvent = (userid, eventid, handler) => {
    // pull the value from the response
	function pullResponseVal(r){
        if(r && r.data && r.data.success === true)
            return eventid
		return null
	}
	// call view component handler
	function handleResponse(v){
        handler && handler(v)
	}
	// call API to get contact data
	function makeCall(){
		authIdTokenPromise()
		.then(response => {
			const url = `${process.env.REACT_APP_API_BASE_URL}${'/notifications/task/items/'}${eventid}${'?userid='}${userid}`
            const token = response && response.idToken && response.idToken.jwtToken
			axios.delete(url, {
				baseURL: url,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': token,
					'x-api-key': process.env.REACT_APP_X_API_KEY,
					'uname': 'none'
				},
				timeout: 10000
			})
			.then(response => {
				printResult(response)
				const v = pullResponseVal(response)
				handleResponse(v)// resolve(response)
			})
			.catch(error => {
				handleResponse(null)// reject(error)
				throw error
			})
		})
	}
	makeCall()
}
