const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'covid19India.db')

const app = express()

app.use(express.json())

let database = null

const initialzing = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server: http://localhost:3000')
    })
  } catch (err) {
    console.log(`Error msg: ${err}`)
    process.exit(1)
  }
}

initialzing()

const stateConverting = each => {
  return {
    stateId: each.state_id,
    stateName: each.state_name,
    population: each.population,
  }
}

app.get('/states/', async (req, res) => {
  const getStatesQuery = `
  SELECT * FROM state;
  `
  const getStates = await db.all(getStatesQuery)
  res.send(getStates.map(each => stateConverting(each)))
})

app.get('/states/:stateId/', async (req, res) => {
  const {stateId} = req.params
  const getStatesById = `
  SELECT state_id AS stateId,
      state_name AS stateName,
      population FROM state 
  WHERE state_id = ${stateId};
  `
  const getStatesid = await db.get(getStatesById)
  res.send(getStatesid)
})

const districtConverting = each => {
  return {
    districtId: each.district_id,
  }
}

app.post('/districts/', async (req, res) => {
  const {districtName, stateId, cases, cured, active, deaths} = req.body
  const districtQuery = `
  INSERT INTO district
  (district_name, state_id, cases, cured, active, deaths)
  VALUES
    ('${districtName}', ${stateId}, '${cases}', '${cured}','${active}', '${deaths}');
  `
  const districtres = await db.run(districtQuery)
  res.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (req, res) => {
  const {districtId} = req.params
  const districtGetQuery = `
    SELECT 
    district_id AS districtId,
      district_name AS districtName,
      state_id AS stateId,
      cases,
      cured,
      active,
      deaths
       FROM district 
    WHERE district_id = ${districtId};
   `
  const getByid = await db.get(districtGetQuery)
  res.send(getByid)
})

app.delete('/districts/:districtId/', async (req, res) => {
  const {districtId} = req.params
  const deleteQuery = `
  DELETE FROM district 
  WHERE district_id = '${districtId}';
  `
  await db.run(deleteQuery)
  res.send('District Removed')
})

app.put('/districts/:districtId/', async (req, res) => {
  const {districtName, stateId, cases, cured, active, deaths} = req.body
  const {districtId} = req.params
  const updateQuery = `
  UPDATE district
  SET 
      district_name = '${districtName}',
    state_id = ${stateId},
    cases = '${cases}',
    cured = '${cured}',
    active = '${active}',
    deaths = '${deaths}'
  WHERE district_id = ${districtId}
  `
  await db.run(updateQuery)
  res.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (req, res) => {
  const {stateId} = req.params
  // const {cases, cured, active, deaths} = req.body
  const noofcases = `
   SELECT 
      SUM(district.cases) AS totalCases, 
      SUM(district.cured) AS totalCured, 
      SUM(district.active) AS totalActive, 
      SUM(district.deaths) AS totalDeaths 
    FROM 
      district 
    WHERE 
      district.state_id = ${stateId};
  `
  const sumOfCases = await db.get(noofcases)
  res.send(sumOfCases)
})

app.get('/districts/:districtId/details/', async (req, res) => {
  const {districtId} = req.params
  const districtNameQuery = `
      SELECT state.state_name as stateName 
    FROM district 
    INNER JOIN state ON district.state_id = state.state_id 
    WHERE district.district_id = ${districtId};
    `
  const stateNameQueryres = await db.get(districtNameQuery)
  res.send(stateNameQueryres)
})

module.exports = app
