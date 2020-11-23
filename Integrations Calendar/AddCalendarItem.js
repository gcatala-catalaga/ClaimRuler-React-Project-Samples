import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import i18next from "i18next"
import moment from 'moment-timezone'
import { Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import TemplatesActions from 'claimgolib/redux/Templates'
import AdministrationActions from 'claimgolib/redux/Administration'
import { postExternalCalendarEvent, saveInternalCalendarEvent, deleteInternalCalendarEvent } from 'claimgolib/services/Api_Calendar'
import { postNotification } from 'claimgolib/services/Api_Notifications'
import { isCalendarInternal, getCalendarItemKind, getCalendarItemNotification } from 'claimgolib/util/Util_Calendar'
import { inputStateChange, removeDuplicatedObjects, dateStateChange, convertToRegularDate, validateEmails, getMomentFromSecs } from 'claimgolib/util/helpers'
import { CustomInput, CustomDialog, CustomTextArea, CustomDatePicker, CustomSelect } from '../index'
import ValidatorWrapper from '../ValidatorWrapper'
import { getUTCFromLocalTime } from 'claimgolib/util/dates'

class AddCalendarItem extends Component {
  constructor(props) {
    super(props)
    let { data: { item, services } } = props
    const isEdit = item && item.eventid ? true:false
    const attendees_str = this.getAttendeeEmailsStr(item)
    if(attendees_str !== '') item = {...item, ...{attendees_str}}
    this.state = {
        api_status: {active: false, error: false},
        item: isEdit ? item:this.getDefaultItem(item),
        services
    }
    this.validator = React.createRef()
  }

  componentDidMount() {
    const { usersList, usersRequest } = this.props
    if(!usersList.length) usersRequest()
  }

  close = e => {
    const { handleModal, name } = this.props
    handleModal({ open: false, modal: name, data: null })
  }

  handleClose = () => {
    this.setState({ textDialog: '' })
  }

  getDefaultItem = d => {
      const { start, end, due, timezone, service } = d
      return {
        eventid: 'creating',
        kind: 'tasks#task',//'calendar#event',
        service,
        start,
        end,
        due,
        timezone
      }
  }

  prepItemToSave = i => {
    let dts// dts = data to save
    const appid = i.service
    const eventid = i.eventid
    const kind = getCalendarItemKind(i)// kind = item kind
    switch(kind){
        case 'calendar':
            dts = {
                start: getUTCFromLocalTime(i.start),
                end: getUTCFromLocalTime(i.end),
                status: 'confirmed',
                summary: i.summary,
                description: i.description,
                attendees: i.attendees,
                location: i.location,
                kind: i.kind,
                action: eventid && eventid !== 'creating' ? 'update':'create'
            }
            break
        case 'tasks':
            dts = {
                title: i.summary,
                notes: i.notes,
                kind: i.kind,
                action: eventid && eventid !== 'creating' ? 'update':'create',
                status: i.status ? i.status:''
            }
            if(dts.action === 'create') dts = {...dts, ...{status: 'needsAction'}}
            if(i.due) dts = {...dts, ...{due: dts.action === 'create' ? getUTCFromLocalTime(i.due):i.due - 28800}}//if it's an update remove 1 day of seconds: i.due - 86400
            break
        default:
            // meh...
    }
    if(eventid && eventid !== 'creating') dts = {...dts, ...{eventid}}
    if(isCalendarInternal(appid)) delete dts.action
    return dts
  }

  saveItem = () => {
    if(!this.validator.current.allValid()){
        this.validator.current.showMessages()
        return
    }

    let { item } = this.state
    const appid = item.service
    item = this.prepItemToSave(item)
    const handler = isCalendarInternal(appid) ? e => this.sendItemNotification(e, 'save'):e => this.handleSavedItem(e)
    
    if(isCalendarInternal(appid)){// save to internal API using userid
        const userid = appid.split('_')[1]
        saveInternalCalendarEvent(userid, item, handler)
    }else{// post to external service using service id(appid)
        postExternalCalendarEvent(appid, item, handler)
    }
    this.setState({ api_status: { active: true, error: false } })
  }

  deleteItem = () => {
    let { item } = this.state
    const appid = item.service
    const eventid = item.eventid
    const kind = item.kind
    const handler = isCalendarInternal(appid) ? e => this.sendItemNotification(e, 'delete'):e => this.handleSavedItem(e)

    if(isCalendarInternal(appid)){// save to internal API using userid
        const userid = appid.split('_')[1]
        deleteInternalCalendarEvent(userid, eventid, handler)
    }else{
        item = {action: 'delete', eventid, kind}
        postExternalCalendarEvent(appid, item, handler)
    }
    this.setState({ api_status: { active: true, error: false } })
  }

  sendItemNotification = (e, type) => {
    if(e === null){
        this.setState({ api_status: { active: false, error: true } })
    }else{
        const { item } = this.state
        const kind = getCalendarItemKind(item)// kind = item kind = 'calendar' | 'tasks'
        const { userItems } = this.props
        const sender = { id: userItems[0].userid, email: userItems[0].email, first: userItems[0].first, last: userItems[0].last}
        // type = 'save' | 'delete'

        const handler = e => this.handleSavedItem(e)
        const notification = getCalendarItemNotification(item, kind, sender, type)

        postNotification(sender.id, notification, handler)
    }
  }

  handleSavedItem = e => {
    const { data: { actionHandler } } = this.props
    actionHandler()
    this.close()
  }

  selectAttendees = (title, USER_INFO_LIST) => {
    const { item, services } = this.state
    const { handleModal, currentClaim, currentClient: { contacts } } = this.props
    let { usersList, data: { actionHandler } } = this.props
    const { deskAdjuster_info, supervisor_info, reviewer_info, adjuster_info } = currentClaim

    if (contacts)
      usersList = [...contacts, ...usersList]

    //Added-edited SK1 because searchpopup uses sk1 as unique id with a hot fix
    const enhancedUserList = usersList.map(c => ({...c, SK1: `unique_${c.email}`}))
    usersList = enhancedUserList

    var setUser = (user) => {
      if (user) {
        const { email, first, last, id, SK1 } = user
        usersList = [{ email, first, last, userid: id, SK1 }, ...usersList]
      }
    }

    setUser(adjuster_info)
    setUser(reviewer_info)
    setUser(supervisor_info)
    setUser(deskAdjuster_info)

    usersList = removeDuplicatedObjects(usersList, 'email')

    var selectedUsers = []
    var recipientsToRemove = []
    var recipientsSelected = []

    let { item: { attendees_str } } = this.state
    attendees_str = attendees_str ? attendees_str.replace(/\s+/g, ''):''

    if (USER_INFO_LIST === 'attendees') {
      recipientsSelected = attendees_str ? attendees_str.split(','):[]
    } else {
      recipientsToRemove = attendees_str ? attendees_str.split(','):[]
    }

    usersList = usersList.filter(function(user, i) {
      if (recipientsSelected.includes(user.email))
        selectedUsers.push(user)
      return !recipientsToRemove.includes(user.email)
    })

    handleModal({
      open: true,
      modal: 'SearchPopUp',
      data: {
        title,
        selectedUsers,
        users: usersList,
        multiselect: true,
        actionLabel: 'Save',
        callback: (selected) => {
          setTimeout(function () {
            const sa = selected && selected.length > 0 ? selected.map(s => ({displayName: `${s.first} ${s.last}`, email: s.email})):[]// sa = selected attendees
            const ui = {...item, ...{[USER_INFO_LIST]: sa}}// ui = updated item
            handleModal({
              open: true,
              modal: 'AddCalendarItem',
              data: {item: ui, services, actionHandler}
            })
          }, 100)
        }
      }
    })
  }

  handleTypeChange = event => {
    const { item } = this.state
    const { target: { name } } = event
    
    const types = {
        task: 'tasks#task',
        meeting: 'calendar#event'
    }
    this.setState({ item: {...item, kind: types[name]} })
  }

  getAttendeeEmailsStr = d => {
    const { attendees } = d
    if(attendees && attendees.length > 0){
        const emails = attendees.map(a => a.email)
        return emails.toString().replace(/,/g, ', ')
    }
    return ''
  }

  render() {
    const { item, services, api_status: { active, error } } = this.state
    const isEdit = item && item.eventid && item.eventid !== 'creating'
    const kind = getCalendarItemKind(item)// kind = item kind
    const attendees_arr = item.attendees_str && item.attendees_str.replace(/\s+/g, '').split(',')
    
    return (
      <Dialog className='dialog' maxWidth='sm' fullWidth open={true} onClose={() => this.close()}>
        <DialogTitle className='dialog__title'>{i18next.t('generic.Add to Calendar')} </DialogTitle>
        <DialogContent className='no-padding__none'>
          <div className='section padding-top__10'>
            {active ? 
                <div className="progress-container-dashboard" style={{ position: 'relative', marginTop: 196, marginBottom: 196 }}>
                    <CircularProgress className="progress-container__spinner" thickness={7} />
                    <div style={{ paddingTop: '10px' }}>Saving...</div>
                </div>
                :
                error ? 
                    <div className="progress-container-dashboard" style={{ position: 'relative', marginTop: 180, marginBottom: 180, width: 'fit-content' }}>
                        <Alert variant="outlined" severity="error">An error has occurred saving this calendar item.<br/>Please contact tech support.</Alert>
                        <button tabIndex={0} style={{marginTop: 20}} className='btn btn-default has-border' onClick={e => this.setState({ api_status: { active: false, error: false } })}>
                            OK
                        </button>
                    </div>
                    :
                    <ValidatorWrapper ref={this.validator}>
                        <div className='section-body has-border'>
                            <div className='row'>
                                <div className='input-field col s12' style={{marginBottom: 22, opacity: isEdit ? 0.5:1.0}}>
                                    <CustomSelect
                                    label={i18next.t('generic.Service')}
                                    inputProps={{
                                        name: 'service',
                                        value: item.service,
                                        onChange: (e) => inputStateChange(e, this, 'item'),
                                        disabled: isEdit
                                    }}
                                    options={services}
                                    />
                                </div>
                                <div className='col s12' style={{marginBottom: 12}}>
                                    <div className="section-filter" style={{opacity: isEdit ? 0.5:1.0}}>
                                        <div className="section-filter__option">
                                            <CustomInput
                                            inputProps={{
                                                name: 'task',
                                                type: 'checkbox',
                                                checked: kind === 'tasks',
                                                onChange: this.handleTypeChange,
                                                disabled: isEdit
                                            }}
                                            label={i18next.t('generic.Task')}
                                            />
                                        </div>
                                        <div className="section-filter__option">
                                            <CustomInput
                                            inputProps={{
                                                name: 'meeting',
                                                type: 'checkbox',
                                                checked: kind === 'calendar',
                                                onChange: this.handleTypeChange,
                                                disabled: isEdit
                                            }}
                                            label={i18next.t('generic.Meeting')}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Display attendees ONLY for calendar events */}
                                {kind === 'calendar' &&
                                <div className='input-field col m12' style={{marginBottom: 22}}>
                                    <CustomInput
                                        inputProps={{
                                            name: 'attendees_str',
                                            value: item.attendees_str,
                                            onChange: (e) => inputStateChange(e, this, 'item'),
                                        }}
                                        max={250}
                                        adornment={{ start: false, icon: 'add', callback: () => this.selectAttendees(i18next.t('generic.Invitees'), 'attendees') }}
                                        label={i18next.t('generic.Invitees')}
                                    />
                                    <input rules={kind === 'calendar' ? "email":"email"} type="hidden" label="Attendees" 
                                    value={attendees_arr && attendees_arr.length > 0 ? validateEmails(attendees_arr):''} />
                                </div>}
                                <div className='input-field col m12' style={{marginBottom: 22}}>
                                    <CustomInput
                                    inputProps={{
                                        name: 'summary',
                                        required: true,
                                        rules: 'required|string',
                                        value: item.summary,
                                        onChange: (e) => inputStateChange(e, this, 'item')
                                    }}
                                    max={250}
                                    label={i18next.t('generic.Title')}
                                    />
                                </div>
                                <div className='input-field col m12' style={{marginBottom: 22}}>
                                    <CustomTextArea
                                    inputProps={{
                                        name: kind === 'calendar' ? 'description':'notes',
                                        required: true,
                                        value: item[kind === 'calendar' ? 'description':'notes'],
                                        onChange: (e) => inputStateChange(e, this, 'item')
                                    }}
                                    label={i18next.t('generic.' + (kind === 'calendar' ? 'Description':'Notes'))}
                                    />
                                </div>
                                {/* Display location & start/end dates for calendar events. Display due date for tasks */}
                                {kind === 'calendar' ? 
                                <Fragment>
                                <div className='input-field col m12' style={{marginBottom: 22}}>
                                    <CustomInput
                                    inputProps={{
                                        name: 'location',
                                        value: item.location,
                                        onChange: (e) => inputStateChange(e, this, 'item')
                                    }}
                                    max={250}
                                    label={i18next.t('generic.Location')}
                                    />
                                </div>
                                <div className="input-field col m6">
                                    <CustomDatePicker
                                        inputProps={{
                                            name: 'start',
                                            selected: getMomentFromSecs(item.start, item.timezone),
                                            value: convertToRegularDate(item.start, item.timezone, true),
                                            date: item.start,
                                            wTime: true,
                                            rules: 'required',
                                            onChange: d => {
                                            if(moment().utc().unix() <= d.utc().unix())
                                                dateStateChange(this, 'start', 'item')(d)
                                            }
                                        }}
                                        label={i18next.t('generic.Start Time')}
                                        showTimeSelect={true}
                                        timeIntervals={15}
                                        placement='top-end'
                                    />
                                </div>
                                <div className="input-field col m6">
                                    <CustomDatePicker
                                        inputProps={{
                                            name: 'end',
                                            selected: getMomentFromSecs(item.end, item.timezone),
                                            value: convertToRegularDate(item.end, item.timezone, true),
                                            date: item.end,
                                            wTime: true,
                                            rules: 'required',
                                            onChange: d => {
                                            if(moment().utc().unix() <= d.utc().unix())
                                                dateStateChange(this, 'end', 'item')(d)
                                            }
                                        }}
                                        label={i18next.t('generic.End Time')}
                                        showTimeSelect={true}
                                        timeIntervals={15}
                                        placement='top-end'
                                    />
                                </div>
                                </Fragment>
                                :
                                <div className="input-field col m6">
                                    <CustomDatePicker
                                        inputProps={{
                                            name: 'due',
                                            selected: getMomentFromSecs(item.due, item.timezone),
                                            value: convertToRegularDate(item.due, item.timezone, true),
                                            date: item.due,
                                            rules: 'required',
                                            onChange: d => {
                                            if(moment().utc().unix() <= d.utc().unix())
                                                dateStateChange(this, 'due', 'item')(d)
                                            }
                                        }}
                                        label={i18next.t('generic.Due Date/Time')}
                                        placement='top-end'
                                    />
                                </div>}
                            </div>
                        </div>
                    </ValidatorWrapper>
            }
          </div>
        </DialogContent>
        <DialogActions className='dialog__actions'>
          <button tabIndex={0} className='btn btn-default has-border' onClick={(e) => this.close(e)} disabled={active || error ? true:false}>
            {i18next.t('generic.Cancel')}
          </button>
          <button tabIndex={0} className='btn btn-primary regular-green' onClick={() => this.saveItem()} disabled={active || error ? true:false}>
            {i18next.t('generic.Save')}
          </button>
          <button tabIndex={0} className='btn btn-primary regular-green' onClick={() => this.deleteItem()} disabled={active || error ? true:false} 
          style={{display: isEdit ? 'inline-block':'none'}}>
            {i18next.t('generic.Delete')}
          </button>
        </DialogActions>
        <CustomDialog
          inputProps={{
            text: this.state.textDialog,
            handleClose: () => this.handleClose()
          }}
        />
      </Dialog>
    )
  }
}

AddCalendarItem.defaultProps = {
  currentClient: undefined,
  currentClaim: undefined,
  usersList: []
}

const types = {
  currentClient: PropTypes.object,
  currentClaim: PropTypes.object,
  usersList: PropTypes.array
}

AddCalendarItem.propTypes = types
const mapStateToProps = (state) => ({
  currentClient: state.administration.currentClient,
  usersList: state.administration.usersList,
  currentClaim: state.claims.currentClaim,
  userItems: state.administration.userItems
})

const mapDispatchToProps = (dispatch) => ({
  handleModal: (data) => dispatch(TemplatesActions.handleModal(data)),
  usersRequest: () => dispatch(AdministrationActions.getUsersRequest())
})

const AddCalendarItemContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AddCalendarItem)
AddCalendarItemContainer.propTypes = types

export default AddCalendarItemContainer
