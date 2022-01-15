const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'child-mortality';
let isHighlighted = false;
let selected = null;

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {

    colorScale.domain(new Set(data.map(d=>d.region)).values());

    d3.select('#range').on('change', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot();
        updateBar();
        updateLine();
    });

    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#x').on('change', function(){ 
        xParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#param').on('change', function(){ 
        param = d3.select(this).property('value');
        updateBar();
    });

    d3.select('#p').on('change', function() {
        lineParam = d3.select(this).property('value');
        updateLine();
    })

    function updateBar(){
        barChart.selectAll('rect').remove()

        let regions = Array.from(d3.rollup(data, v => d3.mean(v, d => d[param][year]), d => d.region), ([key, value]) => ({key, value}));

        xBar.domain(regions.map(r => r.key));
        yBar.domain([0, d3.max(regions, r => r.value)]);

        xBarAxis.call(d3.axisBottom(xBar))
        yBarAxis.call(d3.axisLeft(yBar))

        let selection = barChart.append('g').selectAll('rect')
            .data(regions).enter().append('rect')
            .attr("x", r => xBar(r.key))
            .attr("y", r => yBar(r.value))
            .attr("width", xBar.bandwidth())
            .attr("height", r => height - margin - yBar(r.value))
            .style('fill', r => colorScale(r.key));

        selection.on('click', (event, r) => {
                console.log('click');
                isHighlighted = !isHighlighted
                if (isHighlighted) {
                    selected = null;
                    d3.selectAll(selection.nodes()).style('opacity', .05);
                    d3.select(event.currentTarget).style('opacity', .7);
                    d3.selectAll('circle').style('opacity', .05);
                    d3.selectAll('circle[id*=bubbles-' + r.key + ']').style('opacity', .7);
                } else {
                    d3.selectAll('circle').style("opacity", .7);
                    d3.selectAll(selection.nodes()).style('opacity', .7);
                }
                updateLine();
            })

    }

    function updateScatterPlot() {
        scatterPlot.selectAll('circle').remove();

        x.domain([0, d3.max(data, d => Number(d[xParam][year]))]);
        y.domain([0, d3.max(data, d => Number(d[yParam][year]))]);
        radiusScale.domain([0, d3.max(data, d => Number(d[rParam][year]))]);

        xAxis.call(d3.axisBottom(x));
        yAxis.call(d3.axisLeft(y));

        let selection = scatterPlot.append('g').selectAll('circle')
            .data(data).enter().append('circle')
            .attr('id', d => 'bubbles-' + d.region.replaceAll(/\s/g, '-') + '-' + d.country.replaceAll(/\s/g, '-'))
            .attr('cx', d => x(d[xParam][year]))
            .attr('cy', d => y(d[yParam][year]))
            .attr('r', d => radiusScale(d[rParam][year]))
            .style('fill', d => colorScale(d.region));
        selection.on('click', (event, d) => {
                lineChart.selectAll('line').remove();
                if (selected === null) {
                    d3.selectAll(selection.nodes()).style("opacity", .05);
                    d3.select(event.currentTarget).style("opacity", .7);
                    selected = d;
                    isHighlighted = false;
                    d3.selectAll('rect').style('opacity', .7);
                } else {
                    d3.selectAll(selection.nodes()).style("opacity", .7);
                    selected = null;
                }
                updateLine();
            });
    }

    function updateLine() {
        lineChart.selectAll('path').remove();
        if (selected !== null) {
            countryName.html(selected[lineParam].country);
            let graph = Object.entries(selected[lineParam])
                .filter(([x, y]) => !isNaN(x) && x !== '')
                .map(([x, y]) => ([Number(x), Number(y)]))
                .map(([x, y]) => ({x, y}));

            x.domain([d3.min(graph, p => +p.x), d3.max(graph, p => +p.x)]);
            y.domain([d3.min(graph, p => +p.y), d3.max(graph, p => +p.y)]);

            xLineAxis.call(d3.axisBottom(x));
            yLineAxis.call(d3.axisLeft(y));
            xLineAxis.call(g => g.attr('display', 'block'));
            yLineAxis.call(g => g.attr('display', 'block'));

            lineChart.append('path')
                .datum(graph)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(p => x(p.x))
                    .y(p =>  y(p.y))
                );

        } else {
            countryName.html('');
            xLineAxis.call(g => g.attr('display', 'none'));
            yLineAxis.call(g => g.attr('display', 'none'));
        }
    }

    updateBar();
    updateScatterPlot();
});


async function loadData() {
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo === d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}