/**
 * Created by weibin.shao on 2018/9.26.
 * svg defs.
 */

import * as d3 from '../../assets/d3';

export function svgDefs(context) {
  function drawDefs(selection) {
    const defs = selection.append('defs');

    // point 阴影 filter
    const filter = defs.append('filter')
      .attr('id', 'point-shadow')
      .attr('x', '-40%')
      .attr('y', '-40%')
      .attr('width', '180%')
      .attr('height', '180%')
      .attr('filterUnits', 'userSpaceOnUse');

    filter.append('feGaussianBlur')
      .attr('result', 'blur2')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', 5);

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'blur2');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');
  }

  return drawDefs;
}