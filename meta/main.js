import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let xScale;
let yScale;

async function loadData() {
  return d3.csv('loc.csv', row => ({
    ...row,
    line:   Number(row.line),
    depth:  Number(row.depth),
    length: Number(row.length),
    date:     new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
}

function processCommits(data) {
  return d3.groups(data, d => d.commit).map(([commit, lines]) => {
    let first = lines[0];
    let ret = {
      id:         commit,
      url:        `https://github.com/nathaniel-trueba/portfolio/commit/${commit}`,
      author:     first.author,
      date:       first.date,
      time:       first.time,
      timezone:   first.timezone,
      datetime:   first.datetime,
      hourFrac:   first.datetime.getHours() + first.datetime.getMinutes() / 60,
      totalLines: lines.length,
    };
    Object.defineProperty(ret, 'lines', {
      value: lines,
      enumerable: false,
      configurable: true,
      writable: false,
    });
    return ret;
  });
}

function renderCommitInfo(data, commits) {
  let container = d3.select('#stats').append('div').attr('class', 'summary');
  container.append('h2').text('Summary');

  let dl = container.append('dl').attr('class', 'stats');

  const stats = [
    ['Commits',      commits.length],
    ['Files',        d3.group(data, d => d.file).size],
    ['<abbr title="Lines of Code">Total LOC</abbr>', data.length],
    ['Max Depth',    d3.max(data, d => d.depth)],
    ['Longest Line', d3.max(data, d => d.length)],
    ['Max Lines',    d3.max(commits, d => d.totalLines)],
  ];

  for (let [label, value] of stats) {
    dl.append('dt').html(label);
    dl.append('dd').text(value);
  }
}

function renderTooltipContent(commit) {
  if (Object.keys(commit).length === 0) return;
  document.getElementById('commit-link').href        = commit.url;
  document.getElementById('commit-link').textContent = commit.id;
  document.getElementById('commit-date').textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
  document.getElementById('commit-time').textContent = commit.time;
  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-lines').textContent  = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = event.clientX + 'px';
  tooltip.style.top  = event.clientY + 'px';
}

function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter(d => isCommitSelected(selection, d))
    : [];
  document.querySelector('#selection-count').textContent =
    `${selectedCommits.length || 'No'} commits selected`;
  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter(d => isCommitSelected(selection, d))
    : [];

  const lines = selectedCommits.flatMap(d => d.lines);
  const breakdown = d3.rollup(lines, v => v.length, d => d.type);
  const total = lines.length;

  const dl = document.getElementById('language-breakdown');
  dl.innerHTML = '';

  for (let [language, count] of d3.sort(breakdown, ([, a], [, b]) => d3.descending(a, b))) {
    const pct = d3.format('.1~%')(count / total);
    dl.innerHTML += `<dt>${language}</dt><dd>${count} lines (${pct})</dd>`;
  }
}

function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', d => isCommitSelected(selection, d));
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function renderScatterPlot(data, commits) {
  const width  = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top:    margin.top,
    right:  width  - margin.right,
    bottom: height - margin.bottom,
    left:   margin.left,
    width:  width  - margin.left - margin.right,
    height: height - margin.top  - margin.bottom,
  };

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  svg.call(d3.brush().on('start brush end', brushed));
  svg.selectAll('.dots, .overlay ~ *').raise();

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  // Gridlines (behind dots and axes)
  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Dots — sorted largest first so small dots render on top
  const sortedCommits = d3.sort(commits, d => -d.totalLines);
  svg.append('g')
    .attr('class', 'dots')
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', function (event, d) {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', function (event) {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // X axis
  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(d3.axisBottom(xScale));

  // Y axis
  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));

  svg.selectAll('.dots, .overlay ~ *').raise();
}

let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
