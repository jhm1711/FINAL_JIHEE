import * as d3 from "d3";
import "./viz.css";

const descriptions = {
  "button-1": "정부에서 권장하는 화장로 1기당 일일 화장건수는 3건이다.",
  "button-2":
    "많은 지역에서 화장시설이 부족한 사태이고 2025년 초고령 사회로의 진입이 전망되는 상황에서 화장시설 확대 필요성은 더욱 증가하고 있다.",
  "button-3":
    "인구가 많은 서울시는 권장 화장 건수를 가장 큰 폭으로 초과하고 있다. 하지만 화장장은 혐오시설로 인식되기 때문에 부족한 상황에서도 서울 같은 도심에서 시설 확충이 어려운 상황이다.",
};

const buttons = document.querySelectorAll(".buttons");
const textDesc = document.getElementById("text-desc");

// let isButton2Clicked = false;

let circles, path;

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    if (textDesc.textContent === descriptions[button.id]) {
      textDesc.textContent = "";
      textDesc.classList.add("hidden");
      textDesc.style.display = "none";
      resetChart();
    } else {
      textDesc.textContent = descriptions[button.id];
      textDesc.classList.remove("hidden");
      textDesc.style.display = "block";

      if (button.id === "button-1") {
        path
          .transition()
          .duration(500)
          .attr("stroke-width", 2)
          .attr("stroke", "white");
      } else if (button.id === "button-2") {
        svg
          .selectAll("circle")
          .transition()
          .duration(500)
          .attr("fill-opacity", (d) =>
            yScale(d.daily) < yScale(d.crematorium * 3.3) ? 1 : 0.5
          )
          .attr("r", (d) =>
            yScale(d.daily) < yScale(d.crematorium * 3.3)
              ? radiusScale(d.cases) * 1.5
              : radiusScale(d.cases)
          );
      } else if (button.id === "button-3") {
        const filteredData = data.filter(
          (d) => d.daily === 52 || d.daily === 112
        );

        circles
          .data(filteredData, (d) => d.id)
          .transition()
          .duration(500)
          .attr("fill-opacity", 1)
          .attr("r", (d) =>
            yScale(d.daily) < yScale(d.crematorium * 3.3)
              ? radiusScale(d.cases) * 1.5
              : radiusScale(d.cases)
          );
      } else {
        console.log("Other button clicked");
      }
    }
  });
});

function resetChart() {
  svg
    .selectAll("circle")
    .transition()
    .duration(500)
    .attr("fill-opacity", 0.5)
    .attr("r", (d) => radiusScale(d.cases));

  path
    .transition()
    .duration(500)
    .attr("stroke-width", 1)
    .attr("stroke", "#6f6f6f");
}

// SVG 요소 생성
const svg = d3.select("#svg-container").append("svg").attr("id", "svg");

// 초기 너비와 높이 계산
let width = parseInt(d3.select("#svg-container").style("width"));
let height = parseInt(d3.select("#svg-container").style("height"));

const margin = { top: 25, right: 20, bottom: 60, left: 70 };

// parsing & formatting
const formatXAxis = d3.format("~s");

// scale
const xScale = d3
  .scaleLinear()
  .domain([0, 23])
  .range([margin.left, width - margin.right]);

const yScale = d3
  .scaleLinear()
  .range([height - margin.bottom + 50, margin.top]);

const radiusScale = d3.scaleSqrt().range([4, 4]);

// axis
const xAxis = d3
  .axisBottom(xScale)
  .tickFormat((d) => formatXAxis(d))
  .ticks(10);

let yAxis = d3.axisLeft(yScale).ticks(5);

svg.attr("width", width).attr("height", height);

const xAxisGroup = svg
  .append("g")
  .attr("class", "axis")
  .attr("transform", `translate(0,${height - margin.bottom + 50})`)
  .call(xAxis);

const yAxisGroup = svg
  .append("g")
  .attr("class", "axis")
  .attr("transform", `translate(${margin.left},0)`);

const xAxisLabel = svg
  .append("text")
  .attr("class", "axis-label")
  .attr("transform", `translate(${width / 2}, ${height - margin.bottom + 100})`)
  .style("text-anchor", "middle")
  .text("화장로수");

const yAxisLabel = svg
  .append("text")
  .attr("class", "axis-label")
  .attr("transform", `translate(${margin.left - 50}, ${height / 2})rotate(-90)`)
  .style("text-anchor", "middle")
  .text("일평균 가동횟수");

