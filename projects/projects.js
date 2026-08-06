import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const colors = d3.scaleOrdinal(d3.schemeTableau10);

let selectedYear = null;

function getFilteredProjects() {
  return projects.filter((project) => {
    return selectedYear === null || project.year === selectedYear;
  });
}

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', data[i].label === selectedYear ? 'selected' : '')
      .on('click', () => {
        selectedYear = selectedYear === data[i].label ? null : data[i].label;

        svg
          .selectAll('path')
          .attr('class', (_, idx) =>
            data[idx].label === selectedYear ? 'selected' : '',
          );

        d3.select('.legend')
          .selectAll('li')
          .attr('class', (_, idx) =>
            data[idx].label === selectedYear ? 'legend-item selected' : 'legend-item',
          );

        renderProjects(getFilteredProjects(), projectsContainer, 'h2');
      });
  });

  let legend = d3.select('.legend');
  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', data[idx].label === selectedYear ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

renderPieChart(projects);
