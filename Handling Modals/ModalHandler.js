import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { ModalMap } from './modals/index'

// SAMPLE CODE: Modal handler container component class
class ModalHandler extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showModal: false
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { activeModal } = nextProps
    return { showModal: activeModal.open }
  }

  renderModal = () => {
    const { activeModal } = this.props
    const Component = ModalMap[activeModal.modal]
    return (
      <Component name={activeModal.modal} data={activeModal.data} />
    )
  }

  render() {
    const { showModal } = this.state
    return (showModal) ? this.renderModal() : null
  }
}

ModalHandler.defaultProps = {
  activeModal: {
    open: false,
    modal: 'McGuffin',
    data: null
  }
}

const type = {
  activeModal: PropTypes.shape({
    open: PropTypes.bool.isRequired,
    modal: PropTypes.string.isRequired,
    data: PropTypes.object
  })
}

ModalHandler.propTypes = type

const mapStateToProps = state => ({
  activeModal: state.templates.activeModal
})


const ModalHandlerContainer = connect(
  mapStateToProps
)(ModalHandler)

ModalHandlerContainer.propTypes = type

export default ModalHandlerContainer