import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ActionStatusHandler from '../../common/ActionStatusHandler'
import ModalHandler from '../../common/ModalHandler'

class Body extends Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  }

  render() {
    return (
      <div className="app">
        <ActionStatusHandler />
        <ModalHandler />{/* SAMPLE CODE: Modal handler container component */}
        {this.props.children}
      </div>
    )
  }
}

export default Body
