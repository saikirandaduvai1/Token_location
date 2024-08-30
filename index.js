const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'goodreads.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

//API location like country and state
app.get('/location/', async (request, response) => {
  const getLocation = `
  SELECT
  * 
  FROM location
  ORDER BY
  id;
  `
  const locationArray = await db.all(getLocation)
  response.send(locationArray)
})
//API city like city name or place
app.get('/city/', async (request, response) => {
  const getcityQuery = `
  SELECT
  *
  FROM city
  ORDER BY
  location_id;
  `
  const cityArray = await db.all(getcityQuery)
  response.send(cityArray)
})
// API location navigate place details
app.get('/location/:locationId/city/', async (request, response) => {
  const {locationId} = request.params
  const locationQuery = `
  SELECT
  location.id,
  location.country_name,
  location.state_name,
  location.weather_season,
  location.date,
  city.city_name,
  city.place_name,
  city.area_name_OR_area_NO
  FROM location INNER JOIN city ON location.id = city.location_id
  WHERE 
  location.id = ${locationId};
  `
  const locationArray = await db.all(locationQuery)
  response.send(locationArray)
})

// API UPDATE THE location
app.put('/location/:locationId/', async (request, response) => {
  const {locationId} = request.params
  const locationDetail = request.body

  const {id, countryName, stateName, weatherSeason, date} = locationDetail
  const updatelocationQuery = `
  UPDATE
  location
  SET 
  id = ${id},
  country_name='${countryName}',
  state_name='${stateName}',
  weather_season='${weatherSeason}',
  date='${date}'
  WHERE 
  id = ${locationId};
  `
  await db.run(updatelocationQuery)
  response.send('Book Updated Successfully')
})

//API post on new location
app.post('/location/', async (request, response) => {
  const locationDetail = request.body

  const {id, countryName, stateName, weatherSeason, date} = locationDetail
  const addLocationQuery = `
  INSERT INTO 
  location (id, country_name, state_name, weather_season, date)
  VALUES
  (
    ${id},
    '${countryName}',
    '${stateName}',
    '${weatherSeason}',
    '${date}'
  );
  `
  const dbResponse = await db.run(addLocationQuery)
  const locationId = dbResponse.lastID
  response.send({id: locationId})
})

//API delete location
app.delete('/location/:locationId/', async (request, response) => {
  const {locationId} = request.params
  const deletelocationQuery = `
  DELETE FROM
  location
  WHERE 
  id=${locationId};
  `
  await db.run(deletelocationQuery)
  response.send('Book Deleted Successfully')
})
// API city add
app.post('/city/', async (request, response) => {
  const cityDetail = request.body
  const {cityName, placeName, areaNameORAreaNO, locationId} = cityDetail

  const addCityQuery = `
  INSERT INTO
  city (city_name, place_name, area_name_OR_area_NO, location_id)
  VALUES
  (
    '${cityName}',
    '${placeName}',
    '${areaNameORAreaNO}',
    ${locationId}
  );
  `
  const dbResponse = await db.run(addCityQuery)
  const cityId = dbResponse.lastID
  response.send({location_id: cityId})
})
