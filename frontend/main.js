/*
  The functions that are called in this script are located in
  './dataFromAPI.js'
*/

btnHome.click()

let info;
let state;
let state_cases;
let chart;
let chart_cases;
let countyChart;
let ageChart;
let age_group;
let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

const btnSelectState = document.getElementById('states')

btnSelectState.addEventListener('change', function (event) {

  event.preventDefault();

  state = this.options[this.selectedIndex].value;

  covidOverTime(state, ["submission_date", "tot_death"]).then((info) => {

    let dates = [];
    let deaths = [];
    let cases = [];

    info.forEach((element) => {
      dates.push(element["submission_date"]);
      deaths.push(element["tot_death"]);
    });

    var covid_over_time = document.getElementById("trend-chart").getContext("2d");

    let chart_data = {
      labels: dates,
      datasets: [
        {
          data: deaths,
          label: "Total Covid-19 Deaths in " + state,
          fill: false,
          borderColor: "rgb(240, 0, 60)",
          tension: 0.1,
          responsive: true,
          maintainAspectRatio: false
        }
      ],
    }

    if (chart == undefined) {
      chart = new Chart(covid_over_time, {
        type: "line",
        data: chart_data,
        options: {
          responsive: true,
          maintainAspectRatio: false,

          scales: {
            xAxes: [{
              type: 'time'
            }]
          },

          tooltips: {
            callbacks: {
              title: function (t, d) {
                return formatDate(t[0].xLabel.split('T')[0])
              }
            }
          }
        },

        tension: 1
      });
    } else {
      chart.config.data = chart_data;
      chart.update()
    }
  });

  covidbyCounty(state).then((info) => {

    let county = [];
    let deaths = [];

    info.forEach((element) => {
      county.push(element["county_name"]);
      deaths.push(element["MAX(covid_death)"]);
    });

    var covid_by_county = document.getElementById("county-chart").getContext("2d");

    let chart_data = {
      labels: county,
      datasets: [
        {
          data: deaths,
          label: "Deaths in " + state + " by county",
          fill: false,
          borderColor: "rgb(255,69,0)",
          tension: 0.1,
          responsive: true,
          maintainAspectRatio: false,
          backgroundColor: "rgb(163, 0, 54)"
        }

      ],
    }

    if (countyChart == undefined) {
      countyChart = new Chart(covid_by_county, {
        type: "bar",
        data: chart_data,
        options: {
          responsive: true,
          maintainAspectRatio: false
        },
        borderColor: "rgb(240, 0, 60)"
      });
    } else {
      countyChart.config.data = chart_data;
      countyChart.update()
    }
  });
});


const btnSelectState2 = document.getElementById('states-2')
const btnSelectAge = document.getElementById('ages')
const btnAgeGroupChart = document.getElementById('btnStateTrend')

btnAgeGroupChart.addEventListener('click', regenerate_chart)
btnSelectState2.addEventListener('change', regenerate_chart)


function regenerate_chart() {

  let states = document.getElementById('states-2')
  let ages = document.getElementById("ages")

  state = states.options[states.selectedIndex].text;

  covidBySex(state, "All Sexes", "All Ages").then((info) => {
    let age_groups = [];
    let deaths = [];

    info.forEach((element) => {
      age_groups.push((element["age_group"].split('T')[0]));
      deaths.push(element["covid_19_deaths"]);
    });

    let chart_data = {
      labels: age_groups,
      datasets: [
        {
          data: deaths,
          label: "Deaths by age group in " + state,
          fill: false,
          borderColor: "rgba(0, 0, 0, 0.1)",
          tension: 0.1,
          backgroundColor: getColors(age_groups.length)
        },
      ],
    }

    var covid_by_sex = document.getElementById("state-chart").getContext("2d");

    if (ageChart == undefined) {
      ageChart = new Chart(covid_by_sex, {
        type: "doughnut",
        data: chart_data,
        options: {
          responsive: true
        }
      });
    } else {
      ageChart.config.data = chart_data;
      ageChart.update()
    }
  });
};

const btnSelectState3 = document.getElementById('states-3')

btnSelectState3.addEventListener('change', function (event) {

  event.preventDefault();

  state_cases = this.options[this.selectedIndex].value;

  covidOverTime(state_cases, ["submission_date", "tot_cases", "new_case"]).then((info) => {

    let dates = [];
    let tot_cases = [];
    let new_cases = [];

    info.forEach((element) => {
      dates.push(element["submission_date"]);
      tot_cases.push(element["tot_cases"]);
      new_cases.push(element["new_case"])
    });

    let cases_over_time = document.getElementById("cases-chart").getContext("2d");

    let chart_data = {
      labels: dates,
      datasets: [
        {
          data: tot_cases,
          yAxisID: "total",
          label: "Total Covid-19 Cases in " + state_cases,
          fill: false,
          borderColor: "rgb(240, 10, 10)",
          tension: 0.1,
          responsive: true,
          maintainAspectRatio: false
        },
        {
          data: new_cases,
          yAxisID: "new",
          label: "New cases",
          fill: false,
          borderColor: "rgb(85, 107, 47)",
          tension: 1,
        }
      ],
    }

    if (chart_cases == undefined) {
      chart_cases = new Chart(cases_over_time, {
        type: "line",
        data: chart_data,
        options: {
          responsive: true,
          scales: {
            xAxes: [{
              type: 'time'
            }], 
            yAxes: [{
                id: 'total',
                type: 'linear',
                position: 'left',
              }, {
                id: 'new',
                type: 'linear',
                position: 'right',
                
                gridLines: {
                  display: false // only want the grid lines for one axis to show up
                },
            }]

          },

          tooltips: {
            callbacks: {
              title: function (t, d) {
                return formatDate(t[0].xLabel.split('T')[0])
              }
            }
          }
        },

        tension: 1
      });
    } else {
      chart_cases.config.data = chart_data;
      chart_cases.update()
    }
  });
});


function formatDate(date) {
  let date_arr = date.split('-')
  let month = months[Number(date_arr[1]) - 1];

  return String(date_arr[2]) + " " + month + " " + String(date_arr[0])
}

function getColors(length) {
  let pallet = ["#0074D9", "#FF4136", "#2ECC40", "#FF851B", "#7FDBFF", "#B10DC9", "#FFDC00", "#001f3f", "#39CCCC", "#01FF70", "#85144b", "#F012BE", "#3D9970", "#111111", "#AAAAAA"];
  let colors = [];

  for (let i = 0; i < length; i++) {
    colors.push(pallet[i % (pallet.length - 1)]);
  }

  return colors;
}