let data = [];

d3.json("data/2022_crematorium_2.json").then((raw_data) => {
  data = raw_data.map((d) => {
    d.crematorium = parseInt(d.crematorium);
    d.cases = parseInt(d.cases);
    d.daily = parseInt(d.daily);
    return d;
  });

  yScale.domain([0, d3.max(data, (d) => d.daily)]);
  radiusScale.domain([0, d3.max(data, (d) => d.cases)]);

  yAxisGroup.call(yAxis);

  circles = svg
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.crematorium))
    .attr("cy", (d) => yScale(d.daily))
    .attr("r", (d) => radiusScale(d.cases))
    .attr("fill", (d) =>
      yScale(d.daily) < yScale(d.crematorium * 3.3) ? "yellow" : "#6f6f6f"
    )
    .attr("fill-opacity", 0.5)
    .on("mouseover", function (event, d) {
      let tooltipX = xScale(d.crematorium) - 80;
      let tooltipY = yScale(d.daily) - 20;

      if (tooltipX < 0) {
        tooltipX = 0;
      } else if (tooltipX + 210 > width) {
        tooltipX = width - 210;
      }
      if (tooltipY - 30 < 0) {
        tooltipY += 40;
      }

      const tooltipText = `${d.name}, 화장로수: ${d.crematorium}, 일평균: ${d.daily}`;
      const textLength = tooltipText.length * 7;

      svg
        .append("rect")
        .attr("id", "tooltip-bg")
        .attr("x", tooltipX)
        .attr("y", tooltipY - 20)
        .attr("width", textLength + 50)
        .attr("height", 20)
        .attr("rx", 2)
        .attr("ry", 2)
        .style("fill", "white")
        .style("opacity", 0.2);

      svg
        .append("text")
        .attr("id", "tooltip")
        .attr("x", tooltipX + 10)
        .attr("y", tooltipY - 5)
        .attr("class", "tooltip-text")
        .text(tooltipText);
    })
    .on("mouseout", function (event, d) {
      svg.select("#tooltip").remove();
      svg.select("#tooltip-bg").remove();
    });

  const line = d3
    .line()
    .x((d) => xScale(d.crematorium))
    .y((d) => yScale(d.crematorium * 3.3));

  path = svg
    .append("path")
    .datum([{ crematorium: 0, cases: 0, daily: 0 }, ...data])
    .attr("stroke", "#6f6f6f")
    .attr("stroke-width", 1)
    .attr("d", line);

  const lastDatum = data[data.length - 1];

  const lineText = svg
    .append("text")
    .attr("class", "line-text")
    .attr("x", xScale(lastDatum.crematorium) + 470)
    .attr("y", yScale(lastDatum.crematorium * 3.3 - 3))
    .attr("dy", ".35em")
    .attr(
      "transform",
      `rotate(-21.5, ${xScale(lastDatum.crematorium) + 5}, ${yScale(
        lastDatum.crematorium * 3.3
      )})`
    )
    .text("정부 권장 가동횟수");

  // resize
  window.addEventListener("resize", updateChart);

  function updateChart() {
    width = parseInt(d3.select("#svg-container").style("width"));
    height = parseInt(d3.select("#svg-container").style("height"));

    svg.attr("width", width).attr("height", height);

    xScale.range([margin.left, width - margin.right]);
    yScale.range([height - margin.bottom, margin.top]);

    xAxisGroup
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis);
    yAxisGroup.call(yAxis);

    xAxisLabel.attr(
      "transform",
      `translate(${width / 2}, ${height - margin.bottom + 50})`
    );
    yAxisLabel.attr(
      "transform",
      `translate(${margin.left - 50}, ${height / 2})rotate(-90)`
    );

    svg
      .selectAll("circle")
      .attr("cx", (d) => xScale(d.crematorium))
      .attr("cy", (d) => yScale(d.daily))
      .attr("r", (d) => radiusScale(d.cases));

    path.attr("d", line);

    lineText
      .attr("x", xScale(lastDatum.crematorium) + 470)
      .attr("y", yScale(lastDatum.crematorium * 3.3 - 3))
      .attr(
        "transform",
        `rotate(-26, ${xScale(lastDatum.crematorium) + 5}, ${yScale(
          lastDatum.crematorium * 3.3
        )})`
      )
      .text("정부 권장 가동횟수");
  }
});
