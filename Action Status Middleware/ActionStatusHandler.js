import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import TemplatesActions from 'claimgolib/redux/Templates'
import CustomSnackbar from './CustomSnackbar'

class ActionStatusHandler extends Component {
  close = () => {
    const { handleActionStatus, actionStatus: { data } } = this.props
    handleActionStatus(false, data)
  }

  render() {
    const { actionStatus: { show, data } } = this.props
    const COMPONENT = data && data.component && COMPONENTS[data.component]
    return COMPONENT ? <COMPONENT open={show} message={(data && data.msg) ? data.msg:''} onClose={() => this.close() } />:null
  }
}

const COMPONENTS = {
  'CustomSnackbar':CustomSnackbar
}

ActionStatusHandler.defaultProps = {
  actionStatus: {show: false, data: null}
}

const type = {
  actionStatus: PropTypes.shape({
    show: PropTypes.bool.isRequired,
    data: PropTypes.object
  })
}

ActionStatusHandler.propTypes = type

const mapStateToProps = state => ({
  actionStatus: state.templates.actionStatus
})

const mapDispatchToProps = dispatch => ({
  handleActionStatus: (show, data) => dispatch(TemplatesActions.handleActionStatus(show, data))
})

const ActionStatusHandlerContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ActionStatusHandler)

ActionStatusHandlerContainer.propTypes = type

export default ActionStatusHandlerContainer
