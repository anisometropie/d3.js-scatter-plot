const TRANSITION = 300
const WIDTH = 1200
const HEIGHT = 600

let isPlaying = true
let animation
const yearSlider = document.getElementById('yearSlider')
const button = document.getElementById('playButton')

const margin = { top: 10, right: 275, bottom: 150, left: 120 }
const width = WIDTH - margin.left - margin.right
const height = HEIGHT - margin.top - margin.bottom

const svg = d3
  .select('#chart')
  .append('svg')
  .attr('width', WIDTH)
  .attr('height', HEIGHT)

const insideGroup = svg
  .append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`)

// LEGEND
const legendGroup = svg
  .append('g')
  .attr('transform', `translate(${width + margin.left + 70}, 30)`)
const continentsGroup = legendGroup.append('g').attr('class', 'continents')
const populationGroup = legendGroup
  .append('g')
  .attr('class', 'population')
  .attr('transform', `translate(0, 165)`)
populationGroup
  .append('text')
  .attr('class', 'x-axis-label')
  .attr('font-size', '20px')
  .attr('transform', `translate(0, -20)`)
  .text('Population')

// LABELS
insideGroup
  .append('text')
  .attr('class', 'x-axis-label')
  .attr('font-size', '20px')
  .attr('text-anchor', 'middle')
  .attr('transform', `translate(${width / 2}, ${height + 50})`)
  .text('GDP per capita ($)')
insideGroup
  .append('text')
  .attr('class', 'y-axis-label')
  .attr('font-size', '20px')
  .attr('text-anchor', 'middle')
  .attr('transform', `translate(-40, ${height / 2}) rotate(-90)`)
  .text('Life expectancy (years)')
const yearLabel = insideGroup
  .append('text')
  .attr('class', 'year-label')
  .attr('font-size', '20px')
  .attr('transform', `translate(${width - 60}, ${height - 20})`)

// SCALES
const x = d3.scaleLog().range([0, width])
const y = d3.scaleLinear().range([height, 0])
const radiusScale = d3.scaleLinear().range([2, 10000])
const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

// AXES
const xAxisGroup = insideGroup
  .append('g')
  .attr('class', 'x-axis')
  .attr('transform', `translate(0, ${height})`)
const yAxisGroup = insideGroup.append('g').attr('class', 'y-axis')
const xAxisCall = d3
  .axisBottom(x)
  .tickFormat(d => `$${d}`)
  .tickValues([250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000])
const yAxisCall = d3.axisLeft(y)

// TRANSITION
const t = d3
  .transition()
  .duration(TRANSITION)
  .ease(d3.easeQuad)

// FETCH DATA
d3.json('data/data.json').then(data => {
  data.forEach(year => {
    year.countries = year.countries.filter(c =>
      Object.values(c).every(v => v !== null)
    )
  })
  const minIncome = d3.min(data, year =>
    d3.min(year.countries, country => country.income)
  )
  const maxIncome = d3.max(data, year =>
    d3.max(year.countries, country => country.income)
  )
  const maxLifeExp = d3.max(data, year =>
    d3.max(year.countries, country => country.life_exp)
  )
  const maxPopulation = d3.max(data, year =>
    d3.max(year.countries, country => country.population)
  )
  x.domain([minIncome, maxIncome])
  y.domain([0, maxLifeExp])
  radiusScale.domain([1, maxPopulation])
  xAxisGroup.call(xAxisCall)
  yAxisGroup.call(yAxisCall)
  update(data[yearSlider.value])
  toggleAnimation(data, true)
  yearSlider.onchange = () => {
    update(data[yearSlider.value])
  }
  yearSlider.oninput = () => {
    toggleAnimation(null, false)
  }
  button.onclick = () => {
    toggleAnimation(data)
  }
  const continentsList = Array.from(
    new Set(data[200].countries.map(c => c.continent))
  )
  const continentCircles = continentsGroup
    .selectAll('g')
    .data(continentsList)
    .enter()
    .append('g')
    .attr('class', 'legend-element-container')
  continentCircles
    .append('circle')
    .attr('cx', 0)
    .attr('cy', (d, i) => 30 * i)
    .attr('r', 8)
    .attr('fill', d => colorScale(d))
  continentCircles
    .append('text')
    .text(d => d)
    .attr('transform', (d, i) => `translate(15, ${5 + 30 * i})`)
    .attr('text-transform', 'uppercase')
  const populationCircles = populationGroup
    .selectAll('g')
    .data([100000, 1000000, 10000000, 100000000, 1000000000])
    .enter()
    .append('g')
    .attr('class', 'legend-element-container')
  populationCircles
    .append('circle')
    .attr('cx', 0)
    .attr('cy', (d, i) => 10 * i + 10 * i * i)
    .attr('r', d => Math.sqrt(radiusScale(d / Math.PI)))
    .attr('fill', 'black')
  populationCircles
    .append('text')
    .text(d => d3.format('.1s')(d))
    .attr('transform', (d, i) => `translate(60, ${5 + 10 * i + 10 * i * i})`)
    .attr('text-transform', 'uppercase')
})

const toggleAnimation = (data, newState = !isPlaying) => {
  isPlaying = newState
  button.value = newState ? '\u23f8' : '\u23f5'
  if (newState) {
    animation = setInterval(() => {
      if (yearSlider.value >= data.length) {
        clearInterval(animation)
      }
      yearSlider.value++
      update(data[yearSlider.value])
    }, TRANSITION)
  } else {
    clearInterval(animation)
  }
}

const update = yearData => {
  // JOIN
  const circles = insideGroup
    .selectAll('circle')
    .data(yearData.countries, d => d.country)
  // ENTER
  circles
    .enter()
    .append('circle')
    .attr('cx', d => x(d.income))
    .attr('cy', d => y(d.life_exp))
    .attr('r', d => Math.sqrt(radiusScale(d.population / Math.PI)))
    .attr('fill', d => colorScale(d.continent))
    .merge(circles)
    .transition(t)
    .attr('cx', d => x(d.income))
    .attr('cy', d => y(d.life_exp))
    .attr('r', d => Math.sqrt(radiusScale(d.population / Math.PI)))
  yearLabel.text(yearData.year)
  // EXIT
  circles.exit().remove()
}
