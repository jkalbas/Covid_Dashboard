async function covidOverTime(state = [], cols = []) {

  const endpoint = "get_data";
  const url = document.baseURI + endpoint;

  try {
    let data = {
      name: "covid_deaths_over_time",
      cols: cols,
      paras: (state.length == 0 ? [] : ["state='" + state + (!cols.includes('new_case') ? "'" : `' 
        AND new_case>-1 
        AND new_case NOT IN 
        (
          SELECT new_case
          FROM covid_deaths_over_time
          ORDER BY new_case DESC
          LIMIT 10
        )`
      ) // filter extremes
      ]),
      order: "submission_date"
    };

    const trend = await getData(url, data);
    return trend;

  } catch (error) {
    console.log(error);
    return;
  }
}

async function covidBySex(state = "United States", sex = "All Sexes", age = "All Ages") {

  const endpoint = "get_data";
  const url = document.baseURI + endpoint;

  try {
    let data = {
      name: "covid_deaths_by_sex",
      cols: ["age_group", "covid_19_deaths"],
      paras: ["state='" + state + "' AND sex='" + sex + `' AND age_group<>'${age}' AND "group" = 'By Total' 
        AND (
          age_group = '0-17 years' 
          OR age_group = '18-29 years'
          OR age_group = '30-39 years'
          OR age_group = '40-49 years'
          OR age_group = '50-64 years'
          OR age_group = '65-74 years'
          OR age_group = '75-84 years'
          OR age_group = '85 years and over' 
        )
        GROUP BY age_group`
      ],
      order: "age_group"
    };

    const trend = await getData(url, data);
    return trend;

  } catch (error) {
    console.log(error);
    return;
  }
}

async function covidbyCounty(state = []) {

  const endpoint = "get_data";
  const url = document.baseURI + endpoint;

  try {
    let data = {
      name: "covid_deaths_by_county",
      cols: ["county_name", "MAX(covid_death)"],
      paras: (state.length == 0 ? [] : ["state_name='" + state + "' GROUP BY county_name"]),
      order: "covid_death DESC"
    };

    const trend = await getData(url, data);
    return trend;

  } catch (error) {
    console.log(error);
    return;
  }
}

async function getData(url, data) {
  const options = {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  const response = await fetch(url, options);
  return response.json();
}
