import express from 'express';
import { validateReqBody } from '../lib/helpers.js';
import Trip from '../db/models/Trip.js';
const router = express.Router();

/////GET ALL TRIPS

router.get('/', (req, res) => {
  Trip.find().then((data) => {
    if (data) {
      res.json({ result: true, trips: data });
    } else {
      res.json({ result: false, error: 'No trips to show' });
    }
  });
});

/////GET TRIP BY ID

router.get('/tripById/:id', (req, res) => {
  console.log(req.params);
  if (validateReqBody({ body: req.params, expectedPropertys: ['id'] })) {
    Trip.findOne({ _id: req.params.id }).then((data) => {
      if (data) {
        console.log(data);
        res.json({ result: true, trip: data });
      } else {
        res.json({ result: false, error: 'Trip not found' });
      }
    });
  } else {
    res.json({ result: false, error: 'Invalid request parameters' });
  }
});

///GET TRIPS BY PARTNER

router.get('/byPartner/:partner', (req, res) => {
  if (validateReqBody({ body: req.params, expectedPropertys: ['partner'] })) {
    Trip.find({ name: req.params.partner }).then((data) => {
      if (data && data.length > 0) {
        res.json({ result: true, trips: data.trips });
      } else {
        res.json({ result: false, error: 'This partner has not listed trips yet' });
      }
    });
  } else {
    res.json({ result: false, error: 'Invalid request parameters' });
  }
});

/////GET TRIPS FILTERED BY PARAMS

router.get('/filter', (req, res) => {
  const filters = req.query;
  console.log(filters);
  //Array de réponse où push les résultats du filtre
  const response = [];
  //définition des constantes de mois pour comparer à l'intervale
  let startMonth = Number(filters.startMonth != '' ? filters.startMonth : 1);
  let endMonth = Number(filters.endMonth != '' ? filters.endMonth : 12);
  let minBudget = Number(filters.minBudget ? filters.minBudget : 0);
  let maxBudget = Number(filters.maxBudget ? filters.maxBudget : 30000);
  let searchInput = filters.searchInput != '' ? filters.searchInput : '';
  let tags = filters.tags ? filters.tags : [];
  console.log(startMonth, endMonth, minBudget, maxBudget);
  Trip.find().then((data) => {
    data.map((trip, i) => {
      //constantes du trip du catalogue à comparer
      let startMonthTrip = trip.travelPeriod[0].start; //début de la travel period du trip
      let endMonthTrip = trip.travelPeriod[0].end; //fin de la travel period du trip
      let minPriceTrip = trip.program[0].price; //prix du plus court programme = "à partir de...€"
      //est-ce que le tag fourni en query peut être retrouvé dans le tags Array du Trip (true par défaut si pas de valeur fournie)
      // let tagMatch = trip.tags.length > 0 && tags.length > 0 ? trip.tags.some(tag => tags.find(e => e==tag)) : true;
      if (
        !response.some((e) => e.id === trip.id) &&
        //condition pour que le budget matche
        minPriceTrip >= minBudget &&
        minPriceTrip <= maxBudget
        //condition pour que la travelPeriod matche
        // &&  startMonth<=startMonthTrip && endMonthTrip <= endMonth
        // && startMonthTrip <= endMonth && endMonth <= endMonthTrip
        // && tagMatch
      ) {
        response.push(trip);
      }
    });

    //Si les filtres sont des arrays de strings
    // else if ((key === 'tags' || key === 'included') && filters[key].length > 0) {
    //     data.map(trip => {
    //         if(trip[key].some(e => {
    //           filters[key].map (el => el.title === e)
    //         }) && !response.some(e => e.id === trip.id)) {
    //           console.log(trip.name)
    //         }
    //       })
    // }
    //pour tous les autres query parameters :

    //si la réponse contient au moins un trip, renvoyer la réponse
    if (response.length > 0) {
      res.json({ result: true, trips: response });
    }
    // si la réponse est vide, aucun voyage ne correspond à la recherche
    else {
      res.json({ result: false, error: 'No trips corresponding to the filters' });
    }
  })})
;

export default router;
