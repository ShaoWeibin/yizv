import * as d3 from '../../assets/d3';
import { svgDefs } from './defs';
import styles from './monitorMap.less';

const moduleTypes = {
  MODEL: 'model',
  SCHEME: 'scheme',
  SCENCE: 'scence',
};

/**
 * data 未比传数据
 * width 和 height可不传值, 默认获取容器的尺寸
 * context: {
 *   data:{},
 *   options: {
 *     width: 1000,
 *     height: 10000,
 *   },
 * }
 */
export function rendererMap(context) {
  const root = {};
  const { data, options } = context;
  let width;
  let height;
  let rx;
  let ry;
  let radius;
  // 圆环半径参数
  let ringRadius;
  // 坐标系: x-角度 y-半径
  let cluster;

  // 初始化参数
  init(options);

  /**
   * 坐标投影
   */
  const projection = (x, y) => {
    const angle = x * Math.PI / 180;
    return [y * Math.cos(angle), y * Math.sin(angle)];
  }

  // 模块间 link 计数, 用于计算模块间 link 圆弧半径
  const linkTotal = {
    [moduleTypes.MODEL]: 0,
    [moduleTypes.SCENCE]: 0,
  }

  /**
   * tooltip
   */
  const toolTip = d3.select('body')
    .append('div')
    .attr('id', 'tooltipContainer')
    .style('opacity', 0);

  /**
   * 初始化参数
   * @param {Object} options
   */
  function init(options = {}) {
    width = options.width;
    height = options.height;

    if (!width || !height) {
      return;
    }

    rx = width / 2;
    ry = height / 2;
    radius = Math.min(rx, ry);

    // 圆环半径参数
    ringRadius = {
      [moduleTypes.MODEL]: {
        inner: radius - 180,
        outer: radius,
        width: 180,
      },
      [moduleTypes.SCHEME]: {
        inner: radius - 320,
        outer: radius - 260,
        width: 60,
      },
      [moduleTypes.SCENCE]: {
        inner: radius - 460,
        outer: radius - 400,
        width: 60,
      },
    }

    // 坐标系: x-角度 y-半径
    cluster = {
      [moduleTypes.MODEL]: d3.cluster().size([360, radius - 430]),
      [moduleTypes.SCHEME]: d3.cluster().size([360, (radius - 290) * 2]),
      [moduleTypes.SCENCE]: d3.cluster().size([360, (radius - 60) * 2]),
    }
  }

  /**
   * 坐标转换
   * 根据 cluster 生成场景二级坐标与所需坐标不符, 需要进一步转换
   * @param {Object} root 
   */
  function coordConvert(root) {
    const convert = {
      [moduleTypes.SCENCE]: (root) => {
        // 数据扁平化
        const flatList = root.descendants();
        flatList.map(item => {
          // 场景二级 y 坐标转换
          if (item.depth === 2) {
            item.y = item.y / 2 - 60;
          }
        });

        return root;
      },
    }

    for (const [key, value] of Object.entries(root)) {
      const convertFunc = convert[key];
      if (convertFunc) {
        convertFunc(value);
      }
    }

    return root;
  }

  /**
   * node filter
   * 过滤不需要展示的 node 数据
   */
  function nodeFilter() {
    const filter = {
      [moduleTypes.SCENCE]: (item) => {
        return item.depth > 0;
      },
      [moduleTypes.MODEL]: (item) => {
        return item.depth > 0;
      },
      [moduleTypes.SCHEME]: (item) => {
        return item.depth > 0 && item.data.type === moduleTypes.SCHEME;
      }
    }

    return filter;
  }

  /**
   * link filter
   * 过滤不需要展示的 link 数据
   */
  function linkFilter() {
    const filter = {
      [moduleTypes.SCENCE]: item => item.depth > 1,
      [moduleTypes.MODEL]: item => item.depth > 1,
      [moduleTypes.SCHEME]: item => item.depth > 1 && item.depth < 2,
    }

    return filter;
  }

  /**
   * 添加图层
   */
  function addLayers(selection) {
    const layers = [
      'link-layer',
      'indirect-link',
      'node-layer',
    ];

    selection.selectAll('.layer')
      .data(layers)
      .enter()
      .append('g')
      .attr('class', (d) => `layer ${d}`);
  }

  /**
   * 根据数据绘制 nodes 和 links
   * @param {Object} selectio
   */
  function draw(selection) {
    // 根据数据绘制 node 和 link
    for (const [key, value] of Object.entries(root)) {
      const nodeData = value.descendants()
        .filter(nodeFilter()[key]);
      const linkData = value.descendants()
        .filter(linkFilter()[key])
        .map((d) => {
          return {
            ...d,
            from: d,
            to: d.parent,
          };
        });

      const nodes = getNodes(
        selection.select('.node-layer'),
        nodeData,
        `.node.${key}`
      ).enter();

      const links = getNodes(
        selection.select('.link-layer'),
        linkData,
        `.link.${key}`
      ).enter();

      // 绘制模块 link
      drawLinks(links, `${key}`);
      // 绘制模块 node
      drawNodes(nodes, `${key}`);
    }

    // 重新计算方案 node 的 children(model scence)
    reCalcChildren(root.scheme);
    // 获取绘制模块间 link 对应的数据
    const indirectLinkData = root.scheme.descendants()
      .filter(item => {
        return item.__parent__;
      }).reduce((nodeList, item) => {
        return nodeList.concat(
          item.__parent__.map((parent) => {
            return {
              from: item,
              to: parent,
            };
          }))
      }, []);

    // 绘制 scheme 和 model, scence 之间的间接关系 link
    const indirectGroups = getNodes(
      selection.select('.indirect-link'),
      indirectLinkData,
      'path.scheme.indirect'
    ).enter();

    drawIndirectLinks(indirectGroups, 'scheme indirect');
  }

  function drawCircleRing(selection) {
    // 圆环
    const circleRing = (innerRadius, outerRadius) => {
      return d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(0)
        .endAngle(2 * Math.PI);
    };

    // 第一级圆环-模型
    selection.append('svg:path')
      .attr('class', 'arc')
      .attr('d', circleRing(
        ringRadius[moduleTypes.MODEL].inner,
        ringRadius[moduleTypes.MODEL].outer));

    // 第二级圆环-方案
    selection.append('svg:path')
      .attr('class', 'arc2')
      .attr('d', circleRing(
        ringRadius[moduleTypes.SCHEME].inner,
        ringRadius[moduleTypes.SCHEME].outer));

    // 第三级圆环-场景
    selection.append('svg:path')
      .attr('class', 'arc3')
      .attr('d', circleRing(
        ringRadius[moduleTypes.SCENCE].inner,
        ringRadius[moduleTypes.SCENCE].outer));
  }

  /**
   * 绘制 nodes
   * @param {*} projection 
   * @param {*} nodes 
   * @param {*} className 
   */
  function drawNodes(nodes, className) {
    const node = nodes.append('g')
      .attr('class', `node ${className}`)
      .attr('transform', (d) => {
        return `translate(${projection(d.x, d.y)})`;
      })
      .on('click.node', function (d) {
        d3.event.stopPropagation();
        activeNode(this, 'active');
      })
      .on('mouseenter.node', function (d) {
        d3.event.stopPropagation();
        activeNode(this, 'hover');
      })
      .on('mouseleave.node', function (d) {
        inactiveNode(this, 'hover');
      });

    node.append('circle')
      .attr('r', 8);

    node.append('text')
      .attr('x', (d) => {
        return d.x < 180 ? 10 : 10;
      })
      .attr('dy', '.3em')
      .text(d => d.data.name);

    showToolTip(node);
  }

  /**
   * 绘制 links
   * @param {*} projection 
   * @param {*} links 
   * @param {*} className 
   */
  function drawLinks(links, className) {
    const link = links.append('path')
      .attr('class', `link ${className}`)
      .attr('d', (d) => {
        // 三次贝塞尔曲线
        const { from, to } = d;
        return `M${projection(from.x, from.y)}`
          + `C${projection(from.x, (from.y + to.y) / 2)} `
          + `${projection(to.x, (from.y + to.y) / 2)} `
          + `${projection(to.x, to.y)}`;
      });

    showToolTip(link);
  }

  /**
   * 绘制不同 root 之间的间接关系连线
   * @param {*} projection 
   * @param {*} links 
   * @param {*} className 
   */
  function drawIndirectLinks(links, className) {
    const getPath = (d) => {
      const { from, to } = d;
      const angleThreshold = 20;

      // from 和 to 节点射线夹角
      let angle = to.x - from.x;
      // 0-逆时针 1-顺时针
      let direction = angle > 0 ? 1 : 0;

      // 夹角需要换算, 防止圆弧大于 180 度
      if (angle > 180) {
        angle = angle - 360;
        direction = 0;
      }
      if (angle < -180) {
        angle += 360;
        direction = 1;
      }

      // 夹角较小直接绘制三次贝塞尔曲线
      if (Math.abs(angle) < angleThreshold) {
        return `M${projection(from.x, from.y)}`
          + `C${projection(from.x, (from.y + to.y) / 2)} `
          + `${projection(to.x, (from.y + to.y) / 2)} `
          + `${projection(to.x, to.y)}`;
      }

      const padding = 10;
      const schemeRing = ringRadius[moduleTypes.SCHEME];
      const moduleType = from.data.type || from.parent.data.type;
      const space = (80 - 2 * padding) / linkTotal[moduleType];
      const variable = schemeRing.width / 2 + padding;
      const nodeIndex = from.data.index[to.data.id];
      // 圆弧半径
      const radius = from.data.type === moduleTypes.MODEL
        ? to.y - variable - space * nodeIndex
        : to.y + variable + space * nodeIndex;

      const deltaAngle = direction === 1
        ? angleThreshold / 2
        : -angleThreshold / 2;

      // 弧线是大于还是小于180度, 0-小角度弧, 1-大角度弧
      const largeArcFlag = angle - deltaAngle * 2 > 180 ? 1 : 0;

      const arc = `A ${radius} ${radius} 0 ${largeArcFlag}`
        + `${direction} ${projection(to.x - deltaAngle, radius)}`;

      // 两端为二次贝塞尔曲线
      // 中间部分为圆弧
      return `M${projection(from.x, from.y)}`
        + `Q${projection(from.x, radius)} `
        + `${projection(from.x + deltaAngle, radius)}`
        + arc
        + `Q${projection(to.x, radius)} `
        + `${projection(to.x, to.y)}`;
    };

    const link = links.append('path')
      .attr('class', `link ${className}`)
      .attr('d', getPath);
  }

  /**
   * active node and link
   * 触发方式: hover 和 click
   * @param {Object} target 目标节点
   */
  function activeNode(target, className) {
    // 获取当前节点关联的其他 node 数据
    const relatedNode = {};
    findRelatedNode(
      relatedNode,
      target.__data__,
      target.__data__.data.type
    );

    // 设置所有关联 link 的样式
    // link 的起终点为关联 node, 则 link 需要高亮
    d3.selectAll('.link').each(function (d) {
      const { from, to } = d;
      if (relatedNode[from.data.id]
        && relatedNode[to.data.id]) {
        d3.select(this).classed(className, true);
      }
    });

    // 设置所有关联 node 的样式
    d3.selectAll('.node').each(function (d) {
      if (relatedNode[d.data.id]) {
        d3.select(this)
          .classed(className, true)
          .select('circle')
          .attr('filter', 'url(#point-shadow)');
      }
    });

    // active 要素层级提升
    d3.selectAll(`.link.${className}`).raise();

    // target node 绘制圆环
    d3.select(target)
      .classed(`${className}-target`, true)
      .append('circle')
      .classed(className, true)
      .attr('r', 12);
  }

  /**
   * inactive node and link
   * @param {Object} target 目标节点
   */
  function inactiveNode(target, className) {
    d3.selectAll(`.node.${className}`)
      .classed(className, false)
      .select('circle')
      .attr('filter', null);

    d3.selectAll(`.link.${className}`)
      .classed(className, false);

    // remove target node 圆环
    d3.selectAll(`.${className}-target`)
      .classed(`${className}-target`, false)
      .selectAll(`circle.${className}`)
      .remove();
  }

  /**
   * 递归获取当前节点关联的其他 node 数据
   * TODO 此算法不够清晰, 需考虑优化
   * @param {Object} relatedNodes 结果对象
   * @param {Object} target 当前节点数据
   * @param {String} moduleType 目标节点类型
   */
  function findRelatedNode(relatedNodes, target, moduleType) {
    if (target.depth === 0) {
      return;
    }

    relatedNodes[target.data.id] = target;

    // 获取当前节点的子节点数据
    if (target.children) {
      target.children.map(item => {
        // item 的 parent 已获取时不需要继续查找, 防止死循环
        if (!relatedNodes[item.parent.data.id]) {
          // shceme -> child 都认为是关联 node
          // 其他类型的跟自身不同类型的才认为是关联节点
          if (moduleType === moduleTypes.SCHEME) {
            relatedNodes[item.data.id] = item;
          } else {
            if (item.data.type !== moduleType) {
              relatedNodes[item.data.id] = item;
            }
          }

          if (item.children
            || (item.parent
              && item.parent.depth !== 0
              && moduleType !== moduleTypes.SCENCE
              )) {
            findRelatedNode(relatedNodes, item, moduleType);
          }
        }
      });
    }

    // 获取当前节点的父节点数据
    const parent = target.parent;
    if (parent && parent.depth !== 0) {
      relatedNodes[parent.data.id] = parent;
      findRelatedNode(relatedNodes, parent, moduleType);
    }

    // 获取当前节点的间接父节点数据
    const __parent__ = target.__parent__;
    if (__parent__ && moduleType === target.data.type) {
      __parent__.map(item => {
        if (!relatedNodes[item.data.id]) {
          relatedNodes[item.data.id] = item;

          if (item.children) {
            findRelatedNode(relatedNodes, item, moduleType);
          }
        }
      });
    }
  }

  /**
   * 展示 tooltip
   * 通过先 remove, 后 append 来更改提示框的文字
   * 通过更改样式 left 和 top 来设定提示框的位置
   * 设定提示框的透明度为1.0（完全不透明）
   * @param {*} node 
   */
  function showToolTip(node) {
    node.on('mouseenter.tooltip', (d) => {
      if (!d) {
        return;
      }

      // 移除 tooltip 中旧内容
      toolTip.selectAll('div.container').remove();

      // 构造 tooltip ui
      const container = toolTip
        .append('div')
        .classed('container', true);

      container.append('h3')
        .text(d.data.name);

      [
        `名称：${d.data.name}`,
        `id：${d.data.id}`,
        `类型：${d.data.type}`,
      ].map(text => (
        container.append('p')
          .text(text)
      ));

      // 设置 tooltip 展示位置
      toolTip
        .style('left', `${d3.event.pageX}px`)
        .style('top', `${d3.event.pageY + 20}px`)
        .style('opacity', 1);
    }).on('mousemove.tooltip', () => {
      // 鼠标移动时，更改样式 left 和 top 来改变提示框的位置
      toolTip.style('left', `${d3.event.pageX}px`)
        .style('top', `${d3.event.pageY + 20}px`);
    }).on('mouseleave.tooltip', () => {
      toolTip.style('opacity', 0);
    });
  }

  /**
   * 绑定数据
   */
  function getNodes(selection, data, className) {
    return selection.selectAll(className)
      .data(data);
  }

  /**
   * 重新计算方案 node 的 children
   * @param {*} root 
   */
  function reCalcChildren(data) {
    if (data.children.length) {
      data.children.map(item => {
        item.children.map((item, index) => {
          const node = findNodeById(root, item.data);
          if (node) {
            // 计算 node 索引
            const moduleType = node.data.type || node.parent.data.type;
            if (node.__parent__) {
              node.__parent__.push(item.parent);
              node.data.index[item.parent.data.id] = linkTotal[moduleType]++;
            } else {
              node.__parent__ = [item.parent];
              node.data.index = {
                [item.parent.data.id]: linkTotal[moduleType]++,
              }
            }
            item.parent.children[index] = node;
          }
        });
      });
    }
  }

  /**
   * 根据 id 查找数据节点
   * @param {Object} root 
   * @param {String} id 
   */
  function findNodeById(root, id) {
    for (const [key, value] of Object.entries(root)) {
      // 数据扁平化
      const flatList = value.descendants();
      for (let i = 0, n = flatList.length; i < n; i++) {
        const item = flatList[i];
        if (typeof item.data === 'object'
          && item.data.id === id) {
          return item;
        }
      }
    }
  }

  /**
   * set root
   */
  function setRoot() {
    for (const [key, value] of Object.entries(data)) {
      // 数据分层布局
      const childRoot = d3.hierarchy(data[key]);
      // 运行簇布局
      root[key] = cluster[key](childRoot);
    }

    // 坐标转换
    coordConvert(root);
  }

  /**
   * zoom
   */
  function zoom(selection, group) {
    const d3Zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      // TODO 有问题, 需进一步研究
      // .translateExtent([[0, 0], [width + rx, height + ry]])
      .on('zoom.svg', () => {
        // if (d3.event.sourceEvent) {
        group.attr('transform', d3.event.transform);
        // }
      });

    const transform = () => {
      return d3.zoomIdentity
        .translate(rx, ry);
    }

    const transition = (selection) => {
      selection.transition()
        .delay(500)
        .duration(5000)
        .call(d3Zoom.transform, transform)
        .on('end.svg', () => {
          selection.call(transition);
        });
    };

    selection
      .call(d3Zoom)
      .call(d3Zoom.transform, transform);
    // .call(transition);
  }

  /**
   * click map
   */
  function click(selection) {
    // 移除 node 激活态
    selection.on('click.svg', () => {
      inactiveNode(null, 'active');
    });
  }

  function map(selector) {
    // 外部未传入 width 和 height 时, 需获取容器的尺寸初始化参数
    if (!width || !height) {
      const container = d3.select(selector).node();
      init({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    }

    setRoot();

    const svg = d3.select(selector).append('svg')
      .attr('width', width)
      .attr('height', height)
      .call(svgDefs());

    const g = svg.append('g')
      .attr('transform', `translate(${rx}, ${ry})`);

    // 设置缩放范围及缩放响应事件
    // svg.on('dblclick.svg', () => {
    //   // 双击重置中心
    //   // g.call(d3.zoom().scaleTo, 1);
    //   // g.attr('transform', `translate(${rx}, ${ry})`);
    // })

    // click
    svg.call(click);

    // map zoom
    svg.call(zoom, g);

    // 绘制圆环
    drawCircleRing(g);

    // add layers
    addLayers(g);

    draw(g);
  }

  map.init = (data, target) => {
    // if (data) {
    //   this.data = data;
    // }
  }

  return map;
}
