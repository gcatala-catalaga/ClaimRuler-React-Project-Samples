import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { CircularProgress } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import moment from 'moment'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import AdministrationActions from 'claimgolib/redux/Administration'
import TemplatesActions from 'claimgolib/redux/Templates'
import { getCalendarEvents } from 'claimgolib/services/Api_Calendar'
import { getCalendarItemKind } from 'claimgolib/util/Util_Calendar'
import * as dates from 'claimgolib/util/dates'

class CalendarApp extends Component {
  constructor(props) {
    super(props)
    let { timezone, defaultView } = props
    defaultView = defaultView === undefined || defaultView === null ? 'month':defaultView
    this.state = {
        api_status: {active: true, error: false},
        events: [],
        defaultView,
        currentView: defaultView,
        timezone: timezone === undefined || timezone === null ? dates.getTimezone():timezone
    }
    this.enabledServices = this.getEnabledServices()
    this.calendarServices = this.getCalendarServices()
  }

  componentDidMount() {
    const { thirdPartyAppsInstalled, getThirdPartyAppsInstalled, getNotificationsTasks } = this.props

    if (thirdPartyAppsInstalled.length > 0) {
      this.calendarDataCall()
    } else {
      getThirdPartyAppsInstalled()
    }
    getNotificationsTasks()
  }

  componentDidUpdate(prevProps) {
    const { notificationsTasks, calendarEvents, thirdPartyAppsInstalled } = this.props

    if (notificationsTasks !== prevProps.notificationsTasks || calendarEvents !== prevProps.calendarEvents) {
      if (thirdPartyAppsInstalled.length > 0 && (calendarEvents === undefined && calendarEvents.length === 0)) {
        this.calendarDataCall()
      }
    }
  }

  calendarDataCall = () => {
    const es = this.enabledServices
    let appids = es && es.length > 0 ? es.map(s => ({appid: s.appid})):[]
    appids.push({appid: this.getClaimRulerAppId()})

    getCalendarEvents(appids, d => this.setCalendarData(d))
  }

  getClaimRulerAppId = () => {
    const { userId } = this.props
    return `${'user_'}${userId}`
  }

  setCalendarData(d){
    if(d === null){
        this.setState({ api_status: {active: false, error: true} })
    }else{
        let events = []
        d.forEach(e => {// d = calendar data array | e = calendar event object
            if(e.error && e.error === 'configuration'){// remove service from enabled services if failed to retrieve events
                this.disableService(e.appid)
                return
            }
            const { kind, summary, title, description, notes, start, end, due, attendees, location, status, eventid, appid } = e
            const e_kind = getCalendarItemKind(e)// e_kind = event kind
            switch(e_kind){
                case 'calendar':
                    if(e.status && e.status === 'confirmed'){
                        events.push({
                            kind,
                            title: summary,
                            description,
                            start: dates.getLocalDateFromUTC(start),
                            end: dates.getLocalDateFromUTC(end),
                            attendees: attendees && attendees.length > 0 ? attendees:[],
                            location,
                            status,
                            eventid,
                            appid
                        })
                    }
                    break
                case 'tasks':
                    if(e.due){
                        const dd = dates.getLocalDateFromUTC(due).addHours(8)// dd = due date
                        events.push({
                            kind,
                            title,
                            notes,
                            due: due + 28800,// add 8 hrs of seconds to account for Google API shit mistake with task times
                            start: dd,
                            end: dd.addHours(1),
                            allDay: true,
                            status,
                            eventid,
                            appid
                        })
                    }
                    break
                default:
                    // do default?
                    break
            }
        })
        this.setState({ events, api_status: {active: false, error: false} })
    }
  }

  updateCalendarData(){
      // not yet complete
  }

  handleEventUpdate(e){
    this.calendarDataCall()
    this.setState({ api_status: {active: true, error: false} })
  }

  handleNotificationStatus(){
      // not yet complete
  }

  disableService(id){
    let di = this.enabledServices.findIndex(s => { return s.appid === id })// di = delete index
    if(di > -1) this.enabledServices.splice(di, 1)    
    di = this.calendarServices.findIndex(s => { return s.value === id })// di = delete index
    if(di > -1) this.calendarServices.splice(di, 1)
  }

  getEnabledServices(){
    const { thirdPartyAppsInstalled } = this.props
    // es = enabled services
    let es = [...thirdPartyAppsInstalled.filter(a => {
        if(a.companyname)
          if((a.companyname.indexOf('google') !== -1 || a.companyname.indexOf('microsoft') !== -1) && (a.enable !== undefined && a.enable === true))
            return true
        return false
    })]
    return es && es.length > 0 ? es.sort((s1, s2) => s1.updatedon > s2.updatedon):es
  }

  getCalendarServices(){
    let services = []
    const getServiceLabel = (s) => {
        if(s.indexOf('google') !== -1){
            return 'Google'
        }else if(s.indexOf('microsoft') !== -1){
            return 'Outlook'
        }else{
            return null
        }
    }
    const es = this.enabledServices// es = enabled services
    if(es && es.length > 0)
        services = [...es.map(s => ({label: getServiceLabel(s.companyname), value: s.appid}))]
    services.push({label: 'Claim Ruler', value: this.getClaimRulerAppId()})

    return services
  }

