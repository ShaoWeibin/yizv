import React, { PureComponent } from 'react';
import styles from './index.less';
import { Map, rendererMap } from './monitorMap';

const schemeData = {
  name: 'scheme',
  type: 'scheme',
  children: [{
    id: 'scheme1',
    name: '方案1',
    type: 'scheme',
    models: [
      'model1',
      'model2',
    ],
    scences: [
      'scence1',
      'scence2',
    ],
    children: [
      'model3',
      'model2',
      'model5',
      'scence21',
      'scence22',
      'scence37',
      'scence27',
      'scence33',
    ]
  },
  {
    id: 'scheme2',
    name: '方案2',
    type: 'scheme',
    models: [
      'model1',
      'model2',
      'model5',
    ],
    scences: [
      'scence1',
      'scence2',
      'scence6',
    ],
    children: [
      'model1',
      'model2',
      'model5',
      'scence21',
      'scence22',
      'scence26',
      'scence28',
      'scence29',
      'scence40',
    ]
  },
  {
    id: 'scheme3',
    name: '方案3',
    type: 'scheme',
    models: [
      'model3',
      'model4',
    ],
    scences: [
      'scence2',
      'scence5',
    ],
    children: [
      'model3',
      'model4',
      'model1',
      'scence22',
      'scence25',
      'scence33',
      'scence36',
      'scence39',
    ]
  },
  {
    id: 'scheme4',
    name: '方案4',
    type: 'scheme',
    models: [
      'model1',
      'model4',
    ],
    scences: [
      'scence3',
      'scence5',
    ],
    children: [
      'model1',
      'model4',
      'model2',
      'scence23',
      'scence25',
      'scence32',
      'scence35',
      'scence38',
    ]
  },
  {
    id: 'scheme5',
    name: '方案5',
    type: 'scheme',
    models: [
      'model3',
      'model5',
    ],
    scences: [
      'scence4',
      'scence6',
    ],
    children: [
      'model3',
      'model5',
      'model1',
      'scence24',
      'scence26',
      'scence31',
      'scence34',
      'scence37',
    ]
  },
  {
    id: 'scheme6',
    name: '方案6',
    type: 'scheme',
    models: [
      'model2',
      'model4',
    ],
    scences: [
      'scence2',
      'scence5',
    ],
    children: [
      'model2',
      'model4',
      'scence22',
      'scence25',
      'scence30',
      'scence33',
      'scence36',
    ]
  }],
};

const modelData = {
  name: 'model',
  type: 'model',
  children: [{
    id: 'model1',
    name: '模型1',
    type: 'model',
  },
  {
    id: 'model2',
    name: '模型2',
    type: 'model',
  },
  {
    id: 'model3',
    name: '模型3',
    type: 'model',
  },
  {
    id: 'model4',
    name: '模型4',
    type: 'model',
  },
  {
    id: 'model5',
    name: '模型5',
    type: 'model',
  }],
};

const scenceData = {
  name: 'scence',
  type: 'scence',
  children: [{
    id: 'scence1',
    name: '场景一级1',
    type: 'scence',
    children: [
      {
        id: 'scence21',
        name: '场景二级1',
        type: 'scence',
      },
      {
        id: 'scence22',
        name: '场景二级2',
        type: 'scence',
      },
      {
        id: 'scence23',
        name: '场景二级3',
        type: 'scence',
      }
    ]
  },
  {
    id: 'scence2',
    name: '场景一级2',
    type: 'scence',
    children: [
      {
        id: 'scence24',
        name: '场景二级1',
        type: 'scence',
      },
      {
        id: 'scence25',
        name: '场景二级2',
        type: 'scence',
      },
      {
        id: 'scence26',
        name: '场景二级3',
        type: 'scence',
      }
    ]
  },
  {
    id: 'scence3',
    name: '场景一级3',
    type: 'scence',
    children: [
      {
        id: 'scence27',
        name: '场景二级1',
        type: 'scence',
      },
      {
        id: 'scence28',
        name: '场景二级2',
        type: 'scence',
      },
      {
        id: 'scence29',
        name: '场景二级3',
        type: 'scence',
      }
    ]
  },
  {
    id: 'scence4',
    name: '场景一级4',
    type: 'scence',
    children: [
      {
        id: 'scence30',
        name: '场景二级1',
        type: 'scence',
      },
      {
        id: 'scence31',
        name: '场景二级2',
        type: 'scence',
      },
      {
        id: 'scence32',
        name: '场景二级3',
        type: 'scence',
      }
    ]
  },
  {
    id: 'scence5',
    name: '场景一级5',
    type: 'scence',
    children: [
      {
        id: 'scence33',
        name: '场景二级1',
        type: 'scence',
      },
      {
        id: 'scence331',
        name: '场景二级2',
        type: 'scence',
      },
      {
        id: 'scence34',
        name: '场景二级3',
        type: 'scence',
      }
    ]
  },
  {
    id: 'scence6',
    name: '场景一级6',
    type: 'scence',
    children: [
      {
        id: 'scence35',
        name: '场景二级1',
        type: 'scence',
      },
      {
        id: 'scence36',
        name: '场景二级2',
        type: 'scence',
      },
      {
        id: 'scence37',
        name: '场景二级3',
        type: 'scence',
      }
    ]
  },
  {
    id: 'scence7',
    name: '场景一级7',
    type: 'scence',
    children: [
      {
        id: 'scence38',
        name: '场景二级1',
        type: 'scence',
      },
      {
        id: 'scence39',
        name: '场景二级2',
        type: 'scence',
      },
      {
        id: 'scence40',
        name: '场景二级3',
        type: 'scence',
      }
    ]
  }],
};

class MonitorMap extends PureComponent {
  constructor(props) {
    super(props);
    this.map = null;
  }

  componentDidMount() {
    // 做延时处理, 否则无法获取容器尺寸
    setTimeout(() => {
      this.initMap({
        model: modelData,
        scheme: schemeData,
        scence: scenceData,
      });
    }, 0);
  }

  componentDidUpdate() {
    
  }

  initMap(data) {
    this.map = rendererMap({
      data,
      options: {
        width: 1800,
        height: 1200,
      }
    });
    this.map('#monitorMap');
  }

  render() {
    return (
      <div id="monitorMap" className={styles.monitorMap}>
      </div>
    );
  }
}

MonitorMap.propTypes = {

};

export default MonitorMap;