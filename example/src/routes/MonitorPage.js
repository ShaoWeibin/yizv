import React from 'react';
import { connect } from 'dva';
// import MonitorMap from '../../exports/lib/index';
// import {MonitorMap} from '../components/index';
import { MonitorMap } from '../../../lib/bundle';
import styles from './MonitorPage.css';

function MonitorPage() {
  return (
    <div className={styles.normal}>
      <MonitorMap/>
    </div>
  );
}

MonitorPage.propTypes = {
};

function mapStateToProps(state) {
  return {
    ...state,
  };
}
 
export default connect(mapStateToProps)(MonitorPage);