  getServiceColor = (appid) => {
    const cs = this.calendarServices// cs = calendar services
    const sd = cs.filter(i => i.value === appid)// sd = service data
    if(sd && sd.length > 0){
        const sn = sd[0].label.replace(/\s+/g, '').toLowerCase()// sn = service name
        const c = {// c = colors
            google: 'tomato',
            outlook: 'deepskyblue',
            claimruler: 'limegreen'
        }
        return c[sn]
    }
    return 'white'
  }

  onEventCreate = ({start, end}) => {
    const { handleModal } = this.props
    if(new Date().toJSON().split('T')[0] !== new Date(start).toJSON().split('T')[0]){
        // setTimeToNow = true
        if(new Date().getTime() > start.getTime()){
            handleModal({open: true, modal: 'Alert', data: {message: 'Sorry, without a time machine, you cannot create an event in the past.'}})
            return
        }
    }
    
    const { currentView, timezone } = this.state// user.timezone?
    const services = this.calendarServices
    const due = dates.total(new Date(start), 'seconds')
    start = due + (currentView === 'month' ? 32400:0)// 9 AM of day selected if in month view
    end = start + 3600// an hour after start time

    const item = {
        timezone,
        start,
        end,
        due,
        service: services[0].value
    }
    handleModal({open: true, modal: 'AddCalendarItem', data: {item, services, actionHandler: e => this.handleEventUpdate(e)}})
  }

  onEventEdit = (e) => {
    const { timezone } = this.state
    const { handleModal } = this.props
    const services = this.calendarServices
    const service = e.appid
    const e_kind = getCalendarItemKind(e)// e_kind = event kind

    let item
    switch(e_kind){
        case 'calendar':
            item = {
                summary: e.title,
                description: e.description,
                start: e.start.getTime()/1000,
                end: e.end.getTime()/1000,
                status: e.status,
                attendees: e.attendees ? e.attendees:[],
                eventid: e.eventid,
                kind: e.kind,
                location: e.location,
                timezone,
                service
            }
            break
        case 'tasks':
            item = {
                summary: e.title,
                notes: e.notes,
                due: e.due,
                status: e.status,
                eventid: e.eventid,
                kind: e.kind,
                timezone,
                service
            }
            break
        default:
            // meh
    }
    handleModal({open: true, modal: 'AddCalendarItem', data: {item, services, actionHandler: e => this.handleEventUpdate(e)}})
  }

  EventWrapper = ({event}) => {
    return (
        <span>
            <span style={{height: 12, width: 12, backgroundColor: this.getServiceColor(event.appid), borderRadius: '50%', display: 'inline-block', marginLeft: 2, marginRight: 5}} />
            <strong>{event.title}</strong>
            {event.desc && ':  ' + event.desc}
        </span>
    )
  }

  render() {
    const { events, defaultView, api_status: { active, error } } = this.state

    return (
      <div className="section" style={{ height: active ? 1000:'auto' }}>
        {active ? // show loader if api_status is active
            <div className="progress-container-dashboard" style={{ display: 'block' }}>
                <CircularProgress className="progress-container__spinner" thickness={7} />
                <div style={{ paddingTop: '10px' }}>Retrieving Calendar Data...</div>
            </div>
            :// if api_status NOT active, see if there's an error
            error ?
                <div className="progress-container-dashboard" style={{ display: 'block' }}>
                    <Alert variant="outlined" severity="error">An error has occurred retrieving the Calendar data.<br/>Please contact tech support.</Alert>
                </div>
                :
                <div className="dayz-wrapper">
                    <Calendar
                        selectable
                        events={events}
                        views={['month', 'work_week', 'day', 'agenda']}
                        onSelectEvent={e => this.onEventEdit(e)}
                        onSelectSlot={this.onEventCreate}
                        onView={e => this.setState({ currentView: e })}
                        components={{event: this.EventWrapper}}
                        step={60}
                        showMultiDayTimes
                        max={dates.add(dates.endOf(new Date(2030, 17, 1), 'day'), -1, 'hours')}
                        defaultDate={new Date()}
                        defaultView={defaultView}
                        localizer={localizer}
                        style={{ height: 1000 }}
                    />
                </div>
        }
      </div>
    )
  }
}

const localizer = momentLocalizer(moment)

CalendarApp.defaultProps = {
	handleModal: () => { }
}

const types = {
  t: PropTypes.func.isRequired,
  handleModal: PropTypes.func
}

CalendarApp.propTypes = types

const mapStateToProps = state => ({
  userId: state.login.userId,
  notificationsTasks: state.administration.notificationsTasks,
  calendarEvents: state.administration.calendarEvents,
  thirdPartyAppsInstalled: state.administration.thirdpartyinstalledgetrequestdata
})

const mapDispatchToProps = dispatch => ({
  getNotificationsTasks: () => dispatch(AdministrationActions.getNotificationsTasksRequest()),
  handleModal: (data) => dispatch(TemplatesActions.handleModal(data)),
  getThirdPartyAppsInstalled: () => dispatch(AdministrationActions.getThirdPartyAppsInstalled())
})

const CalendarAppContainer = connect(mapStateToProps, mapDispatchToProps)(CalendarApp)
CalendarAppContainer.propTypes = types

export default CalendarAppContainer
