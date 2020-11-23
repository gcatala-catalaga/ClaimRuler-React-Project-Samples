import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { TableGriddle } from '../../../common/index'
import AdministrationActions from 'claimgolib/redux/Administration'
import TemplatesActions from 'claimgolib/redux/Templates'

class ApplicationTypeDiaries extends Component {
  state = {
    GROUP_NAME: '',
    GROUP_NAME_LABEL: '',
    diaries: []
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { itemsListDiaries, location } = nextProps
    const tn = location.pathname.split('/').pop()

    if(tn !== prevState.GROUP_NAME) {
      const tn_lbl = (tn) ? tn.charAt(0).toUpperCase() + tn.slice(1) : ''
      return{
        GROUP_NAME: tn,
        GROUP_NAME_LABEL: tn_lbl,
      }
    }

    if (prevState.diaries === itemsListDiaries) return null
    return {...prevState, diaries: itemsListDiaries}
  }

  shouldComponentUpdate(nextProps, nextState) {
    if(this.state.GROUP_NAME !== nextState.GROUP_NAME)
      this.getDiariesList(nextState.GROUP_NAME)
    return true
  }

  componentDidMount() {
    this.getDiariesList(this.state.GROUP_NAME)
    const { getPortalRequest, userRolesList, userRolesRequest } = this.props
    getPortalRequest()
    if (!userRolesList.length) {
      userRolesRequest();
  }
  }

  getDiariesList(type) {
    const { diariesRequest } = this.props
    diariesRequest(type)
  }

  menuOptions() {
    const { deleteDiary, itemsListDiaries, genEditBtn, genDeleteBtn } = this.props
    const { diaries } = this.state
    const menuItem = []

    if (genEditBtn) {
      menuItem.push({
        label: 'Edit',
        func: row => {
          const { handleModal } = this.props
          // SAMPLE CODE: call to launch modal
          handleModal({open: true, modal: 'DiaryAdd', data: {
            item: {...itemsListDiaries[row]},
              type: this.state.GROUP_NAME,
              existingDiaries: diaries}
          })
        },
      })
    }
    if (genDeleteBtn) {
      menuItem.push({
        label: 'Delete',
        func: row => {
          deleteDiary(this.state.diaries[row].diaryid, this.state.GROUP_NAME, MPK)
        },
      })
    }
    return menuItem
  }

  assingRolesToData(data) {
    const { userRolesList } = this.props;
    const payload = [];
    let mapedRoles = {};
    userRolesList.forEach(({roleid, name}) => {
      mapedRoles[roleid] = name;
    });
    data.forEach(row => {
        const newData = {...row};
        if (row['assigned_role']) {
          newData['assigned_role'] = mapedRoles[row['assigned_role']];
        } else {
            newData['assigned_role'] = '-';
        }
        payload.push(newData);
    });
    return payload;
  }

  render() {
    const { GROUP_NAME_LABEL } = this.state
    const { t, genAddBtn } = this.props
    const { diaries } = this.state
    console.log('existing diaries passed from parent:')
    console.table(diaries)
    return (
      <div className="col m12 s12">
        <div className="card">
          <div className="card-head">
            <h5>{t(`generic.${GROUP_NAME_LABEL}`)} / {t('generic.Diaries')}</h5>
          </div>
          <div className="section no-padding__top">
            <div className="section-header has-actions">
              <h5 className="section-header__label">{t('generic.Diaries')}</h5>
              <div className="section-header__actions">
                {genAddBtn &&
                <button
                  className="waves-effect waves-light btn btn-primary regular-green has-icon"
                  onClick={() => {
                    const {handleModal} = this.props
                    handleModal({
                      open: true,
                      modal: 'DiaryAdd',
                      data: {
                        item: {},
                        type: this.state.GROUP_NAME,
                        existingDiaries: diaries
                      }}) }
                  } >
                  <i className="material-icons">add</i>
                  <span>{t('generic.Add Diary')}</span>
                </button>
                }
              </div>
            </div>
            {console.log(diaries)}
            <TableGriddle
              idTable="ApplicationTypeDiaries"
              sort="type"
              tableClass="centered"
              data={this.assingRolesToData(diaries)}
              columnDefinition={[
                { id: 'status_type', title: t('generic.Name'), cellClass: 'left-align', width: 300 },
                { id: 'due', title: t('generic.Days Due') },
                { id: 'assigned_role', title: t('generic.Role')},
                {
                  id: '',
                  title: '',
                  showMenu: this.menuOptions(),
                  width: 5,
                  sortable: false,
                }
              ]}
            />
          </div>
        </div>
      </div>
    )
  }
}
const MPK = "itemsListDiaries"

ApplicationTypeDiaries.defaultProps = {
  itemsListDiaries: [],
  deleteDiary: undefined,
  diariesRequest: undefined,
  portal: undefined
}

const types = {
  itemsListDiaries: PropTypes.array,
  t: PropTypes.func.isRequired,
  deleteDiary: PropTypes.func,
  diariesRequest: PropTypes.func,
  portal: PropTypes.array
}

ApplicationTypeDiaries.propTypes = types

const mapStateToProps = state => ({
  itemsListDiaries: state.administration.itemsListDiaries,
  portal: state.administration.portal,
  userRolesList: state.administration.userRolesList,
})

const mapDispatchToProps = dispatch => ({
  deleteDiary: (listName, DiaryId, index) => dispatch(AdministrationActions.deleteDiariesRequest(listName, DiaryId, index)),
  diariesRequest: (diaryid, type, MapPropKey) => dispatch(AdministrationActions.getDiariesRequest(diaryid, type, MapPropKey)),
  getPortalRequest: () => dispatch(AdministrationActions.getPortalRequest()),
  handleModal: (data) => dispatch(TemplatesActions.handleModal(data)),// SAMPLE CODE: call to launch modal
  userRolesRequest: () => dispatch(AdministrationActions.getUserRolesRequest()),
})

const ApplicationTypeDiariesContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ApplicationTypeDiaries)
ApplicationTypeDiariesContainer.propTypes = types

export default ApplicationTypeDiariesContainer
