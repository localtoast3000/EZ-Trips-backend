import express from 'express';
import { validateReqBody, isNull } from '../lib/helpers.js';
import Trip from '../db/models/Trip.js';
import { caseInsensitiveSearchString } from '../lib/helpers.js';
import { getMonth } from 'date-fns';
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

/////GET TRIPS FILTERED BY QUERYS

router.get('/filter', async (req, res) => {
  if (
    validateReqBody({
      body: req.query,
      expectedPropertys: [
        'startMonth',
        'endMonth',
        'maxBudget',
        'minBudget',
        'durationInDays',
        'tags',
      ],
      allowNull: true,
    })
  ) {
    let { startMonth, endMonth, minBudget, maxBudget, durationInDays, tags } = req.query;
    if (isNull(startMonth)) startMonth = getMonth(new Date()) + 1;
    if (isNull(endMonth)) endMonth = getMonth(new Date()) + 2;
    if (isNull(minBudget)) minBudget = 300;
    if (isNull(maxBudget)) maxBudget = 8000;

    const monthRangeSearch = {
      travelPeriod: {
        $elemMatch: { start: { $eq: startMonth }, end: { $eq: endMonth } },
      },
    };
    const priceRangeSearch = {
      program: { $elemMatch: { price: { $gte: minBudget, $lte: maxBudget } } },
    };

    const trips = await Trip.find({ $and: [monthRangeSearch, priceRangeSearch] });
    console.log(trips);
    res.json({ result: true, trips });
  } else res.json({ result: false, error: 'Invalid query' });
});

router.get('/searchbycountry', async (req, res) => {
  if (
    validateReqBody({
      body: req.query,
      expectedPropertys: ['country'],
    })
  ) {
    const { country } = req.query;
    if (isNull(country) || country.length < 3)
      return res.json({ result: false, error: 'Invalid country name' });
    else {
      const trips = await Trip.find({
        country: { $regex: caseInsensitiveSearchString(country) },
      });
      if (!trips.length > 0) return res.json({ result: false, error: 'No trips found' });
      else res.json({ result: true, trips });
    }
  } else res.json({ result: false, error: 'Invalid query' });
});

export default router;
