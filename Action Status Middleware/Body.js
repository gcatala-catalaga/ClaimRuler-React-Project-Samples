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
        <ActionStatusHandler />{/* SAMPLE CODE: Container component to handle action statuses */}
        <ModalHandler />
        {this.props.children}
      </div>
    )
  }
}

export default Body
